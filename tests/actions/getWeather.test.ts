import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/actions.feature
import { MADRID, OTTAWA, makeConfig, weatherBody } from "../helpers/fixtures.ts";
import { installFetch, jsonResponse, type FetchMock } from "../helpers/fetch.ts";
import { captureConsole } from "../helpers/io.ts";
import { showDefaultCityWeather } from "../../src/actions/getWeather.ts";
import { ApiError } from "../../src/api/errors.ts";
import { NO_CITY_DEFAULT_MESSAGE } from "../../src/utils/constants.ts";

describe("showDefaultCityWeather", () => {
  let fetchMock: FetchMock;
  let output: ReturnType<typeof captureConsole>;

  beforeEach(() => {
    output = captureConsole();
  });

  afterEach(() => {
    fetchMock.restore();
    output.restore();
  });

  test("sin ciudad default imprime el aviso y no consulta nada", async () => {
    fetchMock = installFetch();
    await showDefaultCityWeather(makeConfig());
    expect(output.error).toContain(NO_CITY_DEFAULT_MESSAGE);
    expect(fetchMock.calls).toHaveLength(0);
  });

  test("consulta la ciudad default en celsius", async () => {
    fetchMock = installFetch(() => jsonResponse(weatherBody(21.5)));
    await showDefaultCityWeather(makeConfig({ defaultCityId: MADRID.id, cities: [MADRID] }));
    expect(output.log).toContain("Temperatura actual: 21.5 °C");
    expect(fetchMock.calls).toHaveLength(1);
    expect(fetchMock.calls[0]?.url?.searchParams.get("latitude")).toBe(String(MADRID.latitude));
    expect(fetchMock.calls[0]?.url?.searchParams.get("temperature_unit")).toBeNull();
  });

  test("con unidad fahrenheit pide y muestra °F", async () => {
    fetchMock = installFetch(() => jsonResponse(weatherBody(70.7, "°F")));
    await showDefaultCityWeather(
      makeConfig({
        unit: "fahrenheit",
        defaultCityId: OTTAWA.id,
        cities: [OTTAWA],
      }),
    );
    expect(output.log).toContain("Temperatura actual: 70.7 °F");
    expect(fetchMock.calls[0]?.url?.searchParams.get("temperature_unit")).toBe("fahrenheit");
  });

  test("un error de la API rechaza la promesa (se gestiona en index)", async () => {
    fetchMock = installFetch(() => jsonResponse({}, 404));
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID] });
    const failure = showDefaultCityWeather(config);
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toThrow("Open-Meteo respondió con el estado HTTP 404.");
    expect(fetchMock.calls).toHaveLength(1);
  });

  test("una configuración con ciudades pero sin default no consulta nada", async () => {
    fetchMock = installFetch();
    await showDefaultCityWeather(makeConfig({ cities: [MADRID, OTTAWA] }));
    expect(fetchMock.calls).toHaveLength(0);
  });
});
