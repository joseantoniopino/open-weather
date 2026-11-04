import { describe, expect, test } from "bun:test";

import { addCityToConfig, findCityById, removeCityFromConfig, setDefaultCityById } from "./citiesStorage.ts";
import type { AppConfig } from "../types/Config.ts";
import type { City } from "../types/City.ts";

const OTTAWA: City = {
  id: 6094817,
  name: "Ottawa",
  admin1: "Ontario",
  country: "Canada",
  latitude: 45.41117,
  longitude: -75.69812,
};

const MADRID: City = {
  id: 3117735,
  name: "Madrid",
  admin1: "Madrid",
  country: "España",
  latitude: 40.4165,
  longitude: -3.70256,
};

function createConfig(): AppConfig {
  return { version: 1, unit: "celsius", defaultCityId: null, cities: [] };
}

describe("addCityToConfig", () => {
  test("adds the first city as default", () => {
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

  test("rejects duplicates", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    const result = addCityToConfig(config, OTTAWA);
    expect(result.added).toBe(false);
    expect(config.cities).toHaveLength(1);
  });
});

describe("removeCityFromConfig", () => {
  test("removes and promotes the next city", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    addCityToConfig(config, MADRID);
    const result = removeCityFromConfig(config, OTTAWA.id);
    expect(result.removed?.id).toBe(OTTAWA.id);
    expect(result.promoted?.id).toBe(MADRID.id);
    expect(config.defaultCityId).toBe(MADRID.id);
  });

  test("clears the default when the list is empty", () => {
    const config = createConfig();
    addCityToConfig(config, OTTAWA);
    const result = removeCityFromConfig(config, OTTAWA.id);
    expect(result.promoted).toBeNull();
    expect(config.defaultCityId).toBeNull();
  });
});

describe("findCityById and setDefaultCityById", () => {
  test("finds a saved city", () => {
    const config = createConfig();
    addCityToConfig(config, MADRID);
    expect(findCityById(config, MADRID.id)?.name).toBe("Madrid");
    expect(findCityById(config, 999999)).toBeNull();
    expect(findCityById(config, null)).toBeNull();
  });

  test("ignores unknown ids", () => {
    const config = createConfig();
    setDefaultCityById(config, 999999);
    expect(config.defaultCityId).toBeNull();
  });
});
