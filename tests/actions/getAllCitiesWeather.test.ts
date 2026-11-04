import { afterEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/actions.feature
import {
  MADRID,
  OTTAWA,
  makeCity,
  makeConfig,
  weatherBody,
} from "../helpers/fixtures.ts";
import {
  installFetch,
  jsonResponse,
  type FetchHandler,
  type FetchMock,
} from "../helpers/fetch.ts";
import { captureConsole } from "../helpers/io.ts";
import { showAllCitiesWeather } from "../../src/actions/getAllCitiesWeather.ts";
import { NO_SAVED_CITIES_MESSAGE } from "../../src/utils/constants.ts";

describe("showAllCitiesWeather", () => {
  let fetchMock: FetchMock;
  let output: ReturnType<typeof captureConsole>;

  afterEach(() => {
    fetchMock.restore();
    output.restore();
  });

  test("sin ciudades imprime el aviso y no consulta nada", async () => {
    fetchMock = installFetch();
    output = captureConsole();
    await showAllCitiesWeather(makeConfig());
    expect(output.error).toContain(NO_SAVED_CITIES_MESSAGE);
    expect(fetchMock.calls).toHaveLength(0);
  });

  test("consulta todas las ciudades y las muestra en orden", async () => {
    const config = makeConfig({ cities: [MADRID, OTTAWA] });
    const handler: FetchHandler = (url) => jsonResponse(
      weatherBody(url.searchParams.get("latitude") === String(MADRID.latitude) ? 21.5 : 8),
    );
    fetchMock = installFetch(handler, handler);
    output = captureConsole();
    await showAllCitiesWeather(config);
    const printed = output.log;
    expect(printed).toContain(`Temperatura actual: 21.5 °C`);
    expect(printed).toContain("Ottawa");
    expect(fetchMock.calls).toHaveLength(2);
    expect(fetchMock.calls[0]?.url?.searchParams.get("latitude")).toBe(String(MADRID.latitude));
    expect(fetchMock.calls[1]?.url?.searchParams.get("latitude")).toBe(String(OTTAWA.latitude));
    expect(printed.indexOf("Madrid")).toBeLessThan(printed.indexOf("Ottawa"));
  });

  test("una ciudad que falla imprime su error y las demás continúan", async () => {
    const config = makeConfig({ cities: [MADRID, OTTAWA] });
    const handler: FetchHandler = (url) =>
      url.searchParams.get("latitude") === String(MADRID.latitude)
        ? jsonResponse({}, 404)
        : jsonResponse(weatherBody(8));
    fetchMock = installFetch(handler, handler);
    output = captureConsole();
    await showAllCitiesWeather(config);
    const printed = output.printed;
    expect(printed).toContain("Madrid — Madrid, España: Open-Meteo respondió con el estado HTTP 404.");
    expect(printed).toContain("Temperatura actual: 8 °C");
  });

  test("con una sola ciudad fallando también se informa el error", async () => {
    const config = makeConfig({ cities: [makeCity()] });
    fetchMock = installFetch(() => jsonResponse({}, 404));
    output = captureConsole();
    await showAllCitiesWeather(config);
    expect(output.printed).toContain("Ottawa — Ontario, Canada: Open-Meteo respondió con el estado HTTP 404.");
  });
});
