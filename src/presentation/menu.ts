import { APP_NAME } from "../utils/constants.ts";
import { ask } from "./input.ts";
import { INDENT, MENU_WIDTH, SEPARATOR, paint } from "./theme.ts";
import type { TemperatureUnit } from "../types/Config.ts";
import type { MenuOption } from "../types/MenuOption.ts";
import { unitSymbol } from "../utils/format.ts";

/** Renderizado de los menús y manejo de la selección de opciones. */

function titleLine(title: string): string {
  const padding = Math.max(0, Math.floor((MENU_WIDTH - title.length) / 2));
  return " ".repeat(padding) + paint.title(title);
}

function formatOption(option: MenuOption): string {
  return `${INDENT}${paint.menu(option.key)}. ${option.label}`;
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

export function mainMenuOptions(cityCount: number, unit: TemperatureUnit): MenuOption[] {
  return [
    { key: "1", label: "Clima de ciudad default" },
    { key: "2", label: `Clima de todas las ciudades (${cityCount})` },
    { key: "3", label: "Buscar y agregar ciudad" },
    { key: "4", label: "Eliminar ciudad" },
    { key: "5", label: "Establecer ciudad default" },
    { key: "6", label: "Pronóstico de 7 días (todas)" },
    { key: "8", label: `Ajustes (${unitSymbol(unit)})` },
    { key: "9", label: "Salir" },
  ];
}

export function displayMainMenu(cityCount: number, unit: TemperatureUnit): void {
  renderMenu(
    APP_NAME,
    mainMenuOptions(cityCount, unit).map((option) => formatOption(option)),
  );
}

export function displaySettingsMenu(unit: TemperatureUnit): void {
  const alternativeUnit: TemperatureUnit = unit === "celsius" ? "fahrenheit" : "celsius";
  renderMenu("AJUSTES", [
    `${INDENT}Unidad de temperatura actual: ${unitSymbol(unit)}`,
    formatOption({ key: "1", label: `Cambiar unidad a ${unitSymbol(alternativeUnit)}` }),
    formatOption({ key: "2", label: "Volver" }),
  ]);
}

/** Lee la opción elegida en un menú (vacío o EOF significa salir). */
export function askMenuChoice(): string | null {
  const raw = ask("  Selecciona una opción: ");
  return raw === null ? null : raw.trim();
}
