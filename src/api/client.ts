import { MAX_ATTEMPTS, REQUEST_TIMEOUT_MS, RETRY_DELAY_MS } from "../utils/constants.ts";
import { ApiError } from "./errors.ts";

const NETWORK_ERROR_MESSAGE =
  "No se pudo conectar con Open-Meteo. Revisa tu conexión a internet e inténtalo de nuevo.";

/**
 * Fallo transitorio (sin red, timeout o 5xx/429): merece un reintento.
 * No se exporta: tras agotar los reintentos se relanza tal cual y el llamador
 * solo ve un `ApiError` con el mensaje en español.
 */
class TransientApiError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = "TransientApiError";
  }
}

/**
 * Realiza la petición con un reintento automático ante fallos transitorios
 * (microcortes de red/DNS, timeouts o 5xx/429 de Open-Meteo). Los errores de
 * cliente (4xx) y las respuestas malformadas no se reintentan: volver a
 * pedirlos daría el mismo resultado.
 */
export async function requestJson(url: URL): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await sleep(RETRY_DELAY_MS);
    }
    try {
      return await requestJsonOnce(url);
    } catch (error) {
      if (!(error instanceof TransientApiError) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}

async function requestJsonOnce(url: URL): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new TransientApiError(
        `La petición a Open-Meteo tardó más de ${REQUEST_TIMEOUT_MS / 1000} segundos en responder.`,
      );
    }
    throw new TransientApiError(NETWORK_ERROR_MESSAGE);
  }
  if (!response.ok) {
    const message = `Open-Meteo respondió con el estado HTTP ${response.status}.`;
    if (isRetryableStatus(response.status)) {
      throw new TransientApiError(message);
    }
    throw new ApiError(message);
  }
  try {
    return await response.json();
  } catch {
    throw new ApiError("La respuesta de Open-Meteo no es un JSON válido.");
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
