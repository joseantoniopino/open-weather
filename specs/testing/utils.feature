# Espec: pruebas de utilidades (src/utils)

Feature: Pruebas de utilidades
  Verifica formateo, colores y descripciones del tiempo sin ANSI ni
  dependencia del terminal real.

  Scenario: formateo de unidades y ciudades
    Given unidades y ciudades con combinaciones de región y país
    Then `unitSymbol` devuelve `°C` para celsius y `°F` para fahrenheit
    And `formatCity` compone "Nombre — Región, País" sin ANSI
    And campos vacíos o nulos se omiten del resultado

  Scenario: formateo de fechas
    Given fechas en formato `YYYY-MM-DD`
    Then `formatForecastDate` las traduce a "día-abreviado número mes-abreviado"
      usando UTC y nunca el locale del sistema
    And formatos no reconocidos se devuelven tal cual

  Scenario: probabilidad de lluvia
    Given valores de lluvia
    Then `formatRain(null)` muestra «Lluvia —»
    And `formatRain(0)` y `formatRain(75)` muestran el porcentaje correcto

  Scenario: estilos de color
    Given `supportsColor` con env y `isTTY` explícitos
    Then `FORCE_COLOR="1"` fuerza color y `"0"`/`"false"` lo apaga
    And `NO_COLOR` no vacío apaga el color, salvo `FORCE_COLOR` definido
    And sin TTY o con `TERM=dumb` no hay color

  Scenario: style y setColorsEnabled
    Given `style` con el color habilitado o deshabilitado
    Then con color devuelve `\x1b[…m texto \x1b[0m` agrupando estilos
    And sin color, sin estilos o con texto vacío devuelve el texto tal cual
    And `setColorsEnabled` devuelve el flags reversible para pruebas

  Scenario: códigos WMO
    Given un código de tiempo
    Then `describeWeatherCode` devuelve la descripción en español
    And códigos no documentados devuelven «Condición desconocida»
