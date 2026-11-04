import { afterEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/utils.feature
import {
  setColorsEnabled,
  style,
  supportsColor,
} from "../../src/utils/colors.ts";

type TestEnv = Record<string, string | undefined>;

describe("supportsColor", () => {
  test(`"FORCE_COLOR" fuerza el color aunque no haya TTY`, () => {
    expect(supportsColor({ FORCE_COLOR: "1" } as TestEnv, false)).toBe(true);
    expect(supportsColor({ FORCE_COLOR: "true" } as TestEnv, false)).toBe(true);
  });

  test(`"FORCE_COLOR=0" y "FORCE_COLOR=false" apagan el color aunque haya TTY`, () => {
    expect(supportsColor({ FORCE_COLOR: "0" } as TestEnv, true)).toBe(false);
    expect(supportsColor({ FORCE_COLOR: "false" } as TestEnv, true)).toBe(false);
  });

  test(`"NO_COLOR" no vacío apaga el color`, () => {
    expect(supportsColor({ NO_COLOR: "1" } as TestEnv, true)).toBe(false);
    expect(supportsColor({ NO_COLOR: "" } as TestEnv, true)).toBe(true);
  });

  test("FORCE_COLOR gana a NO_COLOR", () => {
    expect(
      supportsColor({ FORCE_COLOR: "1", NO_COLOR: "1" } as TestEnv, false),
    ).toBe(true);
  });

  test("exige TTY y un TERM distinto de «dumb»", () => {
    expect(supportsColor({ TERM: "xterm" } as TestEnv, true)).toBe(true);
    expect(supportsColor({ TERM: "xterm" } as TestEnv, false)).toBe(false);
    expect(supportsColor({ TERM: "dumb" } as TestEnv, true)).toBe(false);
    expect(supportsColor({ TERM: "dumb" } as TestEnv, false)).toBe(false);
    // Sin TERM definido y con TTY, el color se considera disponible.
    expect(supportsColor({ TERM: undefined } as TestEnv, true)).toBe(true);
  });

  test("sin FORCE_COLOR ni NO_COLOR usa el estado por defecto del TTY", () => {
    expect(supportsColor({} as TestEnv, false)).toBe(false);
  });
});

describe("style", () => {
  test("sin color activado devuelve el texto tal cual", () => {
    setColorsEnabled(false);
    expect(style("texto", "red")).toBe("texto");
    expect(style("", "red", "bold")).toBe("");
  });

  test("sin estilos devuelve el texto tal cual", () => {
    setColorsEnabled(true);
    expect(style("texto")).toBe("texto");
  });

  test("con color agrupa los estilos en una única secuencia", () => {
    setColorsEnabled(true);
    expect(style("texto", "bold", "cyan")).toBe("\x1b[1;36mtexto\x1b[0m");
    expect(style("error", "red")).toBe("\x1b[31merror\x1b[0m");
    setColorsEnabled(false);
  });

  test("setColorsEnabled es reversible", () => {
    setColorsEnabled(true);
    expect(style("x", "yellow")).toBe("\x1b[33mx\x1b[0m");
    setColorsEnabled(false);
    expect(style("x", "yellow")).toBe("x");
  });

  test("los estilos no se anidan", () => {
    setColorsEnabled(true);
    const nested = style(`a ${style("b", "red")} c`, "bold");
    expect(nested).toContain("\x1b[1ma \x1b[31mb\x1b[0m c\x1b[0m");
    setColorsEnabled(false);
  });

  afterEach(() => {
    setColorsEnabled(false);
  });
});
