import { addCity } from "./actions/addCity.ts";
import { showAllCitiesForecast } from "./actions/getForecast.ts";
import { showDefaultCityWeather } from "./actions/getWeather.ts";
import { showAllCitiesWeather } from "./actions/getAllCitiesWeather.ts";
import { removeCity } from "./actions/removeCity.ts";
import { openSettings } from "./actions/settings.ts";
import { setDefaultCity } from "./actions/setDefaultCity.ts";
import { isKnownApiError } from "./api/errors.ts";
import { withLoading } from "./presentation/loading.ts";
import { askMenuChoice, displayMainMenu } from "./presentation/menu.ts";
import { displayGoodbye, printBlankLine, printError } from "./presentation/output.ts";
import { loadConfig } from "./storage/configStorage.ts";
import type { AppConfig } from "./types/Config.ts";

async function main(): Promise<void> {
  const loaded = await withLoading("Cargando configuración…", () => loadConfig());
  const config: AppConfig = loaded.config;
  if (loaded.warning) printError(loaded.warning);
  let running = true;
  while (running) {
    displayMainMenu(config.cities.length, config.unit);
    const choice = askMenuChoice();
    if (choice === null) {
      running = false;
      break;
    }
    try {
      switch (choice) {
        case "1":
          await showDefaultCityWeather(config);
          break;
        case "2":
          await showAllCitiesWeather(config);
          break;
        case "3":
          await addCity(config);
          break;
        case "4":
          await removeCity(config);
          break;
        case "5":
          await setDefaultCity(config);
          break;
        case "6":
          await showAllCitiesForecast(config);
          break;
        case "8":
          await openSettings(config);
          break;
        case "9":
          running = false;
          break;
        default:
          printError("Opción no válida. Elige un número del menú.");
          break;
      }
    } catch (error) {
      if (isKnownApiError(error)) {
        printError(error.message);
      } else {
        printError(
          `Ocurrió un error inesperado: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    printBlankLine();
  }
  displayGoodbye();
}

await main();
