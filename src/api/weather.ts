import { requestJson } from "./client.ts";
import { ApiError } from "./errors.ts";
import {
  asOptionalRecord,
  asOptionalString,
  assertNumber,
  assertRecord,
  assertString,
} from "./validation.ts";
import type { City } from "../types/City.ts";
import type { CurrentWeather, DailyForecast, Forecast } from "../types/Weather.ts";
import type { TemperatureUnit } from "../types/Config.ts";
import { unitSymbol } from "../utils/format.ts";
import { FORECAST_DAYS, FORECAST_URL } from "../utils/constants.ts";

const MALFORMED_RESPONSE_MESSAGE = "La respuesta de Open-Meteo no es válida.";
const DAILY_FIELDS = "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max";

/** Clima actual de una ciudad. */
export async function getWeather(city: City, unit: TemperatureUnit): Promise<CurrentWeather> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("current", "temperature_2m");
  if (unit === "fahrenheit") {
    url.searchParams.set("temperature_unit", "fahrenheit");
  }
  const data = assertRecord(await requestJson(url), "La respuesta del clima");
  const current = asOptionalRecord(data["current"]);
  if (!current) {
    throw new ApiError(MALFORMED_RESPONSE_MESSAGE);
  }
  const temperature = assertNumber(current["temperature_2m"], "la temperatura actual");
  const currentUnits = asOptionalRecord(data["current_units"]);
  const apiUnitSymbol = currentUnits ? asOptionalString(currentUnits["temperature_2m"]) : null;
  return {
    temperature,
    unitSymbol: apiUnitSymbol ?? unitSymbol(unit),
  };
}

/** Pronóstico de 7 días para una ciudad. */
export async function getForecast(city: City, unit: TemperatureUnit): Promise<Forecast> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("daily", DAILY_FIELDS);
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set("timezone", "auto");
  if (unit === "fahrenheit") {
    url.searchParams.set("temperature_unit", "fahrenheit");
  }
  const data = assertRecord(await requestJson(url), "La respuesta del pronóstico");
  const daily = asOptionalRecord(data["daily"]);
  if (!daily) {
    throw new ApiError(MALFORMED_RESPONSE_MESSAGE);
  }
  return parseDailyForecast(daily, unit);
}

/**
 * Valida y traduce el bloque `daily` de Open-Meteo a `Forecast`.
 * `precipitation_probability_max` es opcional: los valores ausentes se guardan como `null`.
 */
export function parseDailyForecast(daily: Record<string, unknown>, unit: TemperatureUnit): Forecast {
  const time = assertStringArray(daily["time"], "las fechas del pronóstico");
  const max = assertNumberArray(daily["temperature_2m_max"], "la temperatura máxima", time.length);
  const min = assertNumberArray(daily["temperature_2m_min"], "la temperatura mínima", time.length);
  const codes = assertNumberArray(daily["weather_code"], "el código del tiempo", time.length);
  const rain = asOptionalNumberArray(
    daily["precipitation_probability_max"],
    time.length,
  );
  const days: DailyForecast[] = time.map((date, index) => {
    const maxTemp = max[index];
    const minTemp = min[index];
    const code = codes[index];
    if (maxTemp === undefined || minTemp === undefined || code === undefined) {
      throw new ApiError(MALFORMED_RESPONSE_MESSAGE);
    }
    return {
      date,
      weatherCode: code,
      temperatureMax: maxTemp,
      temperatureMin: minTemp,
      precipitationProbability: rain?.[index] ?? null,
    };
  });
  const dailyUnits = asOptionalRecord(daily["daily_units"]);
  const apiUnitSymbol = dailyUnits ? asOptionalString(dailyUnits["temperature_2m_max"]) : null;
  return {
    days,
    unitSymbol: apiUnitSymbol ?? unitSymbol(unit),
  };
}

function assertStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(`El campo ${label} debe ser un array no vacío.`);
  }
  return value.map((item) => assertString(item, label));
}

function assertNumberArray(value: unknown, label: string, length: number): number[] {
  const result = asOptionalNumberArray(value, length);
  if (result === null) {
    throw new ApiError(`El campo ${label} debe ser un array de números.`);
  }
  return result.map((item) => {
    if (item === null) {
      throw new ApiError(`El campo ${label} debe ser un número.`);
    }
    return item;
  });
}

/** Igual que `assertNumberArray`, pero acepta `null` en cada posición. */
function asOptionalNumberArray(value: unknown, length: number): (number | null)[] | null {
  if (!Array.isArray(value) || value.length !== length) {
    return null;
  }
  return value.map((item) => (item === null ? null : assertNumber(item, "el valor del array")));
}
