import { ApiError, CityNotFoundError, getWeather, searchCity } from "./src/api.ts";
import {
  addCity,
  findCityById,
  loadConfig,
  removeCityFromConfig,
  saveConfig,
  setDefaultCityById,
  setUnit,
} from "./src/config.ts";
import {
  ask,
  askNumberChoice,
  askText,
  askYesNo,
  displayCityList,
  displayCityWeather,
  displayGoodbye,
  displayMenu,
  displaySettingsMenu,
  formatCity,
  printError,
  printInfo,
  printSuccess,
} from "./src/ui.ts";
import { unitSymbol } from "./src/types.ts";
import type { TemperatureUnit, AppConfig, City, CurrentWeather } from "./src/types.ts";

const NO_CITY_DEFAULT_MESSAGE =
  "Aún no hay ciudad default. Usa la opción 3 para agregar una ciudad.";

async function main(): Promise<void> {
  const loaded = await loadConfig();
  const config: AppConfig = loaded.config;
  if (loaded.warning) printError(loaded.warning);
  let running = true;
  while (running) {
    displayMenu(config.cities.length, config.unit);
    const choice = ask("  Selecciona una opción: ");
    if (choice === null) {
      running = false;
      break;
    }
    try {
      switch (choice.trim()) {
        case "1":
          await showDefaultCityWeather(config);
          break;
        case "2":
          await showAllCitiesWeather(config);
          break;
        case "3":
          await addCityInteractive(config);
          break;
        case "4":
          await removeCityInteractive(config);
          break;
        case "5":
          await setDefaultCityInteractive(config);
          break;
        case "8":
          await settingsLoop(config);
          break;
        case "9":
          running = false;
          break;
        default:
          printError("Opción no válida. Elige un número del menú.");
          break;
      }
    } catch (error) {
      if (error instanceof ApiError || error instanceof CityNotFoundError) {
        printError(error.message);
      } else {
        printError(
          `Ocurrió un error inesperado: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    console.log();
  }
  displayGoodbye();
}

async function showDefaultCityWeather(config: AppConfig): Promise<void> {
  const city = findCityById(config, config.defaultCityId);
  if (!city) {
    printError(NO_CITY_DEFAULT_MESSAGE);
    return;
  }
  const weather = await getWeather(city, config.unit);
  displayCityWeather(city, weather);
}

async function showAllCitiesWeather(config: AppConfig): Promise<void> {
  const cities = config.cities;
  if (cities.length === 0) {
    printError("No hay ciudades guardadas. Usa la opción 3 para agregar una ciudad.");
    return;
  }
  const outcomes = await Promise.all(
    cities.map(async (city) => {
      let weather: CurrentWeather | null = null;
      let errorText: string | null = null;
      try {
        weather = await getWeather(city, config.unit);
      } catch (error) {
        errorText =
          error instanceof ApiError || error instanceof CityNotFoundError
            ? error.message
            : "No se pudo obtener el clima.";
      }
      return { city, weather, errorText } as {
        city: City;
        weather: CurrentWeather | null;
        errorText: string | null;
      };
    }),
  );

  console.log();
  for (const outcome of outcomes) {
    if (outcome.errorText !== null || !outcome.weather) {
      printError(`${formatCity(outcome.city)}: ${outcome.errorText}`);
      continue;
    }
    displayCityWeather(outcome.city, outcome.weather);
  }
}

async function addCityInteractive(config: AppConfig): Promise<void> {
  const cityName = askText("\n  Nombre de la ciudad: ");
  if (cityName === null) {
    printInfo("Búsqueda cancelada.");
    return;
  }
  const city = await searchCity(cityName);
  const result = addCity(config, city);
  if (!result.added) {
    printError("Esa ciudad ya está guardada. Usa la opción 2 para verla.");
    return;
  }
  await saveConfig(config);
  printSuccess(`Ciudad agregada: ${formatCity(city)}`);
  if (result.promotedToDefault) {
    printInfo(`Se estableció como ciudad default: ${formatCity(city)}`);
  }
}

async function removeCityInteractive(config: AppConfig): Promise<void> {
  const cities = config.cities;
  if (cities.length === 0) {
    printError("No hay ciudades guardadas que eliminar.");
    return;
  }
  displayCityList(cities, config.defaultCityId);
  const selected = askNumberChoice(
    `Número de la ciudad a eliminar (vacío para cancelar): `,
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
  const confirmed = askYesNo(
    `¿Eliminar «${formatCity(city)}»? (s/N): `,
  );
  if (!confirmed) {
    printInfo("Operación cancelada.");
    return;
  }
  const result = removeCityFromConfig(config, city.id);
  if (!result.removed) {
    printError("No se pudo eliminar la ciudad.");
    return;
  }
  await saveConfig(config);
  printSuccess(`Ciudad eliminada: ${formatCity(city)}`);
  if (result.promoted) {
    printInfo(`Nueva ciudad default: ${formatCity(result.promoted)}`);
  }
}

async function setDefaultCityInteractive(config: AppConfig): Promise<void> {
  const cities = config.cities;
  if (cities.length === 0) {
    printError("No hay ciudades guardadas. Usa la opción 3 para agregar una ciudad.");
    return;
  }
  displayCityList(cities, config.defaultCityId);
  const selected = askNumberChoice(
    `Número de la ciudad default (vacío para cancelar): `,
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
  await saveConfig(config);
  printSuccess(`Ciudad default establecida: ${formatCity(city)}`);
}

async function settingsLoop(config: AppConfig): Promise<void> {
  let goingBack = false;
  while (!goingBack) {
    displaySettingsMenu(config.unit);
    const choice = ask("  Selecciona una opción: ");
    if (choice === null) {
      goingBack = true;
      break;
    }
    console.log();
    switch (choice.trim()) {
      case "1": {
        const nextUnit: TemperatureUnit = config.unit === "celsius" ? "fahrenheit" : "celsius";
        setUnit(config, nextUnit);
        await saveConfig(config);
        printSuccess(`Unidad de temperatura actualizada a ${unitSymbol(nextUnit)}`);
        break;
      }
      case "2":
        goingBack = true;
        break;
      default:
        printError("Opción no válida. Elige un número del menú de ajustes.");
        break;
    }
  }
}

await main();
