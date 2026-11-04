# Espec: pruebas de la capa presentation (src/presentation, salvo spinner ya cubierto)

Feature: Pruebas de la capa presentación
  Verifica entrada de usuario, menús y salidas con consola y `prompt`
  simulados; nunca dependen de un terminal real.

  Scenario: lectura de texto
    Given respuestas encoladas de `prompt`
    Then `ask` devuelve la respuesta cruda y limpia pantalla solo con TTY
    And `askText` devuelve `null` en EOF y recorta espacios
    Y al cancelar (`null`) no se limpia la pantalla

  Scenario: elección numérica con reintentos
    Given respuestas válidas e inválidas encoladas
    Then `askNumberChoice` acepta el primer número dentro de `[1, max]`
    And rechaza no numéricos, ceros, negativos y fuera de rango con error
    And vacío o EOF devuelven `null`

  Scenario: respuesta sí/no
    Given respuestas en varios formatos
    Then `askYesNo` acepta «s»/«si»/«sí»/«y»/«yes» sin cambiar mayúsculas ni espacios
    And vacío, «n», «no» y EOF devuelven `false`
    And respuestas inválidas imprimen ayuda y vuelven a preguntar

  Scenario: menú principal
    Given número de ciudades y unidad de temperatura
    Then `mainMenuOptions` expone las claves 1..6, 8 y 9 con sus etiquetas
    And la etiqueta del clima total incluye el contador de ciudades
    And ajustes muestra el símbolo actual
    And `displayMainMenu` imprime separadores, título centrado y opciones

  Scenario: menú de ajustes
    Given una unidad actual
    Then `displaySettingsMenu` muestra la unidad actual y la alternativa

  Scenario: lectura de opción de menú
    Given respuestas de `prompt`
    Then `askMenuChoice` devuelve el valor recortado o `null` en EOF

  Scenario: salida al usuario
    Given ciudades, clima o pronósticos
    Then `displayCityList` numera y marca « (default)» la ciudad por defecto
    And `displaySearchResults` muestra la consulta con «» y el listado
    And `displayCityWeather` imprime ciudad y temperatura con símbolo
    And `displayCityForecast` imprime cada día con descripción y lluvia
    And `printError` va por `console.error` con «✖», `printInfo` con «ℹ»,
      `printSuccess` con «✔», y sin ANSI si el color está apagado

  Scenario: spinner withLoading
    Given tarea y consola no interactiva
    Then `withLoading` devuelve el resultado o propaga el error sin dibujar nada

  Scenario: spinner en sesión interactiva
    Given stdout y stdin teletipo y TERM distinto de `dumb`
    Then una tarea que tarda más de 150 ms dibuja el spinner con su mensaje
    And una tarea rápida no dibuja nada
    And una tarea anidada no dibuja su propio spinner
    Y al terminar o fallar la tarea la línea se limpia en el `finally`
    Y TERM=dumb desactiva el dibujo y el estado se resetea tras el error
