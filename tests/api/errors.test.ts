import { describe, expect, test } from "bun:test";

// Spec: specs/testing/api.feature
import {
  ApiError,
  CityNotFoundError,
  isKnownApiError,
} from "../../src/api/errors.ts";

describe("isKnownApiError", () => {
  test("reconoce ApiError", () => {
    const error = new ApiError("Ocurrió algo.");
    expect(isKnownApiError(error)).toBe(true);
  });

  test("reconoce CityNotFoundError y su mensaje según la ciudad", () => {
    const error = new CityNotFoundError("Gondor");
    expect(isKnownApiError(error)).toBe(true);
    expect(error.message).toBe("No se encontró la ciudad «Gondor».");
  });

  test("rechaza errores genéricos y otros valores", () => {
    for (const value of [
      new Error("Error genérico."),
      { name: "ApiError" },
      "ApiError",
      42,
      null,
      undefined,
    ]) {
      expect(isKnownApiError(value)).toBe(false);
    }
  });

  test("los errores conocidos llevan su tipo como name", () => {
    expect(new ApiError("x").name).toBe("ApiError");
    expect(new CityNotFoundError("x").name).toBe("CityNotFoundError");
  });
});
