import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

// Spec: specs/testing/entrypoint.feature

/**
 * Smoke test del CLI real (`bun src/index.ts`): comprueba que el entrypoint
 * arranca, imprime el menú y sale con código 0 cuando se lee EOF/«9».
 */
const ENTRYPOINT = path.resolve(import.meta.dir, "../../src/index.ts");

interface CliRun {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

describe("smoke E2E del CLI real", () => {
  let sandbox: string | null = null;

  beforeAll(async () => {
    sandbox = await mkdtemp(path.join(tmpdir(), "weather-cli-e2e-"));
  });

  afterAll(async () => {
    if (sandbox) {
      await rm(sandbox, { recursive: true, force: true });
    }
  });

  async function runCli(input: string): Promise<CliRun> {
    if (!sandbox) {
      throw new Error("El sandbox E2E no está inicializado.");
    }
    const proc = Bun.spawn([process.execPath, ENTRYPOINT], {
      cwd: path.dirname(ENTRYPOINT),
      env: {
        ...process.env,
        HOME: sandbox,
        USERPROFILE: sandbox,
        NO_COLOR: "1",
        TERM: "dumb",
      },
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    });
    proc.stdin.write(input);
    proc.stdin.end();
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    return { stdout, stderr, exitCode };
  }

  test("arranca, alcanza la despedida y devuelve un código exitoso", async () => {
    const run = await runCli("9\n");
    expect(run.exitCode).toBe(0);
    expect(run.stderr).toBe("");
    expect(run.stdout).toContain("WEATHER CLI");
    expect(run.stdout).toContain("Selecciona una opción");
    expect(run.stdout).toContain("¡Hasta pronto!");
  });

  test("sin configuración el menú arranca con 0 ciudades y sale limpio", async () => {
    const run = await runCli("\n9\n");
    expect(run.exitCode).toBe(0);
    expect(run.stdout).toContain("Clima de todas las ciudades (0)");
    expect(run.stdout).toContain("Ajustes (°C)");
  });
});
