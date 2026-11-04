import { isKnownApiError } from "../api/errors.ts";
import { withLoading } from "../presentation/loading.ts";
import { saveConfig } from "../storage/configStorage.ts";
import type { AppConfig } from "../types/Config.ts";

/** Único punto de guardado; centraliza también el estado de carga. */
export function persistConfig(config: AppConfig): Promise<void> {
  return withLoading("Guardando configuración…", () => saveConfig(config));
}

/** Etiqueta para spinner con plural automático, p. ej. «de 4 ciudades…». */
export function loadingLabel(action: string, count: number): string {
  const noun = count === 1 ? "ciudad" : "ciudades";
  return `${action} de ${count} ${noun}…`;
}

/** Mensaje de un error de API conocido; para el resto, un texto alternativo. */
export function describeApiError(error: unknown, fallback: string): string {
  return isKnownApiError(error) ? error.message : fallback;
}
