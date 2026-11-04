import { homedir } from "node:os";
import path from "node:path";

/** Nombre de la aplicación, usado como cabecera del menú. */
export const APP_NAME = "WEATHER CLI";

/** Ruta del archivo de configuración del usuario. */
export const CONFIG_DIR = path.join(homedir(), ".weather-cli");
export const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

/** Constantes de Open-Meteo compartidas por los módulos de API. */
export const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
export const GEOCODING_RESULT_LIMIT = 10;
export const FORECAST_DAYS = 7;
export const REQUEST_TIMEOUT_MS = 10_000;
export const MAX_ATTEMPTS = 2;
export const RETRY_DELAY_MS = 500;

/** Mensajes compartidos entre acciones. */
export const NO_CITY_DEFAULT_MESSAGE =
  "Aún no hay ciudad default. Usa la opción 3 para agregar una ciudad.";
export const NO_SAVED_CITIES_MESSAGE =
  "No hay ciudades guardadas. Usa la opción 3 para agregar una ciudad.";
