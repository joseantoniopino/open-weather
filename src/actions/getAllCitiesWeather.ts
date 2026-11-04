import { getWeather } from "../api/weather.ts";
import { withLoading } from "../presentation/loading.ts";
import { displayCityWeather, printBlankLine, printError } from "../presentation/output.ts";
import type { AppConfig } from "../types/Config.ts";
import type { City } from "../types/City.ts";
import type { CurrentWeather } from "../types/Weather.ts";
import { formatCity } from "../utils/format.ts";
import { NO_SAVED_CITIES_MESSAGE } from "../utils/constants.ts";
import { describeApiError, loadingLabel } from "./shared.ts";

interface CityWeatherOutcome {
  city: City;
  weather: CurrentWeather | null;
  errorText: string | null;
}

/** Opción 2: clima actual de todas las ciudades guardadas. */
export async function showAllCitiesWeather(config: AppConfig): Promise<void> {
  const cities = config.cities;
  if (cities.length === 0) {
    printError(NO_SAVED_CITIES_MESSAGE);
    return;
  }
  const outcomes = await withLoading(loadingLabel("Consultando el clima", cities.length), () =>
    Promise.all(cities.map((city) => fetchCityWeather(city, config.unit))),
  );

  printBlankLine();
  for (const outcome of outcomes) {
    if (outcome.errorText !== null || outcome.weather === null) {
      printError(
        `${formatCity(outcome.city)}: ${outcome.errorText ?? "No se pudo obtener el clima."}`,
      );
      continue;
    }
    displayCityWeather(outcome.city, outcome.weather);
  }
}

async function fetchCityWeather(city: City, unit: AppConfig["unit"]): Promise<CityWeatherOutcome> {
  let weather: CurrentWeather | null = null;
  let errorText: string | null = null;
  try {
    weather = await getWeather(city, unit);
  } catch (error) {
    errorText = describeApiError(error, "No se pudo obtener el clima.");
  }
  return { city, weather, errorText };
}
