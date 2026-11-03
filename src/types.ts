export type TemperatureUnit = "celsius" | "fahrenheit";

export function unitSymbol(unit: TemperatureUnit): "°C" | "°F" {
  return unit === "fahrenheit" ? "°F" : "°C";
}

export interface City {
  id: number;
  name: string;
  admin1: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperature: number;
  unitSymbol: string;
}

export interface AppConfig {
  version: 1;
  unit: TemperatureUnit;
  defaultCityId: number | null;
  cities: City[];
}
