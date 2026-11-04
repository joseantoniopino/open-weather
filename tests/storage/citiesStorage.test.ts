import { describe, expect, test } from "bun:test";

// Spec: specs/testing/storage.feature
import {
  addCityToConfig,
  findCityById,
  removeCityFromConfig,
  setDefaultCityById,
} from "../../src/storage/citiesStorage.ts";
import { MADRID, OTTAWA, makeCity, makeConfig } from "../helpers/fixtures.ts";
import type { AppConfig } from "../../src/types/Config.ts";

function createConfig(): AppConfig {
  return makeConfig();
}

describe("addCityToConfig", () => {
  test("agrega la primera ciudad y la promociona a default", () => {
    const config = createConfig();
    const result = addCityToConfig(config, OTTAWA);
    expect(result.added).toBe(true);
    expect(result.promotedToDefault).toBe(true);
    expect(config.cities).toHaveLength(1);
    expect(config.defaultCityId).toBe(OTTAWA.id);

    const second = addCityToConfig(config, MADRID);
    expect(second.added).toBe(true);
    expect(second.promotedToDefault).toBe(false);
    expect(config.defaultCityId).toBe(OTTAWA.id);
  });

  test("rechaza duplicados por id", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    const result = addCityToConfig(config, OTTAWA);
    expect(result.added).toBe(false);
    expect(result.promotedToDefault).toBe(false);
    expect(config.cities).toHaveLength(1);
  });

  test("rechaza duplicados por coordenadas aunque el id cambie", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    const sameCoords = makeCity({ id: 999, name: "Ottawa duplicada" });
    const result = addCityToConfig(config, sameCoords);
    expect(result.added).toBe(false);
    expect(config.cities).toHaveLength(1);
    expect(config.defaultCityId).toBe(OTTAWA.id);
  });

  test("no promociona la segunda ciudad si ya hay otra default aunque sea inválida", () => {
    const config = makeConfig({ defaultCityId: 123 });
    const result = addCityToConfig(config, OTTAWA);
    expect(result.promotedToDefault).toBe(false);
    expect(config.defaultCityId).toBe(123);
  });
});

describe("removeCityFromConfig", () => {
  test("remueve y promociona la siguiente ciudad default", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    addCityToConfig(config, MADRID);
    const result = removeCityFromConfig(config, OTTAWA.id);
    expect(result.removed?.id).toBe(OTTAWA.id);
    expect(result.promoted?.id).toBe(MADRID.id);
    expect(config.defaultCityId).toBe(MADRID.id);
  });

  test("limpia la default cuando la lista queda vacía", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    const result = removeCityFromConfig(config, OTTAWA.id);
    expect(result.removed?.id).toBe(OTTAWA.id);
    expect(result.promoted).toBeNull();
    expect(config.defaultCityId).toBeNull();
    expect(config.cities).toHaveLength(0);
  });

  test("mantiene la default al eliminar una ciudad que no lo es", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    addCityToConfig(config, MADRID);
    const result = removeCityFromConfig(config, MADRID.id);
    expect(result.removed?.id).toBe(MADRID.id);
    expect(result.promoted).toBeNull();
    expect(config.defaultCityId).toBe(OTTAWA.id);
    expect(config.cities).toHaveLength(1);
  });

  test("deja la configuración sin cambios si el id no existe", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    const result = removeCityFromConfig(config, 999);
    expect(result.removed).toBeNull();
    expect(result.promoted).toBeNull();
    expect(config.cities).toHaveLength(1);
    expect(config.defaultCityId).toBe(OTTAWA.id);
  });
});

describe("findCityById y setDefaultCityById", () => {
  test("encuentra una ciudad guardada", () => {
    const config = createConfig();
    addCityToConfig(config, MADRID);
    expect(findCityById(config, MADRID.id)?.name).toBe("Madrid");
    expect(findCityById(config, 999999)).toBeNull();
    expect(findCityById(config, null)).toBeNull();
  });

  test("ignora ids que no están guardados al establecer default", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    expect(setDefaultCityById(config, 999999)).toBeNull();
    expect(config.defaultCityId).toBe(OTTAWA.id);
  });

  test("establece la ciudad default cuando existe", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    addCityToConfig(config, MADRID);
    const promoted = setDefaultCityById(config, MADRID.id);
    expect(promoted?.id).toBe(MADRID.id);
    expect(config.defaultCityId).toBe(MADRID.id);
  });
});
