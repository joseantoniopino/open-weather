import type { City } from "./City.ts";

export type TemperatureUnit = "celsius" | "fahrenheit";

export interface AppConfig {
  version: 1;
  unit: TemperatureUnit;
  defaultCityId: number | null;
  cities: City[];
}

/** Resultado de cargar el archivo de configuración, con aviso opcional. */
export interface LoadConfigResult {
  config: AppConfig;
  warning?: string;
}
