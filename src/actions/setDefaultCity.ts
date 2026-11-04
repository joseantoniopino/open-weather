import { askNumberChoice } from "../presentation/input.ts";
import { displayCityList, printError, printInfo, printSuccess } from "../presentation/output.ts";
import { setDefaultCityById } from "../storage/citiesStorage.ts";
import type { AppConfig } from "../types/Config.ts";
import { formatCity } from "../utils/format.ts";
import { NO_SAVED_CITIES_MESSAGE } from "../utils/constants.ts";
import { persistConfig } from "./shared.ts";

/** Opción 5: establecer la ciudad default entre las guardadas. */
export async function setDefaultCity(config: AppConfig): Promise<void> {
  const cities = config.cities;
  if (cities.length === 0) {
    printError(NO_SAVED_CITIES_MESSAGE);
    return;
  }
  displayCityList(cities, config.defaultCityId);
  const selected = askNumberChoice(
    "Número de la ciudad default (vacío para cancelar): ",
    cities.length,
  );
  if (selected === null) {
    printInfo("Operación cancelada.");
    return;
  }
  const city = cities[selected - 1];
  if (!city) {
    printError("No se encontró la ciudad seleccionada.");
    return;
  }
  if (config.defaultCityId === city.id) {
    printInfo("Esa ciudad ya es la default.");
    return;
  }
  setDefaultCityById(config, city.id);
  await persistConfig(config);
  printSuccess(`Ciudad default establecida: ${formatCity(city)}`);
}
