import { style } from "./colors.ts";
import { unitSymbol } from "./types.ts";
import type { City, CurrentWeather, TemperatureUnit } from "./types.ts";

const MENU_WIDTH = 40;
const INDENT = "  ";
const SEPARATOR = "═".repeat(MENU_WIDTH);

/** Paleta de la interfaz. Para cambiar el aspecto, editar solo este mapa. */
const paint = {
  menu: (text: string) => style(text, "cyan"),
  title: (text: string) => style(text, "bold", "cyan"),
  temperature: (text: string) => style(text, "bold", "yellow"),
  city: (text: string) => style(text, "bold"),
  defaultMarker: (text: string) => style(text, "dim", "yellow"),
  success: (text: string) => style(text, "green"),
  error: (text: string) => style(text, "red"),
  info: (text: string) => style(text, "cyan"),
};

function titleLine(title: string): string {
  const padding = Math.max(0, Math.floor((MENU_WIDTH - title.length) / 2));
  return " ".repeat(padding) + paint.title(title);
}

function menuOption(key: string, label: string): string {
  return `${INDENT}${paint.menu(key)}. ${label}`;
}

function renderMenu(title: string, body: readonly string[]): void {
  const lines = [
    "",
    paint.menu(SEPARATOR),
    titleLine(title),
    paint.menu(SEPARATOR),
    ...body,
    paint.menu(SEPARATOR),
  ];
  console.log(lines.join("\n"));
}

export function displayMenu(cityCount: number, unit: TemperatureUnit): void {
  renderMenu("WEATHER CLI", [
    menuOption("1", "Clima de ciudad default"),
    menuOption("2", `Clima de todas las ciudades (${cityCount})`),
    menuOption("3", "Buscar y agregar ciudad"),
    menuOption("4", "Eliminar ciudad"),
    menuOption("5", "Establecer ciudad default"),
    menuOption("8", `Ajustes (${unitSymbol(unit)})`),
    menuOption("9", "Salir"),
  ]);
}

export function displaySettingsMenu(unit: TemperatureUnit): void {
  const alternativeUnit: TemperatureUnit = unit === "celsius" ? "fahrenheit" : "celsius";
  renderMenu("AJUSTES", [
    `${INDENT}Unidad de temperatura actual: ${unitSymbol(unit)}`,
    menuOption("1", `Cambiar unidad a ${unitSymbol(alternativeUnit)}`),
    menuOption("2", "Volver"),
  ]);
}

export function displayCityList(cities: readonly City[], defaultCityId: number | null): void {
  printNumberedCities("Ciudades guardadas", cities, (city) =>
    defaultCityId === city.id ? paint.defaultMarker(" (default)") : "",
  );
}

export function displaySearchResults(cities: readonly City[], query: string): void {
  printNumberedCities(`Resultados para «${query}»`, cities);
}

function printNumberedCities(
  title: string,
  cities: readonly City[],
  marker?: (city: City) => string,
): void {
  console.log(`\n  ${title} (${cities.length}):`);
  for (const [index, city] of cities.entries()) {
    console.log(`${INDENT}${paint.menu(String(index + 1))}. ${formatCity(city)}${marker?.(city) ?? ""}`);
  }
  console.log();
}

export function displayCityWeather(city: City, weather: CurrentWeather): void {
  console.log(`\n  ${paint.city(formatCity(city))}`);
  console.log(
    `  Temperatura actual: ${paint.temperature(`${weather.temperature} ${weather.unitSymbol}`)}`,
  );
}

export function formatCity(city: City): string {
  const place = [city.admin1, city.country]
    .filter((value): value is string => value !== null && value.length > 0)
    .join(", ");
  return place.length > 0 ? `${city.name} — ${place}` : city.name;
}

export function printError(message: string): void {
  console.error(`\n  ${paint.error(`✖ ${message}`)}`);
}

export function printInfo(message: string): void {
  console.log(`\n  ${paint.info(`ℹ ${message}`)}`);
}

export function printSuccess(message: string): void {
  console.log(`\n  ${paint.success(`✔ ${message}`)}`);
}

export function displayGoodbye(): void {
  console.log(`\n  ${paint.title("¡Hasta pronto!")}\n`);
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
