// Spec: specs/testing/infrastructure.feature
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Entorno de pruebas global (se ejecuta antes de que ningún test
 * importe los módulos de `src/`):
 *
 * - `HOME`/`USERPROFILE` apuntan a un directorio temporal único, de forma que
 *   `~/.weather-cli/config.json` nunca es el archivo del usuario real.
 * - Se desactivan el color y el TTY para que los mensajes sean deterministas;
 *   los tests que necesitan TTY lo activan y desactivan de forma explícita.
 */
const SANDBOX = mkdtempSync(path.join(tmpdir(), "weather-cli-tests-"));
delete process.env.FORCE_COLOR;
process.env.NO_COLOR = "1";
process.env.TERM = "dumb";
process.env.HOME = SANDBOX;
process.env.USERPROFILE = SANDBOX;

process.on("exit", () => {
  try {
    rmSync(SANDBOX, { recursive: true, force: true });
  } catch {
    // El borrado es «best effort»: no debe impedir la salida del proceso.
  }
});
