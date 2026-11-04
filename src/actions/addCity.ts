import { searchCities } from "../api/geocoding.ts";
import { withLoading } from "../presentation/loading.ts";
import { askNumberChoice, askText } from "../presentation/input.ts";
import { displaySearchResults, printError, printInfo, printSuccess } from "../presentation/output.ts";
import { addCityToConfig } from "../storage/citiesStorage.ts";
import type { AppConfig } from "../types/Config.ts";
import type { City } from "../types/City.ts";
import { formatCity } from "../utils/format.ts";
import { persistConfig } from "./shared.ts";

/** Opción 3: buscar una ciudad por nombre y agregarla. */
export async function addCity(config: AppConfig): Promise<void> {
  const cityName = askText("\n  Nombre de la ciudad: ");
  if (cityName === null) {
    printInfo("Búsqueda cancelada.");
    return;
  }
  const matches = await withLoading("Buscando ciudades…", () => searchCities(cityName));
  const city = matches.length === 1 ? matches[0] : await chooseCity(matches, cityName);
  if (!city) {
    printInfo("Búsqueda cancelada.");
    return;
  }
  const result = addCityToConfig(config, city);
  if (!result.added) {
    printError("Esa ciudad ya está guardada. Usa la opción 2 para verla.");
    return;
  }
  await persistConfig(config);
  printSuccess(`Ciudad agregada: ${formatCity(city)}`);
  if (result.promotedToDefault) {
    printInfo(`Se estableció como ciudad default: ${formatCity(city)}`);
  }
}

async function chooseCity(matches: readonly City[], cityName: string): Promise<City | null> {
  displaySearchResults(matches, cityName);
  const selected = askNumberChoice("  Número de la ciudad (vacío para cancelar): ", matches.length);
  if (selected === null) {
    return null;
  }
  return matches[selected - 1] ?? null;
}
