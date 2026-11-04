# Espec: infraestructura de testing (Bun)

Feature: Infraestructura de tests del Weather CLI
  El proyecto ejecuta su suite automática con Bun, aislada de la red,
  del terminal real y del `~/.weather-cli` del usuario.

  Context (configuración)
    Given `bunfig.toml` con `[test] root = "tests"` y preload `./tests/setup.ts`
    And `tests/setup.ts` crea un `HOME` temporal único
    And el setup define `NO_COLOR=1` y `TERM=dumb` para salidas deterministas
    And el setup desactiva `FORCE_COLOR` heredado del entorno

  Scenario: El descubre solo pruebas dentro de tests
    When se ejecuta `bun test`
    Then se ejecutan únicamente los `*.test.ts` de `tests/`
    And nunca se ejecutan archivos colgados de `src/`

  Scenario: El entorno de pruebas no toca el usuario real
    Given el setup definió un `HOME` temporal
    When cualquier test guarda o carga configuración
    Then se leen y escriben `~/.weather-cli/config.json` dentro del HOME temporal
    And el `~/.weather-cli` real del usuario no sufre cambios
    And el directorio temporal se elimina al terminar el proceso

  Scenario: Helpers compartidos para pruebas
    Given `tests/helpers/` expone utilidades reutilizables
    Then los tests pueden instalar un `fetch` falso encolado por llamada
    And los tests pueden capturar la salida de `console.log`, `console.error` y `console.clear`
    And los tests pueden encolar respuestas para `globalThis.prompt`
    And los tests pueden activar o desactivar TTY simulado para `stdin` y `stdout`
    And todos los helpers restauran el estado original al restaurarlos

  Scenario: Sin red real ni dependencias nuevas
    Given la suite usa solo `bun:test` y módulos internos
    Then no se añaden dependencias a `package.json` para probar
    And los tests no realizan peticiones HTTP reales
