# Espec: puerta de build por typecheck y tests

Feature: Compilación condicionada a la suite de pruebas
  El binario `weather-cli` solo se compila si el typecheck y los tests pasan.

  Scenario: build feliz
    Given el proyecto pasa el typecheck
    And todos los tests pasan
    When se ejecuta `bun run build`
    Then primero se ejecuta typecheck y después los tests
    And el binario `weather-cli` se compila a partir de `src/index.ts`

  Scenario: build bloqueado si falla un test
    Given algún test falla
    When se ejecuta `bun run build`
    Then no se compila el binario y `bun build` nunca se ejecuta
    And el binario `weather-cli` existente no se sobrescribe

  Scenario: build bloqueado si falla el typecheck
    Given el typecheck falla
    When se ejecuta `bun run build`
    Then no se compila el binario
    And los tests no llegan a ejecutarse

  Scenario: especificar los scripts disponibles
    Given `package.json` define scripts
    Then `bun run test` ejecuta solo la suite con Bun
    And `bun run test:coverage` ejecuta la suite con informe de cobertura
    And `bun run test:coverage` no exige un umbral: solo reporta
