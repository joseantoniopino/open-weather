import { afterEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/api.feature
import { MADRID, makeCity } from "../helpers/fixtures.ts";
import { jsonResponse, installFetch, type FetchMock } from "../helpers/fetch.ts";
import { ApiError, CityNotFoundError } from "../../src/api/errors.ts";
import { searchCities } from "../../src/api/geocoding.ts";

describe("searchCities", () => {
  let fetchMock: FetchMock;
  afterEach(() => {
    fetchMock.restore();
  });

  test("construye la URL con los parámetros esperados y recorta el nombre", async () => {
    fetchMock = installFetch(() => jsonResponse({ results: [MADRID] }));
    const matches = await searchCities("  Madrid  ");
    expect(matches).toEqual([MADRID]);
    const url = fetchMock.calls[0]?.url;
    expect(url?.origin).toBe("https://geocoding-api.open-meteo.com");
    expect(url?.pathname).toBe("/v1/search");
    expect(url?.searchParams.get("name")).toBe("Madrid");
    expect(url?.searchParams.get("count")).toBe("10");
    expect(url?.searchParams.get("language")).toBe("es");
    expect(url?.searchParams.get("format")).toBe("json");
  });

  test("devuelve varios candidatos en el orden recibido", async () => {
    const first = makeCity();
    const second = makeCity({
      id: 3117735,
      name: "Madrid",
      admin1: "Madrid",
      country: "España",
    });
    fetchMock = installFetch(() => jsonResponse({ results: [first, second] }));
    const matches = await searchCities("Madrid");
    expect(matches).toEqual([first, second]);
  });

  test("completa admin1 y country como null si no llegan", async () => {
    fetchMock = installFetch(
      () =>
        jsonResponse({
          results: [{ id: 1, name: "Pueblo", latitude: 1.5, longitude: -2.25 }],
        }),
    );
    const matches = await searchCities("Pueblo");
    expect(matches).toEqual([
      { id: 1, name: "Pueblo", admin1: null, country: null, latitude: 1.5, longitude: -2.25 },
    ]);
  });

  test("un nombre vacío lanza CityNotFoundError sin llamar al fetch", async () => {
    fetchMock = installFetch();
    await expect(searchCities("")).rejects.toBeInstanceOf(CityNotFoundError);
    await expect(searchCities("   ")).rejects.toBeInstanceOf(CityNotFoundError);
    expect(fetchMock.calls).toHaveLength(0);
  });

  test("sin resultados lanza CityNotFoundError con el nombre pedido", async () => {
    fetchMock = installFetch(() => jsonResponse({}));
    const promise: Promise<unknown> = searchCities("Gotham");
    await expect(promise).rejects.toBeInstanceOf(CityNotFoundError);
    await expect(promise).rejects.toThrow("No se encontró la ciudad «Gotham».");
    expect(fetchMock.calls).toHaveLength(1);
  });

  test("con una lista vacía lanza CityNotFoundError", async () => {
    fetchMock = installFetch(() => jsonResponse({ results: [] }));
    await expect(searchCities("Gotham")).rejects.toBeInstanceOf(CityNotFoundError);
  });

  test("una respuesta con resultados malformados lanza ApiError", async () => {
    fetchMock = installFetch(() => jsonResponse({ results: [{ id: "no-es-número" }] }));
    const promise: Promise<unknown> = searchCities("Gotham");
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toThrow(
      "El campo el identificador de la ciudad debe ser un número.",
    );
    expect(fetchMock.calls).toHaveLength(1);
  });

  test("una respuesta cuyo results no es un array lanza CityNotFoundError", async () => {
    fetchMock = installFetch(() => jsonResponse({ results: "no soy un array" }));
    await expect(searchCities("Gotham")).rejects.toBeInstanceOf(CityNotFoundError);
  });
});
