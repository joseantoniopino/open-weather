// Spec: specs/testing/infrastructure.feature
import { mkdir, rm } from "node:fs/promises";
import type { AppConfig } from "../../src/types/Config.ts";
import { CONFIG_DIR, CONFIG_FILE } from "../../src/utils/constants.ts";

/**
 * Aislamiento del archivo `~/.weather-cli/config.json`: gracias al `HOME`
 * temporal del preload (`tests/setup.ts`), aquí solo se toca el sandbox.
 */

/** Elimina el directorio de configuración sandbox (idempotente). */
export async function resetConfigStorage(): Promise<void> {
  await rm(CONFIG_DIR, { recursive: true, force: true });
}

/** `true` si existe el `config.json` sandbox. */
export async function configExists(): Promise<boolean> {
  return Bun.file(CONFIG_FILE).exists();
}

/** Contenido crudo del `config.json` sandbox o `null` si no existe. */
export async function readRawConfig(): Promise<string | null> {
  if (!(await Bun.file(CONFIG_FILE).exists())) return null;
  return Bun.file(CONFIG_FILE).text();
}

/** Configuración persistida (parseada) o `null` si no existe el archivo. */
export async function readConfig(): Promise<AppConfig | null> {
  const raw = await readRawConfig();
  return raw === null ? null : (JSON.parse(raw) as AppConfig);
}

/** Escribe contenido crudo en `config.json` (crea el directorio si falta). */
export async function writeRawConfig(raw: string): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_FILE, raw);
}

/** Ruta del archivo backup que crea `loadConfig` ante un fichero dañado. */
export function backupFile(): string {
  return `${CONFIG_FILE}.bak`;
}
