import { getWeather } from "../api/weather.ts";
import { withLoading } from "../presentation/loading.ts";
import { displayCityWeather, printError } from "../presentation/output.ts";
import { findCityById } from "../storage/citiesStorage.ts";
import type { AppConfig } from "../types/Config.ts";
import { NO_CITY_DEFAULT_MESSAGE } from "../utils/constants.ts";

/** Opción 1: clima actual de la ciudad default. */
export async function showDefaultCityWeather(config: AppConfig): Promise<void> {
  const city = findCityById(config, config.defaultCityId);
  if (!city) {
    printError(NO_CITY_DEFAULT_MESSAGE);
    return;
  }
  const weather = await withLoading(`Consultando el clima de ${city.name}…`, () =>
    getWeather(city, config.unit),
  );
  displayCityWeather(city, weather);
}
