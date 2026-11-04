import { unitSymbol } from "./types.ts";
import type { City, CurrentWeather, DailyForecast, Forecast, TemperatureUnit } from "./types.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 10_000;
const GEOCODING_RESULT_LIMIT = 10;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

const NETWORK_ERROR_MESSAGE =
  "No se pudo conectar con Open-Meteo. Revisa tu conexión a internet e inténtalo de nuevo.";
const MALFORMED_RESPONSE_MESSAGE = "La respuesta de Open-Meteo no es válida.";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export class CityNotFoundError extends Error {
  constructor(cityName: string) {
    super(`No se encontró la ciudad «${cityName}».`);
    this.name = "CityNotFoundError";
  }
}

/**
 * Fallo transitorio (sin red, timeout o 5xx/429): merece un reintento.
 * No se exporta: tras agotar los reintentos se relanza tal cual y el llamador
 * solo ve un `ApiError` con el mensaje en español.
 */
class TransientApiError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = "TransientApiError";
  }
}

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(`${label} debe ser un objeto JSON.`);
  }
  return value as Record<string, unknown>;
}

function assertNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ApiError(`El campo ${label} debe ser un número.`);
  }
  return value;
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(`El campo ${label} debe ser texto no vacío.`);
  }
  return value;
}

function asOptionalString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}

/**
 * Realiza la petición con un reintento automático ante fallos transitorios
 * (microcortes de red/DNS, timeouts o 5xx/429 de Open-Meteo). Los errores de
 * cliente (4xx) y las respuestas malformadas no se reintentan: volver a
 * pedirlos daría el mismo resultado.
 */
async function requestJson(url: URL): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await sleep(RETRY_DELAY_MS);
    }
    try {
      return await requestJsonOnce(url);
    } catch (error) {
      if (!(error instanceof TransientApiError) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}

async function requestJsonOnce(url: URL): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new TransientApiError(
        `La petición a Open-Meteo tardó más de ${REQUEST_TIMEOUT_MS / 1000} segundos en responder.`,
      );
    }
    throw new TransientApiError(NETWORK_ERROR_MESSAGE);
  }
  if (!response.ok) {
    const message = `Open-Meteo respondió con el estado HTTP ${response.status}.`;
    if (isRetryableStatus(response.status)) {
      throw new TransientApiError(message);
    }
    throw new ApiError(message);
  }
  try {
    return await response.json();
  } catch {
    throw new ApiError("La respuesta de Open-Meteo no es un JSON válido.");
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resultados no vacíos de una búsqueda de ciudad. */
export type CityMatches = [City, ...City[]];

export async function searchCities(rawName: string): Promise<CityMatches> {
  const cityName = rawName.trim();
  if (cityName.length === 0) {
    throw new CityNotFoundError("");
  }
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", cityName);
  url.searchParams.set("count", String(GEOCODING_RESULT_LIMIT));
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");
  const data = assertRecord(await requestJson(url), "La respuesta de geocoding");
  const results = data["results"];
  if (!Array.isArray(results) || results.length === 0) {
    throw new CityNotFoundError(cityName);
  }
  const cities = results.map((item) => parseCityResult(assertRecord(item, "El resultado de geocoding")));
  const [first, ...rest] = cities;
  if (!first) {
    throw new CityNotFoundError(cityName);
  }
  return [first, ...rest];
}

function parseCityResult(value: Record<string, unknown>): City {
  const id = assertNumber(value["id"], "el identificador de la ciudad");
  const name = assertString(value["name"], "el nombre de la ciudad");
  const latitude = assertNumber(value["latitude"], "la latitud");
  const longitude = assertNumber(value["longitude"], "la longitud");
  return {
    id,
    name,
    admin1: asOptionalString(value["admin1"]),
    country: asOptionalString(value["country"]),
    latitude,
    longitude,
  };
}

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

function asOptionalRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

const FORECAST_DAYS = 7;
const DAILY_FIELDS = "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max";

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
