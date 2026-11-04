import { askNumberChoice, askYesNo } from "../presentation/input.ts";
import { displayCityList, printError, printInfo, printSuccess } from "../presentation/output.ts";
import { removeCityFromConfig } from "../storage/citiesStorage.ts";
import type { AppConfig } from "../types/Config.ts";
import { formatCity } from "../utils/format.ts";
import { persistConfig } from "./shared.ts";

/** Opción 4: eliminar una ciudad guardada. */
export async function removeCity(config: AppConfig): Promise<void> {
  const cities = config.cities;
  if (cities.length === 0) {
    printError("No hay ciudades guardadas que eliminar.");
    return;
  }
  displayCityList(cities, config.defaultCityId);
  const selected = askNumberChoice(
    "Número de la ciudad a eliminar (vacío para cancelar): ",
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
  const confirmed = askYesNo(`¿Eliminar «${formatCity(city)}»? (s/N): `);
  if (!confirmed) {
    printInfo("Operación cancelada.");
    return;
  }
  const result = removeCityFromConfig(config, city.id);
  if (!result.removed) {
    printError("No se pudo eliminar la ciudad.");
    return;
  }
  await persistConfig(config);
  printSuccess(`Ciudad eliminada: ${formatCity(city)}`);
  if (result.promoted) {
    printInfo(`Nueva ciudad default: ${formatCity(result.promoted)}`);
  }
}
