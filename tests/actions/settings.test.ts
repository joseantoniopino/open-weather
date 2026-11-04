import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/actions.feature
import { makeConfig } from "../helpers/fixtures.ts";
import { captureConsole, queuePrompts } from "../helpers/io.ts";
import { configExists, resetConfigStorage } from "../helpers/config.ts";
import { openSettings } from "../../src/actions/settings.ts";

describe("openSettings", () => {
  let prompts: ReturnType<typeof queuePrompts>;
  let output: ReturnType<typeof captureConsole>;

  beforeEach(async () => {
    await resetConfigStorage();
  });

  afterEach(() => {
    prompts.restore();
    output.restore();
  });

  test("«1» alterna a fahrenheit, guarda y vuelve al submenú", async () => {
    prompts = queuePrompts("1", "2");
    output = captureConsole();
    const config = makeConfig();
    await openSettings(config);
    expect(config.unit).toBe("fahrenheit");
    expect(output.log).toContain("✔ Unidad de temperatura actualizada a °F");
    expect(await configExists()).toBe(true);
    expect(prompts.calls).toBe(2);
  });

  test("alternar dos veces vuelve a celsius", async () => {
    prompts = queuePrompts("1", "1", "2");
    output = captureConsole();
    const config = makeConfig();
    await openSettings(config);
    expect(config.unit).toBe("celsius");
    expect(output.log).toContain("Unidad de temperatura actualizada a °C");
    expect(await configExists()).toBe(true);
    expect(prompts.calls).toBe(3);
  });

  test("«2» sale del submenú sin guardar", async () => {
    prompts = queuePrompts("2");
    output = captureConsole();
    const config = makeConfig({ unit: "fahrenheit" });
    await openSettings(config);
    expect(config.unit).toBe("fahrenheit");
    expect(await configExists()).toBe(false);
  });

  test("EOF sale del submenú sin guardar", async () => {
    prompts = queuePrompts();
    output = captureConsole();
    await openSettings(makeConfig());
    expect(prompts.calls).toBe(1);
    expect(await configExists()).toBe(false);
  });

  test("opción inválida avisa y repregunta hasta salir", async () => {
    prompts = queuePrompts("no-servir", "7", "2");
    output = captureConsole();
    await openSettings(makeConfig());
    expect(output.error).toContain(
      "Opción no válida. Elige un número del menú de ajustes.",
    );
    expect(prompts.calls).toBe(3);
  });

  test("alternar en fahrenheit vuelve a celsius y guarda la unidad", async () => {
    prompts = queuePrompts("1", "2");
    output = captureConsole();
    const config = makeConfig({ unit: "fahrenheit" });
    await openSettings(config);
    expect(config.unit).toBe("celsius");
    expect(output.log).toContain("Unidad de temperatura actualizada a °C");
    expect(await configExists()).toBe(true);
  });
});
