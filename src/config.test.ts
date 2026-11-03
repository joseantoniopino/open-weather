import { describe, expect, test } from "bun:test";

import {
  addCity,
  findCityById,
  parseAppConfig,
  removeCityFromConfig,
  setDefaultCityById,
  setUnit,
} from "./config.ts";
import type { AppConfig, City } from "./types.ts";

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

describe("addCity", () => {
  test("problems", () => {
    const config = createConfig();
    const result = addCity(config, OTTAWA);
    expect(result.added).toBe(true);
    expect(result.promotedToDefault).toBe(true);
    expect(config.cities).toHaveLength(1);
    expect(config.defaultCityId).toBe(OTTAWA.id);

    const second = addCity(config, MADRID);
    expect(second.added).toBe(true);
    expect(second.promotedToDefault).toBe(false);
    expect(config.defaultCityId).toBe(OTTAWA.id);
  });

  test("rejects duplicates", () => {
    const config = createConfig();
    addCity(config, OTTAWA);
    const result = addCity(config, OTTAWA);
    expect(result.added).toBe(false);
    expect(config.cities).toHaveLength(1);
  });
});

describe("removeCityFromConfig", () => {
  test("removes and promotes the next city", () => {
    const config = createConfig();
    addCity(config, OTTAWA);
    addCity(config, MADRID);
    const result = removeCityFromConfig(config, OTTAWA.id);
    expect(result.removed?.id).toBe(OTTAWA.id);
    expect(result.promoted?.id).toBe(MADRID.id);
    expect(config.defaultCityId).toBe(MADRID.id);
  });

  test("clears the default when the list is empty", () => {
    const config = createConfig();
    addCity(config, OTTAWA);
    const result = removeCityFromConfig(config, OTTAWA.id);
    expect(result.promoted).toBeNull();
    expect(config.defaultCityId).toBeNull();
  });
});

describe("findCityById and setDefaultCityById", () => {
  test("finds a saved city", () => {
    const config = createConfig();
    addCity(config, MADRID);
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

describe("setUnit", () => {
  test("changes the unit", () => {
    const config = createConfig();
    setUnit(config, "fahrenheit");
    expect(config.unit).toBe("fahrenheit");
  });
});

describe("parseAppConfig", () => {
  test("round-trips a saved configuration", () => {
    const original = createConfig();
    addCity(original, OTTAWA);
    const parsed = parseAppConfig(JSON.parse(JSON.stringify(original)) as unknown);
    expect(parsed).toEqual(original);
  });

  test("drops a default city id that no longer exists", () => {
    const parsed = parseAppConfig({
      version: 1,
      unit: "fahrenheit",
      defaultCityId: 123,
      cities: [],
    });
    expect(parsed.defaultCityId).toBeNull();
    expect(parsed.unit).toBe("fahrenheit");
  });

  test("rejects an invalid unit", () => {
    expect(() => parseAppConfig({ version: 1, unit: "kelvin", cities: [] })).toThrow();
  });
});
