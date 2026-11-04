# Espec: pruebas de la capa API (src/api)

Feature: Pruebas de la capa API
  Verifica el cliente HTTP, validadores, geocoding, clima y errores con
  `fetch` simulado; nunca se toca Open-Meteo real.

  Scenario: requestJson con respuesta válida
    Given el fetch devuelve JSON válido
    When se llama a `requestJson` con una URL
    Then devuelve el objeto parseado
    And hace una sola llamada con la URL pedida y un `AbortSignal`

  Scenario: requestJson reintenta ante fallo transitorio
    Given el primer intento falla por red o HTTP 5xx/429
    And el segundo intento devuelve JSON válido
    When se llama a `requestJson`
    Then devuelve el resultado del segundo intento
    And el fetch se llamó exactamente dos veces

  Scenario: requestJson no reintenta errores de cliente o JSON inválido
    Given el primer intento devuelve HTTP 4xx o JSON no válido
    When se llama a `requestJson`
    Then lanza `ApiError` con su mensaje en español
    And el fetch se llamó exactamente una vez

  Scenario: requestJson se rinde tras agotar reintentos
    Given los dos intentos fallan de forma transitoria
    When se llama a `requestJson`
    Then lanza `ApiError` con el mensaje del fallo original
    And el fetch se llamó exactamente dos veces

  Scenario: validadores de JSON
    Given los utilitarios de `src/api/validation.ts`
    Then `assertRecord`, `assertNumber` y `assertString` aceptan valores correctos
    And rechazan nulos, arrays, no numéricos y texto vacío con `ApiError` en español
    And `asOptionalString` y `asOptionalRecord` devuelven `null` en lo no válido

  Scenario: geocoding searchCities
    Given respuestas de geocoding simuladas
    When se busca una ciudad
    Then la petición usa `name`, `count=10`, `language=es` y `format=json`
    And devuelve las ciudades con `admin1`/`country` nulos si faltan
    And un nombre vacío lanza `CityNotFoundError` sin llamar al fetch

  Scenario: geocoding sin resultados o malformado
    Given la API devuelve sin `results`, vacía o con registros inválidos
    Then lanza `CityNotFoundError` o `ApiError` según corresponda

  Scenario: clima actual
    Given respuestas del endpoint forecast simuladas
    When se consulta `getWeather`
    Then la URL incluye latitud, longitud y `current=temperature_2m`
    And añade `temperature_unit=fahrenheit` solo para esa unidad
    And usa el símbolo de `current_units` o el fallback de la unidad configurada
    And respuestas sin bloque `current` o con temperatura inválida lanzan `ApiError`

  Scenario: pronóstico de 7 días
    Given respuestas diarias simuladas
    When se consulta `getForecast` o `parseDailyForecast`
    Then la URL pide los campos diarios, `forecast_days=7` y `timezone=auto`
    And mapea cada día a fecha, código, máximas, mínimas y lluvia
    And la lluvia ausente se guarda como `null`
    And arrays de distinta longitud o valores inválidos lanzan `ApiError`

  Scenario: tipos de error
    Given instancias de `ApiError` y `CityNotFoundError`
    Then `isKnownApiError` las reconoce como errores conocidos
    And rechaza errores genéricos, strings y `null`
