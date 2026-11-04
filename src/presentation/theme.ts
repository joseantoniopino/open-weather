import { style } from "../utils/colors.ts";

export const MENU_WIDTH = 40;
export const INDENT = "  ";
export const SEPARATOR = "═".repeat(MENU_WIDTH);

/** Paleta de la interfaz. Para cambiar el aspecto, editar solo este mapa. */
export const paint = {
  menu: (text: string) => style(text, "cyan"),
  title: (text: string) => style(text, "bold", "cyan"),
  temperature: (text: string) => style(text, "bold", "yellow"),
  city: (text: string) => style(text, "bold"),
  defaultMarker: (text: string) => style(text, "dim", "yellow"),
  success: (text: string) => style(text, "green"),
  error: (text: string) => style(text, "red"),
  info: (text: string) => style(text, "cyan"),
};
