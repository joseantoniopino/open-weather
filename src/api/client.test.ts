import { afterEach, describe, expect, test } from "bun:test";

import { ApiError } from "./errors.ts";
import { getWeather } from "./weather.ts";
import type { City } from "../types/City.ts";

const MADRID: City = {
  id: 3117735,
  name: "Madrid",
  admin1: "Madrid",
  country: "España",
  latitude: 40.4165,
  longitude: -3.70256,
};

const ORIGINAL_FETCH = globalThis.fetch;

/** Instala un `fetch` falso con una respuesta por llamada y cuenta las llamadas. */
function installFetch(...handlers: Array<() => Promise<Response>>): { calls: number } {
  const state = { calls: 0 };
  const pending = [...handlers];
  globalThis.fetch = (async () => {
    state.calls += 1;
    const handler = pending.shift();
    if (!handler) {
      throw new Error("fetch llamado más veces de lo esperado.");
    }
    return handler();
  }) as unknown as typeof fetch;
  return state;
}

function okResponse(body: unknown): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

function weatherBody(temperature: number): { current: { temperature_2m: number }; current_units: { temperature_2m: string } } {
  return {
    current: { temperature_2m: temperature },
    current_units: { temperature_2m: "°C" },
  };
}

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
});

describe("requestJson reintentos", () => {
  test("reintenta una vez tras un fallo de red", async () => {
    const state = installFetch(
      () => Promise.reject(new TypeError("fetch failed")),
      () => okResponse(weatherBody(21.5)),
    );
    const weather = await getWeather(MADRID, "celsius");
    expect(weather.temperature).toBe(21.5);
    expect(state.calls).toBe(2);
  });

  test("reintenta una vez tras un 5xx", async () => {
    const state = installFetch(
      () => Promise.resolve(new Response("upstream error", { status: 503 })),
      () => okResponse(weatherBody(18)),
    );
    const weather = await getWeather(MADRID, "celsius");
    expect(weather.temperature).toBe(18);
    expect(state.calls).toBe(2);
  });

  test("no reintenta los errores 4xx", async () => {
    const state = installFetch(() => Promise.resolve(new Response("{}", { status: 404 })));
    await expect(getWeather(MADRID, "celsius")).rejects.toBeInstanceOf(ApiError);
    expect(state.calls).toBe(1);
  });

  test("se rinde con el mensaje de red tras agotar el reintento", async () => {
    const state = installFetch(
      () => Promise.reject(new TypeError("fetch failed")),
      () => Promise.reject(new TypeError("fetch failed")),
    );
    await expect(getWeather(MADRID, "celsius")).rejects.toThrow(
      "No se pudo conectar con Open-Meteo",
    );
    expect(state.calls).toBe(2);
  });
});
