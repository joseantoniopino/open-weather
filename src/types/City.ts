export interface City {
  id: number;
  name: string;
  admin1: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

/** Resultados no vacíos de una búsqueda de ciudad. */
export type CityMatches = [City, ...City[]];
