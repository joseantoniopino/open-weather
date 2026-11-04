import { afterEach, beforeEach, describe, expect, test } from "bun:test";

// Spec: specs/testing/entrypoint.feature
import {
  MADRID,
  geocodingBody,
  weatherBody,
  forecastBody,
} from "./helpers/fixtures.ts";
import { installFetch, jsonResponse, type FetchMock } from "./helpers/fetch.ts";
import { backupFile, readRawConfig, resetConfigStorage, writeRawConfig, configExists } from "./helpers/config.ts";
import { captureConsole, queuePrompts, type PromptAnswer } from "./helpers/io.ts";
import { main } from "../src/index.ts";

/**
 * Pruebas del bucle principal (`main`) en proceso: el prompt, el fetch y la
 * consola se simulan; el disco usa el HOME temporal del preload.
 */
describe("main (bucle de menú en proceso)", () => {
  let fetchMock: FetchMock;
  let prompts: ReturnType<typeof queuePrompts>;
  let output: ReturnType<typeof captureConsole>;
  let answers: Array<PromptAnswer>;

  beforeEach(async () => {
    answers = [];
    await resetConfigStorage();
  });

  afterEach(() => {
    fetchMock.restore();
    prompts.restore();
    output.restore();
  });

  function start(nextAnswers: Array<PromptAnswer>): void {
    answers = nextAnswers;
    prompts = queuePrompts(...answers);
    output = captureConsole();
  }

  /** Sin encolar respuestas el prompt devuelve EOF y el CLI se despide. */
  test("salida inmediata por EOF imprime la despedida", async () => {
    fetchMock = installFetch();
    start([]);
    await main();
    expect(output.log).toContain("WEATHER CLI");
    expect(output.log).toContain("¡Hasta pronto!");
    expect(await configExists()).toBe(false);
  });

  test("una opción inválida avisa y vuelve al menú", async () => {
    fetchMock = installFetch();
    start(["7", "9"]);
    await main();
    expect(output.error).toContain("Opción no válida. Elige un número del menú.");
    expect(prompts.calls).toBe(2);
  });

  test("la opción 1 sin ciudad default imprime el aviso y sigue en el menú", async () => {
    fetchMock = installFetch();
    start(["1", "9"]);
    await main();
    expect(output.error).toContain("Aún no hay ciudad default. Usa la opción 3 para agregar una ciudad.");
    expect(fetchMock.calls).toHaveLength(0);
  });

  test("la opción 2 sin ciudades imprime el aviso de ausencia", async () => {
    fetchMock = installFetch();
    start(["2", "9"]);
    await main();
    expect(output.error).toContain("No hay ciudades guardadas. Usa la opción 3 para agregar una ciudad.");
  });

  test("un error de API conocido muestra su mensaje y el CLI continúa", async () => {
    await writeRawConfig(JSON.stringify({
      version: 1,
      unit: "celsius",
      defaultCityId: MADRID.id,
      cities: [MADRID],
    }));
    fetchMock = installFetch(() => jsonResponse({}, 404));
    start(["1", "9"]);
    await main();
    expect(output.error).toContain("Open-Meteo respondió con el estado HTTP 404.");
    expect(await configExists()).toBe(true);
  });

  test("un error inesperado muestra el mensaje genérico y continúa", async () => {
    const failure = new Error("fallo inesperado de prueba");
    fetchMock = installFetch();
    start(["3", failure, "9"]);
    await main();
    expect(output.error).toContain("Ocurrió un error inesperado: fallo inesperado de prueba");
  });

  test("con configuración corrupta avisa, crea el backup y sigue con una limpia", async () => {
    await writeRawConfig("{ json roto");
    fetchMock = installFetch();
    start(["9"]);
    await main();
    expect(output.error).toContain("El archivo de configuración está dañado");
    expect(await Bun.file(backupFile()).text()).toBe("{ json roto");
  });

  test("flujo completo: agregar Madrid, pasar a °F y consultar clima y pronóstico", async () => {
    fetchMock = installFetch(
      () => jsonResponse(geocodingBody([MADRID])),
      (url) => {
        expect(url.searchParams.get("temperature_unit")).toBe("fahrenheit");
        return jsonResponse(weatherBody(70.7, "°F"));
      },
      () => jsonResponse(forecastBody()),
    );
    start(["3", "Madrid", "8", "1", "2", "1", "6", "9"]);
    await main();

    const printed = output.printed;
    expect(printed).toContain("✔ Ciudad agregada: Madrid — Madrid, España");
    expect(printed).toContain("Se estableció como ciudad default: Madrid — Madrid, España");
    expect(printed).toContain("Temperatura actual: 70.7 °F");
    expect(printed).toContain("Pronóstico de 7 días:");
    expect(printed).toContain("mié 4 nov");
    expect(printed).toContain("Máx 12 °F");
    expect(printed).toContain("Lluvia —");
    expect(prompts.calls).toBe(8);
  });

  test("el flujo completo persiste la ciudad, la default y la unidad", async () => {
    fetchMock = installFetch((url) => {
      if (url.hostname.includes("geocoding")) {
        return jsonResponse(geocodingBody([MADRID]));
      }
      return jsonResponse(forecastBody());
    });
    start(["3", "Madrid", "8", "1", "2", "9"]);
    await main();
    const raw = await readRawConfig();
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw ?? "{}") as { unit?: string; defaultCityId?: number; cities?: Array<unknown> };
    expect(saved.unit).toBe("fahrenheit");
    expect(saved.defaultCityId).toBe(MADRID.id);
    expect(saved.cities).toHaveLength(1);
  });

  test("con una ciudad ya cargada se consulta clima y pronóstico sin geocoding", async () => {
    await writeRawConfig(
      JSON.stringify({
        version: 1,
        unit: "celsius",
        defaultCityId: MADRID.id,
        cities: [MADRID],
      }),
    );
    fetchMock = installFetch(
      () => jsonResponse(weatherBody(21.5)),
      () => jsonResponse(forecastBody()),
    );
    start(["1", "6", "9"]);
    await main();
    const url = fetchMock.calls[0]?.url;
    expect(url?.searchParams.get("latitude")).toBe(String(MADRID.latitude));
    expect(fetchMock.calls[1]?.url.searchParams.get("forecast_days")).toBe("7");
    expect(fetchMock.calls).toHaveLength(2);
    expect(output.error).toBe("");
    expect(fetchMock.calls.some((codified) => codified.url.hostname.includes("geocoding"))).toBe(false);
  });
});
