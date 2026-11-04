import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/presentation.feature
import { recordStdout, setTty } from "../helpers/io.ts";
import { withLoading } from "../../src/presentation/loading.ts";

describe("withLoading en sesión no interactiva", () => {
  test("devuelve el resultado de la tarea", async () => {
    const result = await withLoading("Prueba…", async () => 42);
    expect(result).toBe(42);
  });

  test("propaga el error de la tarea", async () => {
    const error = new Error("fallo de prueba");
    await expect(withLoading("Prueba…", () => Promise.reject(error))).rejects.toBe(error);
  });

  test("no escribe nada en stdout", async () => {
    const recorder = recordStdout();
    await withLoading("Prueba…", async () => "hecho");
    expect(recorder.writes.some((fragment) => fragment.includes("Prueba…"))).toBe(false);
    recorder.restore();
  });
});

describe("withLoading en sesión interactiva (TTY simulado)", () => {
  let restoreTty: (() => void) | null = null;
  let previousTerm: string | undefined;
  let recorder: ReturnType<typeof recordStdout>;
  beforeEach(() => {
    previousTerm = process.env.TERM;
    process.env.TERM = "xterm";
    recorder = recordStdout();
  });
  afterEach(() => {
    recorder.restore();
    restoreTty?.();
    restoreTty = null;
    if (previousTerm === undefined) delete process.env.TERM;
    else process.env.TERM = previousTerm;
  });

  test("una tarea rápida no dibuja spinner ni mensaje", async () => {
    restoreTty = setTty(true);
    const result = await withLoading("Prueba…", async () => {
      await Bun.sleep(10);
      return "hecho";
    });
    expect(result).toBe("hecho");
    expect(recorder.writes.some((fragment) => fragment.includes("Prueba…"))).toBe(false);
    recorder.restore();
  });

  test("una tarea lenta dibuja el spinner y limpia la línea al terminar", async () => {
    restoreTty = setTty(true);
    const result = await withLoading("Prueba…", () => Bun.sleep(200).then(() => "hecho"));
    expect(result).toBe("hecho");
    expect(recorder.writes.some((fragment) => fragment.includes("Prueba…"))).toBe(true);
    // Tras la limpieza final, el último fragmento no contiene el mensaje.
    expect(recorder.writes.at(-1)?.includes("Prueba…")).toBe(false);
    recorder.restore();
  });

  test("propaga el error, limpia la línea y reactiva el spinner después", async () => {
    restoreTty = setTty(true);
    const failure = new Error("tarea fallada");
    await expect(
      withLoading("Prueba fallida…", () => Bun.sleep(200).then(() => Promise.reject(failure))),
    ).rejects.toBe(failure);
    expect(recorder.writes.some((fragment) => fragment.includes("Prueba fallida…"))).toBe(true);
    expect(recorder.writes.at(-1)?.includes("Prueba fallida…")).toBe(false);

    const result = await withLoading("Otra vez…", () => Bun.sleep(200).then(() => 7));
    expect(result).toBe(7);
    expect(recorder.writes.some((fragment) => fragment.includes("Otra vez…"))).toBe(true);
    recorder.restore();
  });

  test("con TERM=dumb no dibuja nada aunque la consola sea TTY", async () => {
    const previousTerm = process.env.TERM;
    process.env.TERM = "dumb";
    restoreTty = setTty(true);
    try {
      await withLoading("Prueba…", () => Bun.sleep(200).then(() => "hecho"));
    } finally {
      if (previousTerm === undefined) delete process.env.TERM;
      else process.env.TERM = previousTerm;
    }
    expect(recorder.writes.some((fragment) => fragment.includes("Prueba…"))).toBe(false);
    recorder.restore();
  });

  test("la tarea anidada no dibuja su propio spinner", async () => {
    restoreTty = setTty(true);
    let releaseOuter: (value: string) => void = () => {};
    const outerTask = new Promise<string>((resolve) => {
      releaseOuter = resolve;
    });
    setTimeout(() => releaseOuter("fuera"), 250);
    const result = await withLoading("Fuera…", () => {
      return withLoading("Dentro…", async () => "dentro").then(async (inner) => {
        expect(inner).toBe("dentro");
        return outerTask;
      });
    });
    expect(result).toBe("fuera");
    expect(recorder.writes.some((fragment) => fragment.includes("Dentro…"))).toBe(false);
    expect(recorder.writes.some((fragment) => fragment.includes("Fuera…"))).toBe(true);
    recorder.restore();
  });
});
