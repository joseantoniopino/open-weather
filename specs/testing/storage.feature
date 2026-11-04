# Espec: pruebas de la capa storage (src/storage)

Feature: Pruebas de la capa storage
  Verifica parseo de configuración y persistencia en disco usando el
  `HOME` temporal del entorno de pruebas.

  Scenario: parseo de configuración válida
    Given un objeto de configuración representable en JSON
    When se llama a `parseAppConfig`
    Then devuelve la configuración equivalente con `version: 1`
    And respeta la unidad y el `defaultCityId` existente en las ciudades

  Scenario: parseo de configuración inválida
    Given configuraciones con versión distinta de 1, unidad no válida,
      ciudades no array, o ciudades con campos inválidos
    When se llama a `parseAppConfig`
    Then lanza un error descriptivo en español
    And `defaultCityId` no válido o ausente se normaliza a `null` cuando procede
    And un `defaultCityId` apuntando a una ciudad inexistente pasa a `null`

  Scenario: configuración por defecto
    When se llama a `createDefaultConfig`
    Then devuelve la configuración vacía probable con unit celsius
    And cada llamada devuelve un objeto nuevo independiente

  Scenario: carga desde disco
    Given el archivo de configuración no existe
    When se llama a `loadConfig`
    Then devuelve la configuración por defecto sin aviso
    And no crea el archivo

  Scenario: guardado y recarga
    Given una configuración con ciudades y unidad definidas
    When se guarda con `saveConfig` y se vuelve a cargar
    Then el archivo contenido es JSON bonito con newline final
    And `loadConfig` devuelve la misma configuración
    And no queda ningún `.tmp` residual

  Scenario: archivo corrupto
    Given un `config.json` con JSON roto o JSON válido semánticamente inválido
    When se llama a `loadConfig`
    Then devuelve la configuración por defecto con un aviso
    And copia el original a `config.json.bak` antes de continuar

  Scenario: operaciones sobre ciudades
    Given una configuración en memoria
    Then `addCityToConfig` agrega ciudades, promociona la primera como default,
      y rechaza duplicados por id o por coordenadas
    And `removeCityFromConfig` elimina y promociona la siguiente default,
      mantiene la default al quitar otra, o limpia la default al vaciar
    And `findCityById` y `setDefaultCityById` responden según la ciudad guardada

  Scenario: ajustes de unidad
    Given una configuración
    Then `setUnit` cambia la unidad
    And `toggleUnit` alterna entre celsius y fahrenheit guardando el nuevo valor
