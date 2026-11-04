import { afterEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/actions.feature
import { MADRID, OTTAWA, forecastBody, makeCity, makeConfig } from "../helpers/fixtures.ts";
import { installFetch, jsonResponse, type FetchHandler, type FetchMock } from "../helpers/fetch.ts";
import { captureConsole } from "../helpers/io.ts";
import { showAllCitiesForecast } from "../../src/actions/getForecast.ts";
import { NO_SAVED_CITIES_MESSAGE } from "../../src/utils/constants.ts";

describe("showAllCitiesForecast", () => {
  let fetchMock: FetchMock;
  let output: ReturnType<typeof captureConsole>;

  afterEach(() => {
    fetchMock.restore();
    output.restore();
  });

  test("sin ciudades imprime el aviso y no consulta nada", async () => {
    fetchMock = installFetch();
    output = captureConsole();
    await showAllCitiesForecast(makeConfig());
    expect(output.error).toContain(NO_SAVED_CITIES_MESSAGE);
    expect(fetchMock.calls).toHaveLength(0);
  });

  test("consulta todas las ciudades y muestra los 7 días de cada una", async () => {
    const config = makeConfig({ cities: [MADRID, OTTAWA] });
    fetchMock = installFetch(
      () => jsonResponse(forecastBody()),
      () => jsonResponse(forecastBody()),
    );
    output = captureConsole();
    await showAllCitiesForecast(config);
    const printed = output.log;
    expect(printed).toContain("Pronóstico de 7 días:");
    expect(printed).toContain("jue 5 nov");
    expect(printed).toContain("Ottawa");
    expect(printed).toContain("Lluvia —");
    expect(fetchMock.calls).toHaveLength(2);
    expect(fetchMock.calls[0]?.url?.searchParams.get("latitude")).toBe(String(MADRID.latitude));
    expect(fetchMock.calls[1]?.url?.searchParams.get("latitude")).toBe(String(OTTAWA.latitude));
    expect(fetchMock.calls[0]?.url?.searchParams.get("forecast_days")).toBe("7");
  });

  test("con fahrenheit pide la unidad y la refleja en las temperaturas", async () => {
    const config = makeConfig({ unit: "fahrenheit", cities: [MADRID] });
    fetchMock = installFetch(() => jsonResponse(forecastBody()));
    output = captureConsole();
    await showAllCitiesForecast(config);
    expect(fetchMock.calls[0]?.url?.searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(output.log).toContain("Máx 12 °F");
  });

  test("una ciudad que falla muestra su error y el resto continúa", async () => {
    const config = makeConfig({ cities: [MADRID, OTTAWA] });
    const handler: FetchHandler = (url) =>
      url.searchParams.get("latitude") === String(MADRID.latitude)
        ? jsonResponse({}, 404)
        : jsonResponse(forecastBody());
    fetchMock = installFetch(handler, handler);
    output = captureConsole();
    await showAllCitiesForecast(config);
    const printed = output.printed;
    expect(printed).toContain("Madrid — Madrid, España: Open-Meteo respondió con el estado HTTP 404.");
    expect(printed).toContain("Pronóstico de 7 días:");
    expect(fetchMock.calls).toHaveLength(2);
  });

  test("con una sola ciudad fallando también se informa el error", async () => {
    const config = makeConfig({ cities: [makeCity()] });
    fetchMock = installFetch(() => jsonResponse({}, 404));
    output = captureConsole();
    await showAllCitiesForecast(config);
    expect(output.printed).toContain("Ottawa — Ontario, Canada: Open-Meteo respondió con el estado HTTP 404.");
  });
});
