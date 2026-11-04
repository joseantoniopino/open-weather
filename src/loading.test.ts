import { describe, expect, test } from "bun:test";

import { withLoading } from "./loading.ts";

describe("withLoading", () => {
  test("devuelve el resultado de la tarea", async () => {
    const result = await withLoading("Prueba…", async () => 42);
    expect(result).toBe(42);
  });

  test("propaga el error de la tarea", async () => {
    const error = new Error("fallo de prueba");
    await expect(withLoading("Prueba…", () => Promise.reject(error))).rejects.toBe(error);
  });
});
