import { afterEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/api.feature
import { MADRID, dailyFixture, forecastBody, weatherBody } from "../helpers/fixtures.ts";
import { installFetch, jsonResponse, type FetchMock } from "../helpers/fetch.ts";
import { ApiError } from "../../src/api/errors.ts";
import { getForecast, getWeather, parseDailyForecast } from "../../src/api/weather.ts";
import type { Forecast } from "../../src/types/Weather.ts";

/** El parser espera un `Record`, así que el fixture sin tipar se reduce aquí. */
function asDaily(raw: unknown): Record<string, unknown> {
  return raw as Record<string, unknown>;
}

describe("getWeather", () => {
  let fetchMock: FetchMock;
  afterEach(() => {
    fetchMock.restore();
  });

  test("construye la URL de clima con latitud, longitud y current", async () => {
    fetchMock = installFetch(() => jsonResponse(weatherBody(21.5)));
    const weather = await getWeather(MADRID, "celsius");
    expect(weather).toEqual({ temperature: 21.5, unitSymbol: "°C" });
    const url = fetchMock.calls[0]?.url;
    expect(url?.origin).toBe("https://api.open-meteo.com");
    expect(url?.pathname).toBe("/v1/forecast");
    expect(url?.searchParams.get("latitude")).toBe(String(MADRID.latitude));
    expect(url?.searchParams.get("longitude")).toBe(String(MADRID.longitude));
    expect(url?.searchParams.get("current")).toBe("temperature_2m");
    expect(url?.searchParams.get("temperature_unit")).toBeNull();
  });

  test("pide fahrenheit solo con unidad fahrenheit", async () => {
    fetchMock = installFetch(() => jsonResponse(weatherBody(70, "°F")));
    const weather = await getWeather(MADRID, "fahrenheit");
    expect(weather.unitSymbol).toBe("°F");
    expect(fetchMock.calls[0]?.url?.searchParams.get("temperature_unit")).toBe("fahrenheit");
  });

  test("usa el símbolo de la API y no el de la unidad configurada", async () => {
    fetchMock = installFetch(() => jsonResponse(weatherBody(10, "°C")));
    const weather = await getWeather(MADRID, "fahrenheit");
    expect(weather).toEqual({ temperature: 10, unitSymbol: "°C" });
  });

  test("usa un símbolo fallback si la API no trae unidad", async () => {
    fetchMock = installFetch(() =>
      jsonResponse({
        current: { temperature_2m: 8 },
        current_units: { temperature_2m: "" },
      }),
    );
    const weather = await getWeather(MADRID, "fahrenheit");
    expect(weather.unitSymbol).toBe("°F");
  });

  test("lanza ApiError si falta el bloque current", async () => {
    fetchMock = installFetch(() => jsonResponse({}));
    const promise: Promise<unknown> = getWeather(MADRID, "celsius");
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toThrow("La respuesta de Open-Meteo no es válida.");
    expect(fetchMock.calls).toHaveLength(1);
  });

  test("lanza ApiError si la temperatura no es un número", async () => {
    fetchMock = installFetch(() => jsonResponse({ current: { temperature_2m: "12" } }));
    const promise: Promise<unknown> = getWeather(MADRID, "celsius");
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toThrow(
      "El campo la temperatura actual debe ser un número.",
    );
    expect(fetchMock.calls).toHaveLength(1);
  });
});

describe("getForecast", () => {
  let fetchMock: FetchMock;
  afterEach(() => {
    fetchMock.restore();
  });

  test("construye la URL de pronóstico con daily, días y timezone", async () => {
    fetchMock = installFetch(() => jsonResponse(forecastBody()));
    const forecast = await getForecast(MADRID, "celsius");
    expect(forecast.unitSymbol).toBe("°C");
    expect(forecast.days).toHaveLength(7);
    expect(forecast.days[0]).toMatchObject({
      date: "2026-11-04",
      weatherCode: 0,
      temperatureMax: 12,
      temperatureMin: 4,
      precipitationProbability: 0,
    });
    const url = fetchMock.calls[0]?.url;
    expect(url?.origin).toBe("https://api.open-meteo.com");
    expect(url?.pathname).toBe("/v1/forecast");
    expect(url?.searchParams.get("daily")).toBe(
      "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
    );
    expect(url?.searchParams.get("forecast_days")).toBe("7");
    expect(url?.searchParams.get("timezone")).toBe("auto");
    expect(url?.searchParams.get("temperature_unit")).toBeNull();
  });

  test("pide fahrenheit solo con unidad fahrenheit", async () => {
    fetchMock = installFetch(() => jsonResponse(forecastBody()));
    await getForecast(MADRID, "fahrenheit");
    expect(fetchMock.calls[0]?.url?.searchParams.get("temperature_unit")).toBe("fahrenheit");
  });

  test("usa el fallback de la unidad configurada si la API no trae daily_units", async () => {
    fetchMock = installFetch(() =>
      jsonResponse({
        daily: {
          time: ["2026-11-04"],
          temperature_2m_max: [1],
          temperature_2m_min: [0],
          weather_code: [0],
        },
      }),
    );
    const forecast = await getForecast(MADRID, "fahrenheit");
    expect(forecast.unitSymbol).toBe("°F");
  });

  test("delega la lluvia null en parseDailyForecast", async () => {
    fetchMock = installFetch(() => jsonResponse(forecastBody()));
    const forecast: Forecast = await getForecast(MADRID, "celsius");
    const lastDay = forecast.days[6];
    expect(lastDay?.precipitationProbability).toBeNull();
    expect(lastDay?.date).toBe("2026-11-10");
  });

  test("lanza ApiError si falta el bloque daily", async () => {
    fetchMock = installFetch(() => jsonResponse({}));
    await expect(getForecast(MADRID, "celsius")).rejects.toThrow(
      "La respuesta de Open-Meteo no es válida.",
    );
  });

  test("lanza ApiError si los arrays diarios son inconsistentes", async () => {
    fetchMock = installFetch(() =>
      jsonResponse({
        daily: {
          time: ["2026-11-04"],
          temperature_2m_max: [1],
          temperature_2m_min: [0],
          weather_code: [0, 3],
        },
      }),
    );
    const promise: Promise<unknown> = getForecast(MADRID, "celsius");
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toThrow(
      "El campo el código del tiempo debe ser un array de números.",
    );
    expect(fetchMock.calls).toHaveLength(1);
  });
});

describe("parseDailyForecast", () => {
  describe("días y lluvia", () => {
    test("mapea cada día y acepta nulls en la lluvia", () => {
      const data = asDaily(
        dailyFixture({
          time: ["2026-11-04", "2026-11-05", "2026-11-06"],
          max: [30, 31, 32],
          min: [10, 11, 12],
          code: [45, 61, 95],
          rain: [null, 15, null],
        }),
      );
      const forecast = parseDailyForecast(data, "celsius");
      expect(forecast.unitSymbol).toBe("°C");
      expect(forecast.days).toHaveLength(3);
      expect(forecast.days[1]).toEqual({
        date: "2026-11-05",
        weatherCode: 61,
        temperatureMax: 31,
        temperatureMin: 11,
        precipitationProbability: 15,
      });
      expect(forecast.days[0]?.precipitationProbability).toBeNull();
      expect(forecast.days[2]?.precipitationProbability).toBeNull();
    });

    test("lluvia ausente se convierte en nulls por día", () => {
      const data = asDaily(
        dailyFixture({
          time: ["2026-11-04", "2026-11-05"],
          max: [30, 31],
          min: [10, 11],
          code: [0, 1],
        }),
      );
      const forecast = parseDailyForecast(data, "celsius");
      expect(forecast.days.every((day) => day.precipitationProbability === null)).toBe(true);
    });

    test("lluvia con distinta longitud se tratan como nulls", () => {
      const data = asDaily(
        dailyFixture({
          time: ["2026-11-04", "2026-11-05"],
          max: [30, 31],
          min: [10, 11],
          code: [0, 1],
          rain: [15],
        }),
      );
      const forecast = parseDailyForecast(data, "celsius");
      expect(forecast.days.every((day) => day.precipitationProbability === null)).toBe(true);
    });
  });

  describe("fallos", () => {
    test("time vacío, no array o ausente lanza ApiError", () => {
      expect(() => parseDailyForecast(asDaily(dailyFixture({ time: [] })), "celsius")).toThrow(
        ApiError,
      );
      expect(() =>
        parseDailyForecast(asDaily(dailyFixture({ time: "febrero" })), "celsius"),
      ).toThrow("El campo las fechas del pronóstico debe ser un array no vacío.");
      expect(() => parseDailyForecast(asDaily(dailyFixture({})), "celsius")).toThrow(
        "El campo las fechas del pronóstico debe ser un array no vacío.",
      );
    });

    test("temperaturas faltantes o de otra longitud lanzan ApiError", () => {
      const base = { time: ["2026-11-04"], min: [10], code: [0] };
      expect(() => parseDailyForecast(asDaily(dailyFixture(base)), "celsius")).toThrow(
        "El campo la temperatura máxima debe ser un array de números.",
      );
      // Longitud distinta de `time` se trata como array inválido.
      expect(() =>
        parseDailyForecast(asDaily(dailyFixture({ ...base, max: [30, 31] })), "celsius"),
      ).toThrow("El campo la temperatura máxima debe ser un array de números.");
    });

    test("valores no numéricos dentro de los arrays lanzan ApiError", () => {
      const data = asDaily(
        dailyFixture({
          time: ["2026-11-04"],
          max: ["30"],
          min: [10],
          code: [0],
        }),
      );
      expect(() => parseDailyForecast(data, "celsius")).toThrow(
        "El campo el valor del array debe ser un número.",
      );
    });

    test("códigos de tiempo no numéricos lanzan ApiError", () => {
      const data = asDaily(
        dailyFixture({
          time: ["2026-11-04"],
          max: [30],
          min: [10],
          code: [null],
        }),
      );
      expect(() => parseDailyForecast(data, "celsius")).toThrow(
        "El campo el código del tiempo debe ser un número.",
      );
    });

    test("fechas no strings lanzan ApiError", () => {
      const data = asDaily(
        dailyFixture({
          time: [20261104],
          max: [30],
          min: [10],
          code: [0],
        }),
      );
      expect(() => parseDailyForecast(data, "celsius")).toThrow(
        "El campo las fechas del pronóstico debe ser texto no vacío.",
      );
    });
  });

  describe("unidades", () => {
    test("usa la unidad de daily_units anidado si llega", () => {
      const data = asDaily(
        dailyFixture({
          time: ["2026-11-04"],
          max: [30],
          min: [10],
          code: [0],
          units: { temperature_2m_max: "°F" },
        }),
      );
      expect(parseDailyForecast(data, "celsius").unitSymbol).toBe("°F");
    });

    test("usa el fallback de la unidad configurada sin daily_units", () => {
      const data = asDaily(
        dailyFixture({ time: ["2026-11-04"], max: [30], min: [10], code: [0] }),
      );
      expect(parseDailyForecast(data, "fahrenheit").unitSymbol).toBe("°F");
    });
  });
});
