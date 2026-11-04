import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/actions.feature
import { MADRID, OTTAWA, makeConfig } from "../helpers/fixtures.ts";
import { captureConsole, queuePrompts } from "../helpers/io.ts";
import { configExists, resetConfigStorage } from "../helpers/config.ts";
import { removeCity } from "../../src/actions/removeCity.ts";

describe("removeCity", () => {
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
    await removeCity(makeConfig());
    expect(output.error).toContain("No hay ciudades guardadas que eliminar.");
    expect(prompts.calls).toBe(0);
  });

  test("cancelar la selección deja la configuración sin tocar", async () => {
    prompts = queuePrompts("");
    output = captureConsole();
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID, OTTAWA] });
    await removeCity(config);
    expect(output.log).toContain("Operación cancelada.");
    expect(config.cities).toHaveLength(2);
    expect(config.defaultCityId).toBe(MADRID.id);
    expect(await configExists()).toBe(false);
    expect(prompts.calls).toBe(1);
  });

  test("rechazar la confirmación mantiene la ciudad", async () => {
    prompts = queuePrompts("1", "n");
    output = captureConsole();
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID, OTTAWA] });
    await removeCity(config);
    expect(output.log).toContain("Operación cancelada.");
    expect(config.cities).toHaveLength(2);
    expect(config.defaultCityId).toBe(MADRID.id);
    expect(await configExists()).toBe(false);
  });

  test("confirmar elimina la ciudad, guarda y anuncia la nueva default", async () => {
    prompts = queuePrompts("1", "s");
    output = captureConsole();
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID, OTTAWA] });
    await removeCity(config);
    const printed = output.printed;
    expect(printed).toContain(`✔ Ciudad eliminada: Madrid — Madrid, España`);
    expect(printed).toContain(`ℹ Nueva ciudad default: Ottawa — Ontario, Canada`);
    expect(config.cities).toHaveLength(1);
    expect(config.defaultCityId).toBe(OTTAWA.id);
    expect(await configExists()).toBe(true);
  });

  test("al eliminar la única ciudad se limpia la default", async () => {
    prompts = queuePrompts("1", "s");
    output = captureConsole();
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID] });
    await removeCity(config);
    expect(config.cities).toHaveLength(0);
    expect(config.defaultCityId).toBeNull();
    const printed = output.printed;
    expect(printed).toContain("✔ Ciudad eliminada:");
    expect(printed).not.toContain("Nueva ciudad default");
    expect(await configExists()).toBe(true);
  });

  test("una selección inválida repregunta hasta un número válido", async () => {
    prompts = queuePrompts("Sean Bean", "9", "2", "s");
    output = captureConsole();
    const config = makeConfig({ defaultCityId: MADRID.id, cities: [MADRID, OTTAWA] });
    await removeCity(config);
    expect(output.error).toContain("Debes introducir un número.");
    expect(config.cities).toHaveLength(1);
    expect(config.defaultCityId).toBe(MADRID.id);
    expect(prompts.calls).toBe(4);
  });
});
