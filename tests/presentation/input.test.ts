import { afterEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/presentation.feature
import { setTty, captureConsole, queuePrompts } from "../helpers/io.ts";
import {
  ask,
  askNumberChoice,
  askText,
  askYesNo,
} from "../../src/presentation/input.ts";

describe("ask", () => {
  let ttyRestore: (() => void) | null = null;
  let prompts: ReturnType<typeof queuePrompts> | null = null;
  let output: ReturnType<typeof captureConsole> | null = null;
  afterEach(() => {
    ttyRestore?.();
    ttyRestore = null;
    prompts?.restore();
    prompts = null;
    output?.restore();
    output = null;
  });

  test("devuelve la respuesta cruda", () => {
    prompts = queuePrompts("  una respuesta  ");
    expect(ask("Etiqueta: ")).toBe("  una respuesta  ");
    expect(prompts.calls).toBe(1);
  });

  test("devuelve null cuando la entrada termina (EOF)", () => {
    prompts = queuePrompts();
    expect(ask("Etiqueta: ")).toBeNull();
  });

  test("limpia la pantalla sólo si stdin y stdout son TTY", () => {
    prompts = queuePrompts("algo", "otra respuesta");
    output = captureConsole();

    ttyRestore = setTty(false);
    ask("Sin TTY: ");
    expect(output.clears).toBe(0);

    ttyRestore?.();
    ttyRestore = setTty(true);
    ask("Con TTY: ");
    expect(output.clears).toBe(1);
  });

  test("con EOF y TTY no limpia la pantalla", () => {
    prompts = queuePrompts();
    output = captureConsole();
    ttyRestore = setTty(true);
    ask("Etiqueta: ");
    expect(output.clears).toBe(0);
  });
});

describe("askText", () => {
  test("recorta los espacios de la respuesta", () => {
    const prompts = queuePrompts("   respuesta   ");
    expect(askText("Nombre: ")).toBe("respuesta");
    prompts.restore();
  });

  test("devuelve null en EOF", () => {
    const prompts = queuePrompts();
    expect(askText("Nombre: ")).toBeNull();
    prompts.restore();
  });
});

describe("askNumberChoice", () => {
  describe("respuestas válidas e inválidas", () => {
    test("rechaza no numéricos, cero y fuera de rango, preguntando hasta un valor válido", () => {
      const prompts = queuePrompts("abc", "-3", "0", "4", "3");
      const output = captureConsole();
      const chosen = askNumberChoice("Elección: ", 3);
      expect(chosen).toBe(3);
      expect(prompts.calls).toBe(5);
      expect(output.error).toContain("Debes introducir un número.");
      expect(output.error).toContain("Debes elegir un número entre 1 y 3.");
      output.restore();
      prompts.restore();
    });

    test("acepta máximos como «1» cuando max es 1", () => {
      const prompts = queuePrompts("1");
      expect(askNumberChoice("Elección: ", 1)).toBe(1);
      prompts.restore();
    });

    test("ignora espacios y recorta", () => {
      const prompts = queuePrompts("  2  ");
      expect(askNumberChoice("Elección: ", 2)).toBe(2);
      prompts.restore();
    });

    test("acepta el máximo", () => {
      const prompts = queuePrompts("7");
      expect(askNumberChoice("Elección: ", 7)).toBe(7);
      prompts.restore();
    });
  });

  describe("cancelaciones", () => {
    test("vacío devuelve null (aunque parezca respondido)", () => {
      const prompts = queuePrompts("");
      expect(askNumberChoice("Elección: ", 3)).toBeNull();
      prompts.restore();
    });

    test("devuelve null en EOF y no imprime errores", () => {
      const prompts = queuePrompts();
      const output = captureConsole();
      expect(askNumberChoice("Elección: ", 3)).toBeNull();
      expect(output.error).toBe("");
      output.restore();
      prompts.restore();
    });

    test("tras valores inválidos, vacío devuelve null", () => {
      const prompts = queuePrompts("abc", "");
      const output = captureConsole();
      expect(askNumberChoice("Elección: ", 3)).toBeNull();
      expect(prompts.calls).toBe(2);
      output.restore();
      prompts.restore();
    });
  });

  describe("con validación numérica estricta", () => {
    test("rechaza decimales y signos", () => {
      const prompts = queuePrompts("2.5", "+2", "2");
      const output = captureConsole();
      expect(askNumberChoice("Elección: ", 3)).toBe(2);
      expect(prompts.calls).toBe(3);
      output.restore();
      prompts.restore();
    });
  });
});

describe("askYesNo", () => {
  describe("respuestas afirmativas", () => {
    for (const answer of ["s", "S", "si", "SI", "sí", "SÍ", "y", "YES", " sí "]) {
      test(`«${answer}» devuelve true`, () => {
        const prompts = queuePrompts(answer);
        expect(askYesNo("¿Seguro? ")).toBe(true);
        prompts.restore();
      });
    }
  });

  describe("respuestas negativas y vacías", () => {
    for (const answer of ["", "n", "N", "no", "NO"]) {
      test(`«${answer}» devuelve false`, () => {
        const prompts = queuePrompts(answer);
        expect(askYesNo("¿Seguro? ")).toBe(false);
        prompts.restore();
      });
    }

    test("EOF devuelve false", () => {
      const prompts = queuePrompts();
      expect(askYesNo("¿Seguro? ")).toBe(false);
      prompts.restore();
    });
  });

  describe("respuestas inválidas", () => {
    test("imprime ayuda y vuelve a preguntar hasta que se responde", () => {
      const prompts = queuePrompts("quizá", "n");
      const output = captureConsole();
      expect(askYesNo("¿Seguro? ")).toBe(false);
      expect(prompts.calls).toBe(2);
      expect(output.error).toContain("Responde con «s» para sí o «n» para no.");
      output.restore();
      prompts.restore();
    });
  });
});
