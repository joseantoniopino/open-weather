import { describe, expect, test } from "bun:test";

import { setUnit, toggleUnit } from "./settingsStorage.ts";
import type { AppConfig } from "../types/Config.ts";

function createConfig(): AppConfig {
  return { version: 1, unit: "celsius", defaultCityId: null, cities: [] };
}

describe("setUnit", () => {
  test("cambia la unidad", () => {
    const config = createConfig();
    setUnit(config, "fahrenheit");
    expect(config.unit).toBe("fahrenheit");
  });
});

describe("toggleUnit", () => {
  test("alterna entre celsius y fahrenheit", () => {
    const config = createConfig();
    expect(toggleUnit(config)).toBe("fahrenheit");
    expect(config.unit).toBe("fahrenheit");
    expect(toggleUnit(config)).toBe("celsius");
    expect(config.unit).toBe("celsius");
  });
});
