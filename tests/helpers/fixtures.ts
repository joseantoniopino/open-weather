// Spec: specs/testing/infrastructure.feature
import type { City } from "../../src/types/City.ts";
import type { AppConfig } from "../../src/types/Config.ts";

/** Utilidades para simular respuestas de Open-Meteo y configuraciones. */

export const OTTAWA: City = {
  id: 6094817,
  name: "Ottawa",
  admin1: "Ontario",
  country: "Canada",
  latitude: 45.41117,
  longitude: -75.69812,
};

export const MADRID: City = {
  id: 3117735,
  name: "Madrid",
  admin1: "Madrid",
  country: "España",
  latitude: 40.4165,
  longitude: -3.70256,
};

/** Construye una ciudad con sobrescrituras opcionales. */
export function makeCity(overrides: Partial<City> = {}): City {
  return { ...OTTAWA, ...overrides };
}

/** Construye una configuración con sobrescrituras opcionales. */
export function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return { version: 1, unit: "celsius", defaultCityId: null, cities: [], ...overrides };
}

/** Cuerpo típico del endpoint forecast para `current=temperature_2m`. */
export function weatherBody(temperature: number, unitSymbol = "°C"): unknown {
  return {
    current: { temperature_2m: temperature },
    current_units: { temperature_2m: unitSymbol },
  };
}

/** Cuerpo de geocoding con las ciudades dadas (Open-Meteo devuelve hasta 10). */
export function geocodingBody(cities: Array<City>): unknown {
  return {
    results: cities.map((city) => ({
      id: city.id,
      name: city.name,
      admin1: city.admin1,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
    })),
  };
}

/** Cuerpo de `daily` forecast de 7 días con valores reproducibles. */
export function forecastBody(): unknown {
  return {
    daily: {
      time: [
        "2026-11-04",
        "2026-11-05",
        "2026-11-06",
        "2026-11-07",
        "2026-11-08",
        "2026-11-09",
        "2026-11-10",
      ],
      temperature_2m_max: [12, 13, 14, 15, 16, 17, 18],
      temperature_2m_min: [4, 5, 6, 7, 8, 9, 10],
      weather_code: [0, 3, 61, 71, 95, 48, 99],
      precipitation_probability_max: [0, 12, 34, 55, 67, 89, null],
    },
  };
}

/** Pronóstico reducido para parseDailyForecast directo (campos opcionalmente inválidos). */
export function dailyFixture(data: {
  time?: unknown;
  max?: unknown;
  min?: unknown;
  code?: unknown;
  rain?: unknown;
  units?: unknown;
}): unknown {
  return {
    time: data.time,
    temperature_2m_max: data.max,
    temperature_2m_min: data.min,
    weather_code: data.code,
    precipitation_probability_max: data.rain,
    daily_units: data.units,
  };
}
