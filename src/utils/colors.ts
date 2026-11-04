const ANSI_CODES = {
  bold: 1,
  dim: 2,
  red: 31,
  green: 32,
  yellow: 33,
  cyan: 36,
} as const;

/** Estilos que se pueden combinar en una sola secuencia de escape. */
export type Style = keyof typeof ANSI_CODES;

const ESC = "\x1b[";
const RESET = `${ESC}0m`;

/**
 * Detecta si el entorno puede mostrar color.
 * Prioridad:
 * 1. FORCE_COLOR (fuerza el color; "0" o "false" lo apaga).
 * 2. NO_COLOR con valor no vacío apaga el color.
 * 3. Solo si stdout es TTY y TERM no es "dumb".
 */
export function supportsColor(
  env: Record<string, string | undefined> = process.env,
  isTTY: boolean = process.stdout.isTTY,
): boolean {
  const force = env.FORCE_COLOR;
  if (force !== undefined) {
    return force !== "0" && force !== "false";
  }
  if (env.NO_COLOR !== undefined && env.NO_COLOR !== "") {
    return false;
  }
  return isTTY && env.TERM !== "dumb";
}

let enabled = supportsColor();

/** Interruptor manual (pensado para tests o un futuro --no-color). */
export function setColorsEnabled(value: boolean): void {
  enabled = value;
}

/**
 * Aplica estilos a un texto en una única secuencia de escape, de modo que
 * nunca se anidan estilos ni se cortan con resets intermedios. Si el color
 * está desactivado devuelve el texto tal cual.
 */
export function style(text: string, ...styles: Style[]): string {
  if (!enabled || styles.length === 0 || text.length === 0) {
    return text;
  }
  const codes = styles.map((name) => ANSI_CODES[name]).join(";");
  return `${ESC}${codes}m${text}${RESET}`;
}
