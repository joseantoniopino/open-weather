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

## Ejecutar, probar y compilar

```bash
bun install
bun start
bun test                 # Suite completa
bun run test:coverage    # Informe de cobertura, sin umbral obligatorio
bun run verify           # Typecheck y tests
bun run build            # Verifica antes de compilar ./weather-cli
```

Todas las pruebas están en `tests/`: API con `fetch` simulado, almacenamiento,
utilidades, presentación, acciones, menú principal en proceso y smoke tests del CLI.
Usan un `HOME` temporal y no modifican `~/.weather-cli` del usuario ni consultan
Open-Meteo. Los escenarios están documentados en `specs/testing/`.

El build se detiene si falla el typecheck o cualquier test: no compila ni
sobrescribe el binario existente. La cobertura solo informa y no bloquea por porcentaje.

### Publicar una versión

Al subir a `main` un cambio en `package.json`, GitHub Actions lee su campo
`version` (SemVer). Si el tag correspondiente aún no existe, ejecuta
`bun run build` en Linux x64, macOS ARM64 y Windows x64. Solo si los tres
builds pasan se crea el tag `v<version>` sobre ese commit y se publica una
release con los tres binarios. Las versiones preliminares se marcan como tales.

Para publicar otra versión, incrementa `version` y haz merge a `main`. Si el
tag ya existe, el workflow no lo modifica ni vuelve a publicar la release;
si una publicación quedó incompleta, debe revisarse manualmente. El workflow
requiere que GitHub Actions tenga permitido escribir en el contenido del repositorio.
En Linux y macOS puede ser necesario dar permiso de ejecución al binario descargado
con `chmod +x <archivo>`.

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
