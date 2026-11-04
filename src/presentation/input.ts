import { printError } from "./output.ts";

/** Captura y validación de entradas del usuario. */

export function ask(label: string): string | null {
  const raw = prompt(label);
  if (raw !== null) {
    clearScreen();
  }
  return raw;
}

/** Limpia la consola tras cada respuesta, solo en sesión interactiva. */
function clearScreen(): void {
  if (process.stdin.isTTY === true && process.stdout.isTTY === true) {
    console.clear();
  }
}

export function askText(label: string): string | null {
  const raw = ask(label);
  return raw === null ? null : raw.trim();
}

export function askNumberChoice(label: string, max: number): number | null {
  for (;;) {
    const raw = ask(label);
    if (raw === null) {
      return null;
    }
    const text = raw.trim();
    if (text.length === 0) {
      return null;
    }
    if (!/^\d+$/.test(text)) {
      printError("Debes introducir un número.");
      continue;
    }
    const parsed = Number(text);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
      printError(`Debes elegir un número entre 1 y ${max}.`);
      continue;
    }
    return parsed;
  }
}

export function askYesNo(question: string): boolean {
  for (;;) {
    const raw = ask(question);
    if (raw === null) {
      return false;
    }
    const text = raw.trim().toLowerCase();
    if (text === "s" || text === "si" || text === "sí" || text === "y" || text === "yes") {
      return true;
    }
    if (text === "" || text === "n" || text === "no") {
      return false;
    }
    printError("Responde con «s» para sí o «n» para no.");
  }
}
