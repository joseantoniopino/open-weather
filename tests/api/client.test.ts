import { afterEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/api.feature
import { MADRID, weatherBody } from "../helpers/fixtures.ts";
import {
  installFetch,
  jsonResponse,
  networkError,
  timeoutError,
  type FetchMock,
} from "../helpers/fetch.ts";
import { ApiError } from "../../src/api/errors.ts";
import { requestJson } from "../../src/api/client.ts";
import { getWeather } from "../../src/api/weather.ts";

const DATA_URL = new URL("https://analytics.open-meteo.example/v1/data");

describe("requestJson", () => {
  let fetchMock: FetchMock;
  afterEach(() => {
    fetchMock.restore();
  });

  test("hace una única llamada y devuelve el JSON parseado", async () => {
    fetchMock = installFetch(() => jsonResponse({ ok: true }));
    const result = (await requestJson(DATA_URL)) as { ok?: boolean };
    expect(result.ok).toBe(true);
    expect(fetchMock.calls).toHaveLength(1);
    expect(String(fetchMock.calls[0]?.url)).toBe(DATA_URL.href);
    expect(fetchMock.calls[0]?.init?.signal).toBeInstanceOf(AbortSignal);
  });

  test("reintenta una vez tras un fallo de red", async () => {
    fetchMock = installFetch(networkError, () => jsonResponse({ attempt: 2 }));
    const result = (await requestJson(DATA_URL)) as { attempt?: number };
    expect(result.attempt).toBe(2);
    expect(fetchMock.calls).toHaveLength(2);
  });

  test("reintenta una vez tras un 429", async () => {
    fetchMock = installFetch(
      () => jsonResponse({ error: "too many requests" }, 429),
      () => jsonResponse({ attempt: 2 }),
    );
    const result = (await requestJson(DATA_URL)) as { attempt?: number };
    expect(result.attempt).toBe(2);
    expect(fetchMock.calls).toHaveLength(2);
  });

  test("no reintenta un 4xx y lanza el mensaje de estado", async () => {
    fetchMock = installFetch(() => jsonResponse({}, 404));
    await expect(requestJson(DATA_URL)).rejects.toThrow(
      "Open-Meteo respondió con el estado HTTP 404.",
    );
    expect(fetchMock.calls).toHaveLength(1);
  });

  test("no reintenta un JSON inválido y lanza el mensaje de JSON", async () => {
    fetchMock = installFetch(() => new Response("no es json", { status: 200 }));
    await expect(requestJson(DATA_URL)).rejects.toThrow(
      "La respuesta de Open-Meteo no es un JSON válido.",
    );
    expect(fetchMock.calls).toHaveLength(1);
  });

  test("se rinde con el mensaje de red tras agotar el reintento", async () => {
    fetchMock = installFetch(networkError, networkError);
    await expect(requestJson(DATA_URL)).rejects.toThrow(
      "No se pudo conectar con Open-Meteo",
    );
    expect(fetchMock.calls).toHaveLength(2);
  });

  test("se rinde con el mensaje de 5xx tras agotar el reintento", async () => {
    fetchMock = installFetch(
      () => jsonResponse({}, 503),
      () => jsonResponse({}, 503),
    );
    await expect(requestJson(DATA_URL)).rejects.toThrow("estado HTTP 503");
    expect(fetchMock.calls).toHaveLength(2);
  });

  test("trata el timeout como fallo transitorio y reintenta", async () => {
    fetchMock = installFetch(timeoutError, () => jsonResponse({ recovered: true }));
    const result = (await requestJson(DATA_URL)) as { recovered?: boolean };
    expect(result.recovered).toBe(true);
    expect(fetchMock.calls).toHaveLength(2);
  });

  test("se rinde con el mensaje de timeout tras agotar el reintento", async () => {
    fetchMock = installFetch(timeoutError, timeoutError);
    await expect(requestJson(DATA_URL)).rejects.toThrow(
      "tardó más de 10 segundos en responder",
    );
    expect(fetchMock.calls).toHaveLength(2);
  });
});

describe("requestJson a través de getWeather", () => {
  let fetchMock: FetchMock;
  afterEach(() => {
    fetchMock.restore();
  });

  test("reintenta una vez tras un 5xx y devuelve el clima", async () => {
    fetchMock = installFetch(
      () => jsonResponse({}, 503),
      (url) => {
        expect(url.searchParams.get("latitude")).toBe(String(MADRID.latitude));
        return jsonResponse(weatherBody(18));
      },
    );
    const weather = await getWeather(MADRID, "celsius");
    expect(weather.temperature).toBe(18);
    expect(fetchMock.calls).toHaveLength(2);
  });

  test("no reintenta los errores 4xx", async () => {
    fetchMock = installFetch(() => jsonResponse({}, 404));
    await expect(getWeather(MADRID, "celsius")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock.calls).toHaveLength(1);
  });
});
