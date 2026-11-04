import { describe, expect, test } from "bun:test";

// Spec: specs/testing/api.feature
import {
  asOptionalRecord,
  asOptionalString,
  assertNumber,
  assertRecord,
  assertString,
} from "../../src/api/validation.ts";
import { ApiError } from "../../src/api/errors.ts";

describe("assertRecord", () => {
  test("acepta objetos y los devuelve tal cual", () => {
    const record = { a: 1 };
    expect(assertRecord(record, "Prueba")).toBe(record);
  });

  test("rechaza null, arrays y no-objetos con ApiError", () => {
    for (const value of [null, [], "texto", 3, undefined, true]) {
      expect(() => assertRecord(value, "Prueba")).toThrow(ApiError);
      expect(() => assertRecord(value, "Prueba")).toThrow("Prueba debe ser un objeto JSON.");
    }
  });
});

describe("assertNumber", () => {
  test("acepta números finitos (incluido 0 y negativos)", () => {
    expect(assertNumber(0, "n")).toBe(0);
    expect(assertNumber(-7.5, "n")).toBe(-7.5);
    expect(assertNumber(Number.MAX_SAFE_INTEGER, "n")).toBe(Number.MAX_SAFE_INTEGER);
  });

  test("rechaza NaN, Infinity y no numéricos", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, "5", null, undefined]) {
      expect(() => assertNumber(value, "temperatura")).toThrow(ApiError);
      expect(() => assertNumber(value, "temperatura")).toThrow(
        "El campo temperatura debe ser un número.",
      );
    }
  });
});

describe("assertString", () => {
  test("acepta texto no vacío", () => {
    expect(assertString("Madrid", "ciudad")).toBe("Madrid");
  });

  test("rechaza vacío, espacios en blanco y no strings", () => {
    for (const value of ["", "   ", 5, null, undefined]) {
      expect(() => assertString(value, "ciudad")).toThrow(ApiError);
      expect(() => assertString(value, "ciudad")).toThrow(
        "El campo ciudad debe ser texto no vacío.",
      );
    }
  });
});

describe("asOptionalString", () => {
  test("devuelve el texto si no está vacío (aunque sea espacios) y null en el resto", () => {
    expect(asOptionalString("texto")).toBe("texto");
    expect(asOptionalString("   ")).toBe("   ");
    expect(asOptionalString("")).toBeNull();
    expect(asOptionalString(42)).toBeNull();
    expect(asOptionalString(null)).toBeNull();
    expect(asOptionalString(undefined)).toBeNull();
  });
});

describe("asOptionalRecord", () => {
  test("devuelve objetos, y null para arrays, primitivos y null", () => {
    const record = { a: 1 };
    expect(asOptionalRecord(record)).toBe(record);
    expect(asOptionalRecord([])).toBeNull();
    expect(asOptionalRecord("texto")).toBeNull();
    expect(asOptionalRecord(null)).toBeNull();
    expect(asOptionalRecord(undefined)).toBeNull();
  });
});
