import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/actions.feature
import {
  MADRID,
  geocodingBody,
  makeCity,
  makeConfig,
} from "../helpers/fixtures.ts";
import { installFetch, jsonResponse, type FetchMock } from "../helpers/fetch.ts";
import { captureConsole, queuePrompts } from "../helpers/io.ts";
import { addCity } from "../../src/actions/addCity.ts";
import { CityNotFoundError } from "../../src/api/errors.ts";
import { readConfig, resetConfigStorage } from "../helpers/config.ts";

describe("addCity", () => {
  let fetchMock: FetchMock;
  let prompts: ReturnType<typeof queuePrompts>;
  let output: ReturnType<typeof captureConsole>;
  beforeEach(resetConfigStorage);

  afterEach(() => {
    fetchMock.restore();
    prompts.restore();
    output.restore();
  });

  test("cancelar el nombre imprime cancelación y no consulta nada", async () => {
    fetchMock = installFetch();
    prompts = queuePrompts(null);
    output = captureConsole();
    await addCity(makeConfig());
    expect(output.log).toContain("Búsqueda cancelada.");
    expect(fetchMock.calls).toHaveLength(0);
  });

  test("un único resultado se agrega y persiste directamente", async () => {
    fetchMock = installFetch(() => jsonResponse(geocodingBody([MADRID])));
    prompts = queuePrompts("Madrid");
    output = captureConsole();
    const config = makeConfig();
    await addCity(config);
    expect(output.log).toContain(`✔ Ciudad agregada: ${"Madrid — Madrid, España"}`);
    expect(output.log).toContain("Se estableció como ciudad default: Madrid — Madrid, España");
    expect(config.cities).toHaveLength(1);
    expect(config.defaultCityId).toBe(MADRID.id);
    expect(prompts.calls).toBe(1);
    expect(await readConfig()).toEqual(config);
  });

  test("con varios resultados se numeran y se elige por número", async () => {
    const first = makeCity({ id: 4, name: "Granada", admin1: "Granada", country: "España" });
    const second = makeCity({ id: 5, name: "Granada", admin1: null, country: "Colombia" });
    fetchMock = installFetch(() => jsonResponse(geocodingBody([first, second])));
    prompts = queuePrompts("Granada", "2");
    output = captureConsole();
    const config = makeConfig();
    await addCity(config);
    const printed = output.log;
    expect(printed).toContain("Resultados para «Granada» (2):");
    expect(printed).toContain(`2. Granada — Colombia`);
    expect(config.defaultCityId).toBe(5);
    expect(prompts.calls).toBe(2);
  });

  test("selección vacía cancela tras el listado y no guarda", async () => {
    fetchMock = installFetch(() => jsonResponse(geocodingBody([makeCity(), makeCity()])));
    prompts = queuePrompts("Ottawa", "");
    output = captureConsole();
    const config = makeConfig();
    await addCity(config);
    expect(output.log).toContain("Búsqueda cancelada.");
    expect(config.cities).toHaveLength(0);
    expect(prompts.calls).toBe(2);
  });

  test("una selección inválida repregunta hasta un número válido", async () => {
    const second = makeCity({ id: 2, name: "PPT" });
    fetchMock = installFetch(() => jsonResponse(geocodingBody([makeCity(), second])));
    prompts = queuePrompts("X", "no-soy-número", "77", "2");
    output = captureConsole();
    const config = makeConfig();
    await addCity(config);
    expect(output.error).toContain("Debes introducir un número.");
    expect(output.error).toContain("Debes elegir un número entre 1 y 2.");
    expect(config.defaultCityId).toBe(2);
    expect(prompts.calls).toBe(4);
  });

  test("un duplicado se detecta y no se persiste", async () => {
    fetchMock = installFetch(() => jsonResponse(geocodingBody([MADRID])));
    prompts = queuePrompts("Madrid");
    output = captureConsole();
    const config = makeConfig({ cities: [MADRID] });
    await addCity(config);
    expect(output.error).toContain("Esa ciudad ya está guardada. Usa la opción 2 para verla.");
    expect(config.cities).toHaveLength(1);
  });

  test("duplicado detectado deja el disco sin operaciones", async () => {
    fetchMock = installFetch(() => jsonResponse(geocodingBody([MADRID])));
    prompts = queuePrompts("Madrid");
    output = captureConsole();
    await addCity(makeConfig({ cities: [MADRID] }));
    expect(await Bun.file(`${process.env.HOME}/.weather-cli/config.json`).exists()).toBe(false);
  });

  test("sin resultados rechaza con CityNotFoundError", async () => {
    fetchMock = installFetch(() => jsonResponse({}));
    prompts = queuePrompts("Gotham");
    output = captureConsole();
    await expect(addCity(makeConfig())).rejects.toBeInstanceOf(CityNotFoundError);
    expect(fetchMock.calls).toHaveLength(1);
  });

  test("nombre vacío tras recortar rechaza con CityNotFoundError", async () => {
    fetchMock = installFetch();
    prompts = queuePrompts("   ");
    output = captureConsole();
    await expect(addCity(makeConfig())).rejects.toBeInstanceOf(CityNotFoundError);
    expect(fetchMock.calls).toHaveLength(0);
  });

  test("la ciudad elegida completa los datos devueltos por la API", async () => {
    const granada = makeCity({ id: 6, name: "Granada", admin1: "Andalucía", country: "España" });
    fetchMock = installFetch(() => jsonResponse(geocodingBody([granada])));
    prompts = queuePrompts("Granada");
    output = captureConsole();
    const config = makeConfig();
    await addCity(config);
    expect(config.cities[0]).toEqual(granada);
    expect(config.defaultCityId).toBe(6);
  });
});
