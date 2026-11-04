import { describe, expect, test } from "bun:test";

// Spec: specs/testing/storage.feature
import { setUnit, toggleUnit } from "../../src/storage/settingsStorage.ts";
import { makeConfig } from "../helpers/fixtures.ts";

describe("setUnit", () => {
  test("cambia la unidad a fahrenheit", () => {
    const config = makeConfig();
    setUnit(config, "fahrenheit");
    expect(config.unit).toBe("fahrenheit");
  });

  test("cambia la unidad a celsius", () => {
    const config = makeConfig({ unit: "fahrenheit" });
    setUnit(config, "celsius");
    expect(config.unit).toBe("celsius");
  });
});

describe("toggleUnit", () => {
  test("alterna entre celsius y fahrenheit mutando la configuración", () => {
    const config = makeConfig();
    expect(toggleUnit(config)).toBe("fahrenheit");
    expect(config.unit).toBe("fahrenheit");
    expect(toggleUnit(config)).toBe("celsius");
    expect(config.unit).toBe("celsius");
  });
});
