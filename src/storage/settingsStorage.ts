import type { AppConfig, TemperatureUnit } from "../types/Config.ts";

/** Preferencias de configuración (por ahora, solo la unidad de temperatura). */

export function setUnit(config: AppConfig, unit: TemperatureUnit): void {
  config.unit = unit;
}

/** Alterna la unidad de temperatura y devuelve la nueva. */
export function toggleUnit(config: AppConfig): TemperatureUnit {
  const nextUnit: TemperatureUnit = config.unit === "celsius" ? "fahrenheit" : "celsius";
  setUnit(config, nextUnit);
  return nextUnit;
}
