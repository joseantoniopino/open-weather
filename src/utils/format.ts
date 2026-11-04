import type { City } from "../types/City.ts";
import type { TemperatureUnit } from "../types/Config.ts";

/** Símbolo de una unidad de temperatura. */
export function unitSymbol(unit: TemperatureUnit): "°C" | "°F" {
  return unit === "fahrenheit" ? "°F" : "°C";
}

/**
 * «Madrid — Madrid, España», sin ANSI: alimenta mensajes, listas y tests.
 * Nunca medir la longitud de una cadena coloreada; esta función es segura.
 */
export function formatCity(city: City): string {
  const place = [city.admin1, city.country]
    .filter((value): value is string => value !== null && value.length > 0)
    .join(", ");
  return place.length > 0 ? `${city.name} — ${place}` : city.name;
}

/** Fechas en español, fijadas a mano para no depender del locale del sistema. */
const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;
const MONTHS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/** Convierte `2026-11-04` en «mié 4 nov» sin desfases de zona horaria. */
export function formatForecastDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    return date;
  }
  const [, year, month, day] = match;
  if (!year || !month || !day) {
    return date;
  }
  const utc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(utc.getTime())) {
    return date;
  }
  const dayNumber = Number(day);
  const weekday = WEEKDAYS[utc.getUTCDay()] ?? date;
  const monthName = MONTHS[Number(month) - 1] ?? "";
  return `${weekday} ${dayNumber} ${monthName}`.trim();
}

/** Probabilidad de lluvia; `null` se muestra como «Lluvia —». */
export function formatRain(precipitation: number | null): string {
  return precipitation === null ? "Lluvia —" : `Lluvia ${precipitation} %`;
}
