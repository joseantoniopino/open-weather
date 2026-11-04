// Spec: specs/testing/infrastructure.feature

/** Utilidades para simular `fetch` de Open-Meteo sin tocar la red real. */

export type FetchHandler = (url: URL, init?: RequestInit) => Response | Promise<Response>;

export interface FetchMock {
  /** URLs e `init` de cada llamada, en orden. */
  readonly calls: Array<{ url: URL; init?: RequestInit }>;
  /** Devuelve el `fetch` original. Idempotente. */
  restore(): void;
}

export type FetchInput = Request | string | URL;

/** Instala un `fetch` falso con respuestas encoladas por llamada. */
export function installFetch(...handlers: Array<FetchHandler>): FetchMock {
  const calls: Array<{ url: URL; init?: RequestInit }> = [];
  const previous = globalThis.fetch;
  let index = 0;
  globalThis.fetch = (async (input: FetchInput, init?: RequestInit) => {
    const url = input instanceof Request ? new URL(input.url) : new URL(input.toString());
    calls.push({ url, init });
    const handler = handlers[index];
    index += 1;
    if (!handler) {
      throw new Error(`fetch se llamó ${calls.length} veces; se esperaban ${handlers.length}.`);
    }
    return handler(url, init);
  }) as typeof fetch;
  return {
    calls,
    restore(): void {
      globalThis.fetch = previous;
    },
  };
}

/** Respuesta HTTP con cuerpo JSON. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Error de red «de verdad», con nombre para no confundirlo con AbortError. */
export function networkError(): Promise<Response> {
  return Promise.reject(new TypeError("fetch failed (simulado)"));
}

/** Timeout simulado: el cliente debe tratarlo como fallo transitorio reintetable. */
export function timeoutError(): Promise<Response> {
  const error = new Error("La señal de aborto venció (simulado).");
  error.name = "TimeoutError";
  return Promise.reject(error);
}
