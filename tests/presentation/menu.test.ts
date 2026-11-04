import { afterEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/presentation.feature
import { captureConsole, queuePrompts } from "../helpers/io.ts";
import {
  askMenuChoice,
  displayMainMenu,
  displaySettingsMenu,
  mainMenuOptions,
} from "../../src/presentation/menu.ts";
import { INDENT, MENU_WIDTH, SEPARATOR } from "../../src/presentation/theme.ts";

describe("mainMenuOptions", () => {
  test("expone las claves esperadas con cero ciudades y celsius", () => {
    const options = mainMenuOptions(0, "celsius");
    expect(options.map((option) => option.key)).toEqual(["1", "2", "3", "4", "5", "6", "8", "9"]);
    expect(options.map((option) => option.label)).toEqual([
      "Clima de ciudad default",
      "Clima de todas las ciudades (0)",
      "Buscar y agregar ciudad",
      "Eliminar ciudad",
      "Establecer ciudad default",
      "Pronóstico de 7 días (todas)",
      "Ajustes (°C)",
      "Salir",
    ]);
  });

  test("muestra el contador de ciudades y la unidad fahrenheit", () => {
    const options = mainMenuOptions(5, "fahrenheit");
    expect(options[1]?.label).toBe("Clima de todas las ciudades (5)");
    expect(options[6]?.label).toBe("Ajustes (°F)");
  });
});

describe("displayMainMenu", () => {
  let output: ReturnType<typeof captureConsole>;
  afterEach(() => {
    output.restore();
  });

  test("imprime título centrado, separadores y todas las opciones", () => {
    output = captureConsole();
    displayMainMenu(2, "celsius");
    const printed = output.log;
    expect(printed).toContain("WEATHER CLI");
    expect(printed).toContain(SEPARATOR);
    expect(printed).toContain(`${INDENT}1. Clima de ciudad default`);
    expect(printed).toContain(`${INDENT}2. Clima de todas las ciudades (2)`);
    expect(printed).toContain(`${INDENT}6. Pronóstico de 7 días (todas)`);
    expect(printed).toContain(`${INDENT}8. Ajustes (°C)`);
    expect(printed).toContain(`${INDENT}9. Salir`);
    const separatorCount = printed.split(SEPARATOR).length - 1;
    expect(separatorCount).toBeGreaterThanOrEqual(2);
    expect(MENU_WIDTH).toBe(40);
    expect(SEPARATOR).toBe("═".repeat(MENU_WIDTH));
  });

  test("centra el título con sangría calculada", () => {
    output = captureConsole();
    displayMainMenu(0, "celsius");
    const title = "              WEATHER CLI";
    expect(output.log.split("\n").some((line) => line.startsWith(title))).toBe(true);
  });
});

describe("displaySettingsMenu", () => {
  let output: ReturnType<typeof captureConsole>;
  afterEach(() => {
    output.restore();
  });

  test("muestra la unidad actual y la alternativa en celsius", () => {
    output = captureConsole();
    displaySettingsMenu("celsius");
    const printed = output.log;
    expect(printed).toContain("AJUSTES");
    expect(printed).toContain("Unidad de temperatura actual: °C");
    expect(printed).toContain("Cambiar unidad a °F");
    expect(printed).toContain("Volver");
  });

  test("muestra la unidad actual y la alternativa en fahrenheit", () => {
    output = captureConsole();
    displaySettingsMenu("fahrenheit");
    expect(output.log).toContain("Unidad de temperatura actual: °F");
    expect(output.log).toContain("Cambiar unidad a °C");
  });
});

describe("askMenuChoice", () => {
  test("recorta la respuesta y devuelve null en EOF", () => {
    const prompts = queuePrompts("  9  ");
    expect(askMenuChoice()).toBe("9");
    prompts.restore();

    const eof = queuePrompts();
    expect(askMenuChoice()).toBeNull();
    eof.restore();
  });
});
