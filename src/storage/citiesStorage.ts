import type { AppConfig } from "../types/Config.ts";
import type { City } from "../types/City.ts";

/**
 * Operaciones sobre las ciudades guardadas en `AppConfig`.
 * Mutan el objeto en memoria; el guardado a disco es responsabilidad de
 * `configStorage.saveConfig`, invocado desde las acciones.
 */

export function findCityById(config: AppConfig, cityId: number | null): City | null {
  if (cityId === null) return null;
  return config.cities.find((city) => city.id === cityId) ?? null;
}

export function addCityToConfig(
  config: AppConfig,
  city: City,
): { added: boolean; promotedToDefault: boolean } {
  const duplicate = config.cities.some(
    (existing) =>
      existing.id === city.id ||
      (existing.latitude === city.latitude && existing.longitude === city.longitude),
  );
  if (duplicate) {
    return { added: false, promotedToDefault: false };
  }
  config.cities.push(city);
  if (config.defaultCityId === null) {
    config.defaultCityId = city.id;
    return { added: true, promotedToDefault: true };
  }
  return { added: true, promotedToDefault: false };
}

export function removeCityFromConfig(
  config: AppConfig,
  cityId: number,
): { removed: City | null; promoted: City | null } {
  const index = config.cities.findIndex((city) => city.id === cityId);
  if (index === -1) {
    return { removed: null, promoted: null };
  }
  const removed = config.cities[index];
  if (!removed) {
    return { removed: null, promoted: null };
  }
  config.cities.splice(index, 1);
  if (config.defaultCityId === cityId) {
    config.defaultCityId = null;
    const [nextCity] = config.cities;
    if (nextCity) {
      config.defaultCityId = nextCity.id;
      return { removed, promoted: nextCity };
    }
  }
  return { removed, promoted: null };
}

export function setDefaultCityById(config: AppConfig, cityId: number): City | null {
  const city = findCityById(config, cityId);
  if (!city) return null;
  config.defaultCityId = city.id;
  return city;
}
