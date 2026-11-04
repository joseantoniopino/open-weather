import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/actions.feature
import { MADRID, OTTAWA, makeConfig } from "../helpers/fixtures.ts";
import { captureConsole, queuePrompts } from "../helpers/io.ts";
import { configExists, resetConfigStorage } from "../helpers/config.ts";
import { setDefaultCity } from "../../src/actions/setDefaultCity.ts";

describe("setDefaultCity", () => {
  let prompts: ReturnType<typeof queuePrompts>;
  let output: ReturnType<typeof captureConsole>;

  beforeEach(async () => {
    await resetConfigStorage();
  });

  afterEach(() => {
    prompts.restore();
    output.restore();
  });

  test("sin ciudades imprime el aviso y no pregunta nada", async () => {
    prompts = queuePrompts();
    output = captureConsole();
    await setDefaultCity(makeConfig());
    expect(output.error).toContain("No hay ciudades guardadas. Usa la opción 3 para agregar una ciudad.");
    expect(prompts.calls).toBe(0);
  });

  test("cancelar la selección no guarda nada", async () => {
    prompts = queuePrompts("");
    output = captureConsole();
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID, OTTAWA] });
    await setDefaultCity(config);
    expect(output.log).toContain("Operación cancelada.");
    expect(config.defaultCityId).toBe(MADRID.id);
    expect(await configExists()).toBe(false);
    expect(prompts.calls).toBe(1);
  });

  test("elegir la default actual avisa sin guardar", async () => {
    prompts = queuePrompts("1");
    output = captureConsole();
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID, OTTAWA] });
    await setDefaultCity(config);
    expect(output.log).toContain("Esa ciudad ya es la default.");
    expect(config.defaultCityId).toBe(MADRID.id);
    expect(await configExists()).toBe(false);
  });

  test("elegir otra ciudad la establece como default y guarda", async () => {
    prompts = queuePrompts("2");
    output = captureConsole();
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID, OTTAWA] });
    await setDefaultCity(config);
    expect(output.log).toContain("✔ Ciudad default establecida: Ottawa — Ontario, Canada");
    expect(config.defaultCityId).toBe(OTTAWA.id);
    expect(await configExists()).toBe(true);
  });

  test("una selección inválida repregunta hasta un número válido", async () => {
    prompts = queuePrompts("no-numero", "0", "2");
    output = captureConsole();
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID, OTTAWA] });
    await setDefaultCity(config);
    expect(output.error).toContain("Debes introducir un número.");
    expect(output.error).toContain("Debes elegir un número entre 1 y 2.");
    expect(config.defaultCityId).toBe(OTTAWA.id);
    expect(prompts.calls).toBe(3);
  });
});
