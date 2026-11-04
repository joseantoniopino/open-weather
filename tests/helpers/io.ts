// Spec: specs/testing/infrastructure.feature

/**
 * Utilidades para simular consola, `prompt`, TTY y `stdout` en pruebas de
 * presentación y actions. Todas devuelven mecanismos de restauración y no
 * dependen de getters privados del runtime.
 */

export interface CapturedConsole {
  /** Texto completo impreso por `console.log` (una línea por llamada). */
  readonly log: string;
  /** Texto completo impreso por `console.error` (una línea por llamada). */
  readonly error: string;
  /** `log` y `error` juntos. */
  readonly printed: string;
  /** Número de veces que se llamó a `console.clear`. */
  readonly clears: number;
  /** Restaura los métodos originales. Idempotente. */
  restore(): void;
}

function formatLine(args: ReadonlyArray<unknown>): string {
  return args.map(String).join(" ");
}

/** Silencia y registra la salida de consola (log, error y clear). */
export function captureConsole(): CapturedConsole {
  const originalLog = console.log;
  const originalError = console.error;
  const originalClear = console.clear;
  const logs: Array<string> = [];
  const errors: Array<string> = [];
  let clears = 0;
  console.log = ((...args: Array<unknown>): void => {
    logs.push(formatLine(args));
  }) as typeof console.log;
  console.error = ((...args: Array<unknown>): void => {
    errors.push(formatLine(args));
  }) as typeof console.error;
  console.clear = ((): void => {
    clears += 1;
  }) as typeof console.clear;
  return {
    get log(): string {
      return logs.join("\n");
    },
    get error(): string {
      return errors.join("\n");
    },
    get printed(): string {
      return `${logs.join("\n")}\n${errors.join("\n")}`;
    },
    get clears(): number {
      return clears;
    },
    restore(): void {
      console.log = originalLog;
      console.error = originalError;
      console.clear = originalClear;
    },
  };
}

/** Respuestas de `prompt`: string (respuesta), `null` (EOF/cancel) o `Error` (lanzar). */
export type PromptAnswer = string | null | Error;

export interface PromptQueue {
  /** Número de veces que se llamó a `prompt`. */
  readonly calls: number;
  /** Restaura el `prompt` original. Idempotente. */
  restore(): void;
}

/**
 * Encola respuestas para `globalThis.prompt`. Si se agota la cola devuelve
 * `null` (EOF), como haría la entrada real cerrada; así los bucles siempre
 * terminan aunque el test no proporcione más respuestas.
 */
export function queuePrompts(...answers: Array<PromptAnswer>): PromptQueue {
  const previous = globalThis.prompt;
  let calls = 0;
  let index = 0;
  globalThis.prompt = ((label?: string): string | null => {
    calls += 1;
    const answer = answers[index];
    index += 1;
    if (answer instanceof Error) {
      throw answer;
    }
    return answer ?? null;
  }) as typeof prompt;
  return {
    get calls(): number {
      return calls;
    },
    restore(): void {
      globalThis.prompt = previous;
    },
  };
}

/** Activar TTY: `stdin`/`stdout` expondrán `isTTY = true` hasta restaurar. */
export function setTty(value: boolean): () => void {
  const streams = [process.stdin, process.stdout] as const;
  const descriptors = streams.map((stream) => Object.getOwnPropertyDescriptor(stream, "isTTY"));
  for (const stream of streams) {
    Object.defineProperty(stream, "isTTY", { value, configurable: true });
  }
  return () => {
    for (const [index, stream] of streams.entries()) {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(stream, "isTTY", descriptor);
      else delete (stream as unknown as { isTTY?: boolean }).isTTY;
    }
  };
}

export interface StdoutRecorder {
  /** Fragmentos escritos en `stdout`, en orden. */
  readonly writes: ReadonlyArray<string>;
  /** Todos los fragmentos concatenados. */
  readonly text: string;
  /** Restaura `stdout.write`. Idempotente. */
  restore(): void;
}

/** Registro de escrituras en `stdout` (para probar el spinner). */
export function recordStdout(): StdoutRecorder {
  const originalWrite = process.stdout.write;
  const writes: Array<string> = [];
  process.stdout.write = ((chunk: Uint8Array | string): boolean => {
    writes.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  return {
    get writes(): ReadonlyArray<string> {
      return writes;
    },
    get text(): string {
      return writes.join("");
    },
    restore(): void {
      process.stdout.write = originalWrite;
    },
  };
}
