import { unitSymbol } from "./types.ts";
import type { City, CurrentWeather, TemperatureUnit } from "./types.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const REQUEST_TIMEOUT_MS = 10_000;

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

async function requestJson(url: URL): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new ApiError(
        `La petición a Open-Meteo tardó más de ${REQUEST_TIMEOUT_MS / 1000} segundos en responder.`,
      );
    }
    throw new ApiError(NETWORK_ERROR_MESSAGE);
  }
  if (!response.ok) {
    throw new ApiError(`Open-Meteo respondió con el estado HTTP ${response.status}.`);
  }
  try {
    return await response.json();
  } catch {
    throw new ApiError("La respuesta de Open-Meteo no es un JSON válido.");
  }
}

export async function searchCity(rawName: string): Promise<City> {
  const cityName = rawName.trim();
  if (cityName.length === 0) {
    throw new CityNotFoundError("");
  }
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", cityName);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");
  const data = assertRecord(await requestJson(url), "La respuesta de geocoding");
  const results = data["results"];
  if (!Array.isArray(results) || results.length === 0) {
    throw new CityNotFoundError(cityName);
  }
  const first = results[0];
  if (!first) {
    throw new CityNotFoundError(cityName);
  }
  const firstRecord = assertRecord(first, "El resultado de geocoding");
  const id = assertNumber(firstRecord["id"], "el identificador de la ciudad");
  const name = assertString(firstRecord["name"], "el nombre de la ciudad");
  const latitude = assertNumber(firstRecord["latitude"], "la latitud");
  const longitude = assertNumber(firstRecord["longitude"], "la longitud");
  return {
    id,
    name,
    admin1: asOptionalString(firstRecord["admin1"]),
    country: asOptionalString(firstRecord["country"]),
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
