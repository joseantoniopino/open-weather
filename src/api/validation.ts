import { ApiError } from "./errors.ts";

/**
 * Validaciones de las respuestas JSON de Open-Meteo.
 * Todos los fallos se lanzan como `ApiError` con un mensaje en español.
 */

export function assertRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(`${label} debe ser un objeto JSON.`);
  }
  return value as Record<string, unknown>;
}

export function assertNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ApiError(`El campo ${label} debe ser un número.`);
  }
  return value;
}

export function assertString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(`El campo ${label} debe ser texto no vacío.`);
  }
  return value;
}

export function asOptionalString(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  return null;
}

export function asOptionalRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}
