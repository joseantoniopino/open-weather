import { afterEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/presentation.feature
import { MADRID, OTTAWA } from "../helpers/fixtures.ts";
import { captureConsole } from "../helpers/io.ts";
import { formatCity, formatForecastDate } from "../../src/utils/format.ts";
import {
  displayCityForecast,
  displayCityList,
  displayCityWeather,
  displayGoodbye,
  displaySearchResults,
  printBlankLine,
  printError,
  printInfo,
  printSuccess,
} from "../../src/presentation/output.ts";
import type { Forecast } from "../../src/types/Weather.ts";

describe("displayCityList", () => {
  test("numera las ciudades y marca la default", () => {
    const output = captureConsole();
    displayCityList([MADRID, OTTAWA], MADRID.id);
    const printed = output.log;
    expect(printed).toContain("Ciudades guardadas (2):");
    expect(printed).toContain(`1. ${formatCity(MADRID)} (default)`);
    expect(printed).toContain(`2. ${formatCity(OTTAWA)}`);
    expect(printed.indexOf(" (default)")).toBeLessThan(printed.indexOf(formatCity(OTTAWA)));
    output.restore();
  });

  test("lista vacía imprime solo el título y el contador", () => {
    const output = captureConsole();
    displayCityList([], null);
    expect(output.log).toContain("Ciudades guardadas (0):");
    output.restore();
  });
});

describe("displaySearchResults", () => {
  test("muestra la consulta y las ciudades numeradas", () => {
    const output = captureConsole();
    displaySearchResults([MADRID], "Madrid");
    const printed = output.log;
    expect(printed).toContain("Resultados para «Madrid» (1):");
    expect(printed).toContain(`1. ${formatCity(MADRID)}`);
    output.restore();
  });
});

describe("displayCityWeather", () => {
  test("muestra ciudad y temperatura con símbolo", () => {
    const output = captureConsole();
    displayCityWeather(MADRID, { temperature: 21.5, unitSymbol: "°C" });
    expect(output.log).toContain(formatCity(MADRID));
    expect(output.log).toContain("Temperatura actual: 21.5 °C");
    output.restore();
  });
});

describe("displayCityForecast", () => {
  test("muestra los días con fecha, descripción, máximo, mínimo y lluvia", () => {
    const output = captureConsole();
    const forecast: Forecast = {
      unitSymbol: "°C",
      days: [
        {
          date: "2026-11-04",
          weatherCode: 0,
          temperatureMax: 12,
          temperatureMin: 4,
          precipitationProbability: 10,
        },
        {
          date: "2026-11-05",
          weatherCode: 61,
          temperatureMax: 14,
          temperatureMin: 5,
          precipitationProbability: null,
        },
      ],
    };
    displayCityForecast(MADRID, forecast);
    const printed = output.log;
    expect(printed).toContain("Pronóstico de 7 días:");
    expect(printed).toContain(formatForecastDate("2026-11-04"));
    expect(printed).toContain("Despejado");
    expect(printed).toContain("Máx 12 °C");
    expect(printed).toContain("Mín 4 °C");
    expect(printed).toContain("Lluvia 10 %");
    expect(printed).toContain(formatForecastDate("2026-11-05"));
    expect(printed).toContain("Lluvia ligera");
    expect(printed).toContain("Lluvia —");
    output.restore();
  });
});

describe("mensajes genéricos", () => {
  let output: ReturnType<typeof captureConsole>;
  afterEach(() => {
    output.restore();
  });

  test("printError escribe en console.error con «✖»", () => {
    output = captureConsole();
    printError("Algo ha fallado.");
    expect(output.log).toBe("");
    expect(output.error).toContain("✖ Algo ha fallado.");
  });

  test("printInfo escribe en console.log con «ℹ»", () => {
    output = captureConsole();
    printInfo("Búsqueda cancelada.");
    expect(output.error).toBe("");
    expect(output.log).toContain("ℹ Búsqueda cancelada.");
  });

  test("printSuccess escribe en console.log con «✔»", () => {
    output = captureConsole();
    printSuccess("Ciudad agregada.");
    expect(output.log).toContain("✔ Ciudad agregada.");
    output.restore();
  });

  test("printBlankLine y displayGoodbye escriben en console.log", () => {
    output = captureConsole();
    printBlankLine();
    expect(output.log.split("\n").some((line) => line.trim() === "")).toBe(true);
    displayGoodbye();
    expect(output.log).toContain("¡Hasta pronto!");
  });
});
