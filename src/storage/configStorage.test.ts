import { describe, expect, test } from "bun:test";

import { addCityToConfig } from "./citiesStorage.ts";
import { parseAppConfig } from "./configStorage.ts";
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

describe("parseAppConfig", () => {
  test("round-trips a saved configuration", () => {
    const original: AppConfig = {
      version: 1,
      unit: "celsius",
      defaultCityId: null,
      cities: [],
    };
    addCityToConfig(original, OTTAWA);
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
