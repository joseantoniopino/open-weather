import { describe, expect, test } from "bun:test";

// Spec: specs/testing/utils.feature
import { describeWeatherCode } from "../../src/utils/weather-codes.ts";

const EXPECTED_DESCRIPTIONS: Array<[number, string]> = [
  [0, "Despejado"],
  [1, "Mayormente despejado"],
  [2, "Parcialmente nublado"],
  [3, "Nublado"],
  [45, "Niebla"],
  [48, "Niebla con escarcha"],
  [51, "Llovizna ligera"],
  [53, "Llovizna moderada"],
  [55, "Llovizna densa"],
  [56, "Llovizna helada ligera"],
  [57, "Llovizna helada densa"],
  [61, "Lluvia ligera"],
  [63, "Lluvia moderada"],
  [65, "Lluvia fuerte"],
  [66, "Lluvia helada ligera"],
  [67, "Lluvia helada fuerte"],
  [71, "Nevada ligera"],
  [73, "Nevada moderada"],
  [75, "Nevada fuerte"],
  [77, "Granos de nieve"],
  [80, "Chubascos ligeros"],
  [81, "Chubascos moderados"],
  [82, "Chubascos fuertes"],
  [85, "Chubascos de nieve ligeros"],
  [86, "Chubascos de nieve fuertes"],
  [95, "Tormenta"],
  [96, "Tormenta con granizo ligero"],
  [99, "Tormenta con granizo fuerte"],
];

describe("describeWeatherCode", () => {
  for (const [code, expected] of EXPECTED_DESCRIPTIONS) {
    test(`traduce el código WMO ${code} a «${expected}»`, () => {
      expect(describeWeatherCode(code)).toBe(expected);
    });
  }

  test("códigos no documentados devuelven «Condición desconocida»", () => {
    expect(describeWeatherCode(100)).toBe("Condición desconocida");
    expect(describeWeatherCode(-1)).toBe("Condición desconocida");
    expect(describeWeatherCode(0)).toBe("Despejado");
  });
});
