import { describe, expect, test } from "bun:test";

// Spec: specs/testing/actions.feature
import { describeApiError, loadingLabel } from "../../src/actions/shared.ts";
import { CityNotFoundError, ApiError } from "../../src/api/errors.ts";

describe("loadingLabel", () => {
  test("singular con una ciudad", () => {
    expect(loadingLabel("Consultando el clima", 1)).toBe("Consultando el clima de 1 ciudad…");
  });

  test("plural con varias ciudades", () => {
    expect(loadingLabel("Consultando el clima", 4)).toBe(
      "Consultando el clima de 4 ciudades…",
    );
    expect(loadingLabel("Consultando el pronóstico", 0)).toBe(
      "Consultando el pronóstico de 0 ciudades…",
    );
  });
});

describe("describeApiError", () => {
  test("usa el mensaje del ApiError conocido", () => {
    const error = new ApiError("Open-Meteo respondió con el estado HTTP 404.");
    expect(describeApiError(error, "fallback")).toBe(
      "Open-Meteo respondió con el estado HTTP 404.",
    );
  });

  test("usa el mensaje del CityNotFoundError conocido", () => {
    const error = new CityNotFoundError("Gondor");
    expect(describeApiError(error, "fallback")).toBe("No se encontró la ciudad «Gondor».");
  });

  test("usa el fallback para el resto de errores", () => {
    expect(describeApiError(new Error("Dominio no resuelve"), "No se pudo.")).toBe("No se pudo.");
    expect(describeApiError(null, "fallback")).toBe("fallback");
    expect(describeApiError("texto", "fallback")).toBe("fallback");
  });
});
