# Espec: pruebas de la capa actions (src/actions)

Feature: Pruebas de las acciones del menú
  Cada acción del usuario se prueba con fetch, prompt y consola simulados
  y con la configuración persistida en el HOME temporal.

  Scenario: helpers compartidos
    Given mensajes de carga y errores
    Then `loadingLabel` singulariza «ciudad» y pluraliza en el resto
    And `describeApiError` usa el mensaje de errores de API conocidos
      y el fallback para el resto
    And `persistConfig` guarda la configuración en disco

  Scenario: clima de la ciudad default
    Given una configuración
    Then sin ciudad default imprime el mensaje de ausencia sin fetch
    And con ciudad default consulta y muestra su temperatura
    And con unidad fahrenheit pide y muestra °F
    Y un fallo de API rechaza la promesa con `ApiError`

  Scenario: clima de todas las ciudades
    Given una configuración
    Then sin ciudades imprime el mensaje de ausencia sin fetch
    And consulta todas las ciudades en paralelo y las muestra en orden
    And si una ciudad falla, se imprime su error y el resto sigue

  Scenario: pronóstico de todas las ciudades
    Given una configuración
    Then sin ciudades imprime el mensaje de ausencia sin fetch
    And consulta todas las ciudades y muestra los 7 días de cada una
    Y si una ciudad falla, el resto continúa

  Scenario: agregar ciudad
    Given respuestas de geocoding y prompts
    Then cancelar el nombre imprime cancelación sin fetch
    And un único resultado se agrega y persiste directamente
    And con varios resultados se numeran y se elige por número
    And vacío cancela, una inválida repregunta
    And duplicados no se vuelven a guardar y no se persiste en disco
    Y sin resultados o nombre vacío rechaza con `CityNotFoundError`

  Scenario: eliminar ciudad
    Given una configuración con ciudades y prompts de confirmación
    Then sin ciudades imprime aviso
    And cancelar la selección o la confirmación deja la configuración sin tocar
    And confirmar hace lo que promete: elimina, guarda y anuncia la nueva default
    And al quedar vacía la lista, la ciudad default se limpia

  Scenario: establecer ciudad default
    Given una configuración con ciudades y prompts
    Then sin ciudades imprime aviso
    And cancelar no guarda nada
    And elegir la default actual avisa sin guardar
    And elegir otra la configura, guarda y anuncia

  Scenario: ajustes
    Given prompts para el submenú de ajustes
    Then «1» alterna la unidad, guarda y vuelve al submenú
    And «2» sale del submenú sin guardar
    And opción inválida avisa y repregunta
    And EOF sale del submenú
