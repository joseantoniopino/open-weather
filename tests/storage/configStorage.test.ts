import { beforeEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/storage.feature
import {
  MADRID,
  OTTAWA,
  makeConfig,
} from "../helpers/fixtures.ts";
import { backupFile, resetConfigStorage, writeRawConfig } from "../helpers/config.ts";
import { addCityToConfig } from "../../src/storage/citiesStorage.ts";
import {
  createDefaultConfig,
  loadConfig,
  parseAppConfig,
  saveConfig,
} from "../../src/storage/configStorage.ts";
import { CONFIG_FILE } from "../../src/utils/constants.ts";

describe("parseAppConfig", () => {
  test("realiza el round-trip de una configuración guardada", () => {
    const original = makeConfig({ unit: "fahrenheit" });
    addCityToConfig(original, OTTAWA);
    addCityToConfig(original, MADRID);
    const parsed = parseAppConfig(JSON.parse(JSON.stringify(original)) as unknown);
    expect(parsed).toEqual(original);
  });

  test("descarta un defaultCityId que ya no existe", () => {
    const parsed = parseAppConfig({
      version: 1,
      unit: "fahrenheit",
      defaultCityId: 123,
      cities: [],
    });
    expect(parsed.defaultCityId).toBeNull();
    expect(parsed.unit).toBe("fahrenheit");
  });

  test("rechaza una unidad no válida", () => {
    expect(() => parseAppConfig({ version: 1, unit: "kelvin", cities: [] })).toThrow(
      "La unidad de temperatura no es válida.",
    );
  });

  test("rechaza una versión incompatible", () => {
    expect(() => parseAppConfig({ version: 2, unit: "celsius", cities: [] })).toThrow(
      "La versión del archivo de configuración no es compatible.",
    );
  });

  test("rechaza algo que no es un objeto JSON", () => {
    for (const raw of [null, "texto", 5, []]) {
      expect(() => parseAppConfig(raw)).toThrow(
        "El archivo de configuración debe ser un objeto JSON.",
      );
    }
  });

  test("rechaza una lista de ciudades no array", () => {
    expect(() => parseAppConfig({ version: 1, unit: "celsius", cities: "no" })).toThrow(
      "La lista de ciudades no es un array.",
    );
  });

  test("normaliza defaultCityId ausente a null", () => {
    const parsed = parseAppConfig({ version: 1, unit: "celsius", cities: [] });
    expect(parsed.defaultCityId).toBeNull();
  });

  test("rechaza un defaultCityId no numérico", () => {
    for (const bad of ["5", Number.NaN]) {
      expect(() =>
        parseAppConfig({ version: 1, unit: "celsius", defaultCityId: bad, cities: [] }),
      ).toThrow("El identificador de la ciudad default no es válido.");
    }
  });

  test("normaliza campos opcionales de las ciudades a null", () => {
    const parsed = parseAppConfig({
      version: 1,
      unit: "celsius",
      defaultCityId: null,
      cities: [{ id: OTTAWA.id, name: "Ottawa", latitude: 45.41117, longitude: -75.69812 }],
    });
    expect(parsed.cities[0]).toEqual({
      id: OTTAWA.id,
      name: "Ottawa",
      admin1: null,
      country: null,
      latitude: 45.41117,
      longitude: -75.69812,
    });
  });

  test("rechaza ciudades con campos inválidos", () => {
    const invalidCities: Array<unknown> = [
      { name: "X", latitude: 1, longitude: 2 },
      { id: 1, latitude: 1, longitude: 2 },
      { id: 1, name: "X", longitude: 2 },
      { id: 1, name: "X", latitude: 1 },
      { id: 1, name: "", latitude: 1, longitude: 2 },
    ];
    for (const city of invalidCities) {
      expect(() => parseAppConfig({ version: 1, unit: "celsius", cities: [city] })).toThrow();
    }
    expect(() =>
      parseAppConfig({
        version: 1,
        unit: "celsius",
        cities: [{ name: "X", latitude: 1, longitude: 2 }],
      }),
    ).toThrow("El campo el identificador de la ciudad debe ser un número.");
  });

  test("normaliza admin1/country no string de una ciudad a null", () => {
    const parsed = parseAppConfig({
      version: 1,
      unit: "celsius",
      cities: [{ id: 1, name: "X", latitude: 1, longitude: 2, admin1: 5, country: false }],
    });
    expect(parsed.cities[0]?.admin1).toBeNull();
    expect(parsed.cities[0]?.country).toBeNull();
  });
});

describe("createDefaultConfig", () => {
  test("devuelve una configuración vacía en celsius", () => {
    expect(createDefaultConfig()).toEqual(makeConfig());
    expect(createDefaultConfig()).not.toBe(createDefaultConfig());
    expect(createDefaultConfig().cities).not.toBe(createDefaultConfig().cities);
  });
});

describe("loadConfig y saveConfig en disco sandbox", () => {
  beforeEach(async () => {
    await resetConfigStorage();
  });

  test("sin archivo devuelve la configuración por defecto y no la crea", async () => {
    const loaded = await loadConfig();
    expect(loaded.warning).toBeUndefined();
    expect(loaded.config).toEqual(makeConfig());
    const exists = await Bun.file(CONFIG_FILE).exists();
    expect(exists).toBe(false);
  });

  test("saveConfig crea el directorio y deja JSON bonito con newline final", async () => {
    const config = makeConfig({ unit: "fahrenheit", defaultCityId: OTTAWA.id });
    config.cities.push(MADRID, OTTAWA);
    await saveConfig(config);
    const raw = await Bun.file(CONFIG_FILE).text();
    const expected = `${JSON.stringify(config, null, 2)}\n`;
    expect(raw).toBe(expected);
  });

  test("saveConfig y loadConfig realizan un round-trip", async () => {
    const config = makeConfig({ unit: "fahrenheit", defaultCityId: OTTAWA.id });
    addCityToConfig(config, MADRID);
    addCityToConfig(config, OTTAWA);
    await saveConfig(config);
    const loaded = await loadConfig();
    expect(loaded.warning).toBeUndefined();
    expect(loaded.config).toEqual(config);
    expect(await Bun.file(`${CONFIG_FILE}.tmp`).exists()).toBe(false);
  });

  test("un JSON corrupto dispara un aviso y crea el backup .bak", async () => {
    const raw = "{ barra rota";
    await writeRawConfig(raw);
    const loaded = await loadConfig();
    expect(loaded.config).toEqual(makeConfig());
    expect(loaded.warning).toContain("El archivo de configuración está dañado");
    expect(loaded.warning).toContain(`${CONFIG_FILE}.bak`);
    expect(await Bun.file(backupFile()).text()).toBe(raw);
  });

  test("un JSON válido pero semánticamente inválido también dispara el aviso", async () => {
    const raw = JSON.stringify({ version: 1, unit: "kelvin", cities: [] });
    await writeRawConfig(raw);
    const loaded = await loadConfig();
    expect(loaded.config).toEqual(makeConfig());
    expect(loaded.warning).toContain("El archivo de configuración está dañado");
    expect(await Bun.file(backupFile()).text()).toBe(raw);
  });
});
