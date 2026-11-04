## Weather CLI APP

El objetivo de esta aplicación es que creemos una aplicación de consola que pida que ingresemos la ciudad, Al final, generaremos un binario ejecutable.

### Opciones:

- Ingresar el nombre de una ciudad.
- Guardar la ciudad por defecto.
- Registrar varias otras ciudades para buscar el clima en esas otras ciudades.
- Mostrar el pronóstico de los próximos 7 días para todas las ciudades guardadas.

## Stack

- Bun.js
- OpenMeteo

## Ejemplo de petición http:

1. Paso 1: Geocoding API.
2. Paso 2: OpenMeteo API.

```
https://geocoding-api.open-meteo.com/v1/search?name=Ottawa&count=1&language=es&format=json
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&current=temperature_2m
https://api.open-meteo.com/v1/forecast?latitude=45.41117&longitude=-75.69812&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&forecast_days=7&timezone=auto
```

## Inicializar proyecto

```bash
bun init
```

### Ejemplo del menú
Esta es la apariencia que deseamos crear

```text
════════════════════════════════════════
              WEATHER CLI
════════════════════════════════════════
  1. Clima de ciudad default
  2. Clima de todas las ciudades (1)
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  6. Pronóstico de 7 días (todas)
  8. Ajustes (°C)
  9. Salir
════════════════════════════════════════
  Selecciona una opción: 5
```

### Indicador de carga

Las operaciones asíncronas (búsqueda, clima, pronóstico y guardado de configuración) muestran un spinner transitorio cuando la consola es interactiva. Si la operación termina en menos de ~150 ms no aparece nada, y la línea siempre se limpia al terminar, con éxito o con error.

### Tolerancia a fallos

Las peticiones a Open-Meteo reintentan automáticamente una vez (500 ms después) cuando fallan por un motivo transitorio: sin conexión, timeout o error 5xx/429 del servidor. Así, un microcorte de red o de DNS pasa desapercibido. Los errores 4xx no se reintentan porque darían el mismo resultado.