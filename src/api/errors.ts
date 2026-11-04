export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export class CityNotFoundError extends Error {
  constructor(cityName: string) {
    super(`No se encontró la ciudad «${cityName}».`);
    this.name = "CityNotFoundError";
  }
}

/** Comprueba si es un error de API conocido; su mensaje ya está listo para mostrar. */
export function isKnownApiError(error: unknown): error is ApiError | CityNotFoundError {
  return error instanceof ApiError || error instanceof CityNotFoundError;
}
