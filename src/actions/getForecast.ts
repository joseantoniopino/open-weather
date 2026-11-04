import { getForecast } from "../api/weather.ts";
import { withLoading } from "../presentation/loading.ts";
import { displayCityForecast, printBlankLine, printError } from "../presentation/output.ts";
import type { AppConfig } from "../types/Config.ts";
import type { City } from "../types/City.ts";
import type { Forecast } from "../types/Weather.ts";
import { formatCity } from "../utils/format.ts";
import { NO_SAVED_CITIES_MESSAGE } from "../utils/constants.ts";
import { describeApiError, loadingLabel } from "./shared.ts";

interface CityForecastOutcome {
  city: City;
  forecast: Forecast | null;
  errorText: string | null;
}

/** Opción 6: pronóstico de 7 días de todas las ciudades guardadas. */
export async function showAllCitiesForecast(config: AppConfig): Promise<void> {
  const cities = config.cities;
  if (cities.length === 0) {
    printError(NO_SAVED_CITIES_MESSAGE);
    return;
  }
  const outcomes = await withLoading(loadingLabel("Consultando el pronóstico", cities.length), () =>
    Promise.all(cities.map((city) => fetchCityForecast(city, config.unit))),
  );

  printBlankLine();
  for (const outcome of outcomes) {
    if (outcome.errorText !== null || outcome.forecast === null) {
      printError(
        `${formatCity(outcome.city)}: ${outcome.errorText ?? "No se pudo obtener el pronóstico."}`,
      );
      continue;
    }
    displayCityForecast(outcome.city, outcome.forecast);
  }
}

async function fetchCityForecast(city: City, unit: AppConfig["unit"]): Promise<CityForecastOutcome> {
  let forecast: Forecast | null = null;
  let errorText: string | null = null;
  try {
    forecast = await getForecast(city, unit);
  } catch (error) {
    errorText = describeApiError(error, "No se pudo obtener el pronóstico.");
  }
  return { city, forecast, errorText };
}
