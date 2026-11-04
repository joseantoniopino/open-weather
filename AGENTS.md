# AGENTS.md

## Overview

Educational project (course exercise): a Spanish-language interactive console weather CLI. Fully implemented: `index.ts` runs the main menu loop and the option handlers, backed by modules under `src/`. The final artifact is a compiled Bun binary (`weather-cli`, gitignored).

## Commands

- Runtime is **Bun** (not Node): use `bun`, never `node`/`npm`/`npx`.
- Install: `bun install`
- Run: `bun run index.ts` (also `bun start`; `bun run dev` adds `--watch`)
- Typecheck: `bun run typecheck` (maps to `bun check`)
- Tests: `bun test` (Bun's built-in runner; suites live in `src/*.test.ts`)
- Build: `bun run build` → `./weather-cli`

No lint or CI setup exists.

## Structure

| File                 | Responsibility                                                                                                                              |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| `index.ts`           | Entrypoint: config load, main menu loop, option handlers; catches `ApiError`/`CityNotFoundError` and prints their Spanish messages          |
| `src/api.ts`         | Open-Meteo geocoding (`searchCities`) and forecast (`getWeather`, `getForecast`); 10 s timeout, one automatic retry on transient failures (network, timeout, 5xx/429); custom `ApiError`/`CityNotFoundError` classes |
| `src/config.ts`      | Loads, validates, saves and mutates the user config; pure helpers (`addCity`, `removeCityFromConfig`, `setDefaultCityById`, `setUnit`, ...) |
| `src/types.ts`       | Shared types (`City`, `AppConfig`, `TemperatureUnit`, `DailyForecast`, `Forecast`) and `unitSymbol` |
| `src/ui.ts`          | Every console read/write: menus, city lists, weather, forecast, messages and all prompts |
| `src/colors.ts`      | ANSI styles (`style()`) and color-support detection |
| `src/loading.ts`     | Transient TTY-only loading spinner (`withLoading`); the only module that draws and clears the loading line |
| `src/weather-codes.ts` | WMO weather code → Spanish description (`describeWeatherCode`), used by `ui.ts` |
| `src/config.test.ts` | Bun tests for the config module |
| `src/api.test.ts`    | Bun tests for the API retry logic (fetch mocked) |
| `src/loading.test.ts` | Bun tests for the loading wrapper |

## Conventions

- README and the CLI keep user-facing strings in Spanish.
- `tsconfig.json` is strict with `noUncheckedIndexedAccess` — array/object index access yields `T | undefined`; handle it instead of disabling or casting around it.
- All console input/output lives in `src/ui.ts`, except the transient loading indicator owned by `src/loading.ts`; `api.ts`, `config.ts`, `types.ts` and `weather-codes.ts` must not print or read stdin.
- Colors go only through `style()` from `src/colors.ts` and the `paint` map in `ui.ts`; never inline raw ANSI, never measure a colored string's length (breaks menu alignment).
- Every prompt goes through the `ask*` helpers in `ui.ts`. `ask()` clears the console after each non-null answer, but only when both stdin and stdout are TTYs.
- Keep `formatCity()` free of ANSI (it feeds messages, lists and tests).

## Behavior notes

CLI menu shape (do not invent a different design):
1. Weather for default city, 2. Weather for all saved cities, 3. Search & add city, 4. Remove city, 5. Set default city, 6. 7-day forecast for all saved cities, 8. Settings (unit: °C/°F), 9. Exit. Settings submenu: 1 toggle unit, 2 back.

Weather lookup is a two-step call to Open-Meteo (no API key needed):
1. Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=10&language=es&format=json` — up to 10 candidates. With exactly 1 match the city is added directly; with several, a numbered list is shown and the user picks one (empty input cancels).
2. Forecast (using returned lat/lon): `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m` (`temperature_unit=fahrenheit` when configured).

Retries: every Open-Meteo request gets one automatic retry (500 ms later) on transient failures — network errors, timeouts and HTTP 5xx/429. Client errors (4xx) and malformed responses are not retried, and after a failed retry the original Spanish error message is shown unchanged.

7-day forecast (option 6): same forecast endpoint for every saved city in parallel, with `daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max`, `forecast_days=7` and `timezone=auto`. `precipitation_probability_max` is optional and may be `null` (shown as `Lluvia —`). A failed city shows an error line without stopping the others.

Loading spinner: every async operation (config load/save, geocoding, weather, forecast) is wrapped with `withLoading` from `src/loading.ts` (`index.ts` routes saves through `persistConfig`). The spinner is drawn only when stdin and stdout are TTY and `TERM` is not `dumb`, waits 150 ms before the first frame (fast operations print nothing), clears its line in a `finally`, and is never nested — wrap a whole `Promise.all` instead of each city.

Persistence: config lives at `~/.weather-cli/config.json` (not `~/.config/...`). Writes are atomic (`.json.tmp` → rename); a corrupted file is backed up as `.bak` and replaced with a fresh config.

Keep this file in sync when adding features.
