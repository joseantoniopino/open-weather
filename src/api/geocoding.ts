import { requestJson } from "./client.ts";
import { CityNotFoundError } from "./errors.ts";
import { asOptionalString, assertNumber, assertRecord, assertString } from "./validation.ts";
import type { City, CityMatches } from "../types/City.ts";
import { GEOCODING_RESULT_LIMIT, GEOCODING_URL } from "../utils/constants.ts";

/** Obtiene hasta `GEOCODING_RESULT_LIMIT` candidatos para un nombre de ciudad. */
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
