import { copyFile, mkdir, readFile, rename } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import type { AppConfig, City, TemperatureUnit } from "./types.ts";

export const CONFIG_DIR = path.join(homedir(), ".weather-cli");
export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface LoadConfigResult {
  config: AppConfig;
  warning?: string;
}

export async function loadConfig(): Promise<LoadConfigResult> {
  let raw: string;
  try {
    raw = await readFile(CONFIG_FILE, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return { config: createDefaultConfig() };
    }
    throw error;
  }

  try {
    return { config: parseAppConfig(JSON.parse(raw) as unknown) };
  } catch (error) {
    const backupFile = `${CONFIG_FILE}.bak`;
    await copyFile(CONFIG_FILE, backupFile);
    return {
      config: createDefaultConfig(),
      warning: `El archivo de configuración está dañado (${error instanceof Error ? error.message : error}). Se guardó una copia en «${backupFile}» y se usará una configuración nueva.`,
    };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  const tempFile = `${CONFIG_FILE}.tmp`;
  await Bun.write(tempFile, `${JSON.stringify(config, null, 2)}\n`);
  await rename(tempFile, CONFIG_FILE);
}

export function findCityById(config: AppConfig, cityId: number | null): City | null {
  if (cityId === null) return null;
  return config.cities.find((city) => city.id === cityId) ?? null;
}

export function addCity(config: AppConfig, city: City): { added: boolean; promotedToDefault: boolean } {
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

export function setUnit(config: AppConfig, unit: TemperatureUnit): void {
  config.unit = unit;
}

function createDefaultConfig(): AppConfig {
  return {
    version: 1,
    unit: "celsius",
    defaultCityId: null,
    cities: [],
  };
}

export function parseAppConfig(raw: unknown): AppConfig {
  const data = assertRecord(raw, "El archivo de configuración");
  if (data["version"] !== 1) {
    throw new Error("La versión del archivo de configuración no es compatible.");
  }
  const unit = parseTemperatureUnit(data["unit"]);
  let defaultCityId = parseDefaultCityId(data["defaultCityId"]);
  const rawCities = data["cities"];
  if (!Array.isArray(rawCities)) {
    throw new Error("La lista de ciudades no es un array.");
  }
  const cities = rawCities.map(parseCity);
  if (defaultCityId !== null && !cities.some((city) => city.id === defaultCityId)) {
    defaultCityId = null;
  }
  return { version: 1, unit, defaultCityId, cities };
}

function parseTemperatureUnit(value: unknown): TemperatureUnit {
  if (value === "celsius" || value === "fahrenheit") return value;
  throw new Error("La unidad de temperatura no es válida.");
}

function parseDefaultCityId(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value === undefined) return null;
  throw new Error("El identificador de la ciudad default no es válido.");
}

function parseCity(raw: unknown): City {
  const data = assertRecord(raw, "Cada ciudad guardada");
  const id = assertNumber(data["id"], "el identificador de la ciudad");
  const name = assertString(data["name"], "el nombre de la ciudad");
  const latitude = assertNumber(data["latitude"], "la latitud");
  const longitude = assertNumber(data["longitude"], "la longitud");
  return {
    id,
    name,
    admin1: asOptionalString(data["admin1"]),
    country: asOptionalString(data["country"]),
    latitude,
    longitude,
  };
}

function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} debe ser un objeto JSON.`);
  }
  return value as Record<string, unknown>;
}

function assertNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`El campo ${label} debe ser un número.`);
  }
  return value;
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`El campo ${label} debe ser texto no vacío.`);
  }
  return value;
}

function asOptionalString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}
