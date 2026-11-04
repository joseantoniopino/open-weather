# Espec: entrypoint del CLI (src/index.ts)

Feature: Entrypoint del Weather CLI
  `main()` es importable y el CLI arranca solo cuando es el módulo principal,
  lo que permite pruebas in-process y un smoke test E2E.

  Scenario: main es importable y el CLI se autoejecuta solo como entrypoint
    Given `src/index.ts`
    Then exporta `main()`
    And al importarse como módulo no ejecuta el CLI
    And al ejecutarse como entrypoint (directo o binario) arranca el bucle de menú

  Scenario: bucle de menú en proceso
    Given el HOME temporal y prompts/fetch/consola simulados
    Then al agotar el prompt (EOF) sale al menú de despedida
    And una opción inválida avisa y vuelve a preguntar
    And la opción 1 sin ciudad default imprime el aviso
    And la opción 2 sin ciudades imprime el aviso de ausencia
    And un error de API conocido se muestra con su mensaje español
    And un error inesperado se muestra con su mensaje genérico
    Y una configuración corrupta imprime el aviso de fichero dañado
      y continúa con la configuración limpia

  Scenario: flujo completo de usuario en proceso
    Given el HOME temporal sin configuración
    When se agrega «Madrid», se cambia a fahrenheit y se consulta clima y pronóstico
    Then la salida muestra alta, temperatura °F y pronóstico de 7 días
    And el `config.json` persiste la ciudad, el default y la unidad elegida
    And el formato de fechas usa español y UTC

  Scenario: smoke test E2E del CLI real
    Given el binario/entrypoint real en un HOME temporal
    When se lanza con entrada `9\n`
    Then imprime el menú y la despedida
    And termina con código de salida 0
