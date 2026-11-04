import { INDENT, paint } from "./theme.ts";
import { describeWeatherCode } from "../utils/weather-codes.ts";
import { formatCity, formatForecastDate, formatRain } from "../utils/format.ts";
import type { City } from "../types/City.ts";
import type { CurrentWeather, Forecast } from "../types/Weather.ts";

/** Todos los mensajes que se muestran al usuario. */

export function displayCityList(cities: readonly City[], defaultCityId: number | null): void {
  printNumberedCities("Ciudades guardadas", cities, (city) =>
    defaultCityId === city.id ? paint.defaultMarker(" (default)") : "",
  );
}

export function displaySearchResults(cities: readonly City[], query: string): void {
  printNumberedCities(`Resultados para «${query}»`, cities);
}

function printNumberedCities(
  title: string,
  cities: readonly City[],
  marker?: (city: City) => string,
): void {
  console.log(`\n  ${title} (${cities.length}):`);
  for (const [index, city] of cities.entries()) {
    console.log(`${INDENT}${paint.menu(String(index + 1))}. ${formatCity(city)}${marker?.(city) ?? ""}`);
  }
  console.log();
}

export function displayCityWeather(city: City, weather: CurrentWeather): void {
  console.log(`\n  ${paint.city(formatCity(city))}`);
  console.log(
    `  Temperatura actual: ${paint.temperature(`${weather.temperature} ${weather.unitSymbol}`)}`,
  );
}

export function displayCityForecast(city: City, forecast: Forecast): void {
  console.log(`\n  ${paint.city(formatCity(city))}`);
  console.log(`  Pronóstico de 7 días:`);
  for (const day of forecast.days) {
    console.log(
      `  ${formatForecastDate(day.date)} · ${describeWeatherCode(day.weatherCode)} · ` +
        `${paint.temperature(`Máx ${day.temperatureMax} ${forecast.unitSymbol}`)} · ` +
        `${paint.temperature(`Mín ${day.temperatureMin} ${forecast.unitSymbol}`)} · ` +
        `${formatRain(day.precipitationProbability)}`,
    );
  }
}

export function printError(message: string): void {
  console.error(`\n  ${paint.error(`✖ ${message}`)}`);
}

export function printInfo(message: string): void {
  console.log(`\n  ${paint.info(`ℹ ${message}`)}`);
}

export function printSuccess(message: string): void {
  console.log(`\n  ${paint.success(`✔ ${message}`)}`);
}

export function printBlankLine(): void {
  console.log();
}

export function displayGoodbye(): void {
  console.log(`\n  ${paint.title("¡Hasta pronto!")}\n`);
}
