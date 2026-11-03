import { unitSymbol } from "./types.ts";
import type { City, CurrentWeather, TemperatureUnit } from "./types.ts";

const MENU_WIDTH = 40;
const TITLE_INDENT = " ".repeat(9);
const INDENT = "  ";
const SEPARATOR = "═".repeat(MENU_WIDTH);

export function displayMenu(cityCount: number, unit: TemperatureUnit): void {
  console.log(
    `\n${SEPARATOR}\n${TITLE_INDENT}WEATHER CLI\n${SEPARATOR}\n`
    + `${INDENT}1. Clima de ciudad default\n`
    + `${INDENT}2. Clima de todas las ciudades (${cityCount})\n`
    + `${INDENT}3. Buscar y agregar ciudad\n`
    + `${INDENT}4. Eliminar ciudad\n`
    + `${INDENT}5. Establecer ciudad default\n`
    + `${INDENT}8. Ajustes (${unitSymbol(unit)})\n`
    + `${INDENT}9. Salir\n`
    + `${SEPARATOR}`,
  );
}

export function displaySettingsMenu(unit: TemperatureUnit): void {
  const alternativeUnit: TemperatureUnit = unit === "celsius" ? "fahrenheit" : "celsius";
  console.log(
    `\n${SEPARATOR}\n${TITLE_INDENT}AJUSTES\n${SEPARATOR}\n`
    + `${INDENT}Unidad de temperatura actual: ${unitSymbol(unit)}\n`
    + `${INDENT}1. Cambiar unidad a ${unitSymbol(alternativeUnit)}\n`
    + `${INDENT}2. Volver\n`
    + `${SEPARATOR}`,
  );
}

export function displayCityList(cities: readonly City[], defaultCityId: number | null): void {
  console.log(`\n  Ciudades guardadas (${cities.length}):`);
  for (const [index, city] of cities.entries()) {
    const marker = defaultCityId === city.id ? " (default)" : "";
    console.log(`${INDENT}${index + 1}. ${formatCity(city)}${marker}`);
  }
  console.log();
}

export function displayCityWeather(city: City, weather: CurrentWeather): void {
  console.log(`\n  ${formatCity(city)}`);
  console.log(`  Temperatura actual: ${weather.temperature} ${weather.unitSymbol}`);
}

export function formatCity(city: City): string {
  const place = [city.admin1, city.country]
    .filter((value): value is string => value !== null && value.length > 0)
    .join(", ");
  return place.length > 0 ? `${city.name} — ${place}` : city.name;
}

export function printError(message: string): void {
  console.error(`\n  ✖ ${message}`);
}

export function printInfo(message: string): void {
  console.log(`\n  ℹ ${message}`);
}

export function printSuccess(message: string): void {
  console.log(`\n  ✔ ${message}`);
}

export function displayGoodbye(): void {
  console.log("\n  ¡Hasta pronto!\n");
}

export function ask(label: string): string | null {
  const raw = prompt(label);
  return raw === null ? null : raw;
}

export function askText(label: string): string | null {
  const raw = ask(label);
  return raw === null ? null : raw.trim();
}

export function askNumberChoice(label: string, max: number): number | null {
  for (;;) {
    const raw = ask(label);
    if (raw === null) {
      return null;
    }
    const text = raw.trim();
    if (text.length === 0) {
      return null;
    }
    if (!/^\d+$/.test(text)) {
      printError("Debes introducir un número.");
      continue;
    }
    const parsed = Number(text);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
      printError(`Debes elegir un número entre 1 y ${max}.`);
      continue;
    }
    return parsed;
  }
}

export function askYesNo(question: string): boolean {
  for (;;) {
    const raw = ask(question);
    if (raw === null) {
      return false;
    }
    const text = raw.trim().toLowerCase();
    if (text === "s" || text === "si" || text === "sí" || text === "y" || text === "yes") {
      return true;
    }
    if (text === "" || text === "n" || text === "no") {
      return false;
    }
    printError("Responde con «s» para sí o «n» para no.");
  }
}
