import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { scripts } from "../package.json";

// Spec: specs/testing/build-gate.feature
describe("build condicionado a typecheck y tests", () => {
  let sandbox: string | undefined;
  afterEach(async () => {
    if (sandbox) await rm(sandbox, { recursive: true, force: true });
    sandbox = undefined;
  });

  for (const stage of ["typecheck", "test"] as const) {
    test(`no compila ni sobrescribe el binario si falla ${stage}`, async () => {
      sandbox = await mkdtemp(path.join(tmpdir(), "weather-cli-build-gate-"));
      await mkdir(path.join(sandbox, "src"));
      await Bun.write(path.join(sandbox, "src/index.ts"), 'console.log("fixture");');
      await Bun.write(path.join(sandbox, "weather-cli"), "binario anterior");
      await Bun.write(path.join(sandbox, "package.json"), JSON.stringify({
        scripts: {
          ...scripts,
          typecheck: `bun -e 'console.log("TYPECHECK_EJECUTADO"); process.exit(${stage === "typecheck" ? 1 : 0})'`,
          test: `bun -e 'console.log("TEST_EJECUTADO"); process.exit(1)'`,
        },
      }));
      const child = Bun.spawn([process.execPath, "run", "build"], {
        cwd: sandbox,
        env: { ...process.env, PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}` },
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, , exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      expect(exitCode).not.toBe(0);
      expect(stdout).toContain("TYPECHECK_EJECUTADO");
      if (stage === "typecheck") expect(stdout).not.toContain("TEST_EJECUTADO");
      else expect(stdout).toContain("TEST_EJECUTADO");
      expect(await Bun.file(path.join(sandbox, "weather-cli")).text()).toBe("binario anterior");
    });
  }
});
