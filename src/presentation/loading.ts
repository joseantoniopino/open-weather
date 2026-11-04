import { clearLine, cursorTo } from "node:readline";

import { style } from "../utils/colors.ts";

/** Único punto de la app que dibuja y limpia el estado de carga. */
const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
const FRAME_INTERVAL_MS = 80;
const SHOW_DELAY_MS = 150;
const INDENT = "  ";

function isInteractive(): boolean {
  return (
    process.stdin.isTTY === true &&
    process.stdout.isTTY === true &&
    process.env.TERM !== "dumb"
  );
}

/**
 * Ejecuta `task` mostrando un spinner transitorio en la línea actual.
 *
 * - Solo se dibuja si stdin y stdout son TTY (y TERM no es "dumb").
 * - Como la tarea se resuelve muy rápido (menos de SHOW_DELAY_MS), no se dibuja
 *   nada y no distrae en operaciones instantáneas.
 * - Uso pensado para no anidar: si ya hay un spinner activo, la nueva tarea
 *   se ejecuta sin dibujar uno propio (la concurrente lo cubre).
 * - La línea se limpia en `finally`, con la tarea correcta o fallando; el error
 *   se propaga intacto al llamador.
 */
export async function withLoading<T>(message: string, task: () => Promise<T>): Promise<T> {
  if (!isInteractive() || active > 0) {
    return task();
  }
  return runWithSpinner(message, task);
}

let active = 0;

async function runWithSpinner<T>(message: string, task: () => Promise<T>): Promise<T> {
  active += 1;
  let frame = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let visible = false;

  const clearLoadingLine = (): void => {
    cursorTo(process.stdout, 0);
    clearLine(process.stdout, 0);
  };
  const render = (): void => {
    const symbol = FRAMES[frame % FRAMES.length] ?? "·";
    frame += 1;
    clearLoadingLine();
    process.stdout.write(`${INDENT}${style(symbol, "dim", "cyan")} ${style(message, "dim")}`);
  };

  const delay = setTimeout(() => {
    visible = true;
    render();
    timer = setInterval(render, FRAME_INTERVAL_MS);
  }, SHOW_DELAY_MS);

  try {
    return await task();
  } finally {
    clearTimeout(delay);
    if (timer !== null) clearInterval(timer);
    if (visible) {
      clearLoadingLine();
    }
    active -= 1;
  }
}
