import { describe, expect, test } from "bun:test";

// Spec: specs/testing/utils.feature
import {
  formatCity,
  formatForecastDate,
  formatRain,
  unitSymbol,
} from "../../src/utils/format.ts";
import { makeCity } from "../helpers/fixtures.ts";
import type { City } from "../../src/types/City.ts";

describe("unitSymbol", () => {
  test("devuelve el símbolo correcto por unidad", () => {
    expect(unitSymbol("celsius")).toBe("°C");
    expect(unitSymbol("fahrenheit")).toBe("°F");
  });
});

describe("formatCity", () => {
  test("compone nombre, región y país", () => {
    expect(formatCity(makeCity())).toBe("Ottawa — Ontario, Canada");
  });

  test("omite la región si falta", () => {
    expect(formatCity(makeCity({ admin1: null }))).toBe("Ottawa — Canada");
  });

  test("omite el país si falta", () => {
    expect(formatCity(makeCity({ country: null }))).toBe("Ottawa — Ontario");
  });

  test("devuelve solo el nombre sin región ni país", () => {
    expect(formatCity(makeCity({ admin1: null, country: null }))).toBe("Ottawa");
  });

  test("ignora textos vacíos y nunca añade ANSI", () => {
    const city: City = makeCity({ admin1: "", country: "" });
    expect(formatCity(city)).toBe("Ottawa");
    expect(formatCity(city)).not.toContain("\x1b");
  });
});

describe("formatForecastDate", () => {
  test("traduce una fecha válida a «día número mes» en español", () => {
    expect(formatForecastDate("2026-11-04")).toBe("mié 4 nov");
  });

  test("maneja rangos completos de ejemplo en UTC", () => {
    expect(formatForecastDate("2026-01-01")).toBe("jue 1 ene");
    expect(formatForecastDate("2024-02-29")).toBe("jue 29 feb"); // bisiesto
    expect(formatForecastDate("2026-12-31")).toBe("jue 31 dic");
  });

  test("devuelve la entrada tal cual si no es una fecha YYYY-MM-DD", () => {
    expect(formatForecastDate("mañana")).toBe("mañana");
    expect(formatForecastDate("")).toBe("");
    expect(formatForecastDate("2026-1-1")).toBe("2026-1-1");
    expect(formatForecastDate("2026-11-04T10:00")).toBe("2026-11-04T10:00");
  });
});

describe("formatRain", () => {
  test("muestra un guion si la probabilidad no está disponible", () => {
    expect(formatRain(null)).toBe("Lluvia —");
  });

  test("muestra el porcentaje siempre que exista", () => {
    expect(formatRain(0)).toBe("Lluvia 0 %");
    expect(formatRain(75)).toBe("Lluvia 75 %");
  });
});
