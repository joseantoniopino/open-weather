# AGENTS.md

## Overview

Educational project (course exercise): a Spanish-language interactive console weather CLI. Fully implemented: `src/index.ts` is the entrypoint (the root `index.ts` no longer exists); it runs the main menu loop and dispatches to user actions, backed by the layers under `src/`. The final artifact is a compiled Bun binary (`weather-cli`, gitignored).

## Commands

- Runtime is **Bun** (not Node): use `bun`, never `node`/`npm`/`npx`.
- Install: `bun install`
- Run: `bun run src/index.ts` (also `bun start`; `bun run dev` adds `--watch`)
- Typecheck: `bun run typecheck` (maps to `bun check`)
- Tests: `bun test` (Bun's built-in runner; suites are colocated next to the module they test)
- Build: `bun run build` → `./weather-cli`

No lint or CI setup exists.

## Structure

```text
src/
├── actions/                # One module per user flow (menu option)
│   ├── getWeather.ts       # Option 1: current weather of the default city
│   ├── getAllCitiesWeather.ts # Option 2: current weather of all saved cities
│   ├── addCity.ts          # Option 3: search & add city (chooseCity helper)
│   ├── removeCity.ts       # Option 4
│   ├── setDefaultCity.ts   # Option 5
│   ├── getForecast.ts      # Option 6: 7-day forecast for all saved cities
│   ├── settings.ts         # Option 8: settings submenu (openSettings)
│   └── shared.ts           # Internal helpers: persistConfig (save + spinner), loadingLabel, describeApiError
├── api/                    # Open-Meteo integration
│   ├── client.ts           # requestJson: 10 s timeout + one retry on transient failures (network, timeout, 5xx/429); TransientApiError
│   ├── errors.ts           # ApiError, CityNotFoundError, isKnownApiError (type guard)
│   ├── validation.ts       # JSON response validators (assertRecord/Number/String, asOptional*)
│   ├── geocoding.ts        # searchCities (up to 10 Spanish-language candidates)
│   ├── weather.ts          # getWeather, getForecast, parseDailyForecast
│   └── client.test.ts      # Retry logic tests (fetch mocked)
├── presentation/           # Everything shown to or read from the user
│   ├── menu.ts             # Menu rendering (MenuOption), main + settings menus, askMenuChoice
│   ├── output.ts           # All display* / print* messages, displayCityList, printBlankLine, displayGoodbye
│   ├── input.ts            # ask, askText, askNumberChoice, askYesNo; clears screen after answers
│   ├── loading.ts          # Transient TTY-only spinner (withLoading); only module that draws/clears the loading line
│   ├── theme.ts            # paint color palette + MENU_WIDTH/INDENT/SEPARATOR
│   └── loading.test.ts     # Loading wrapper tests
├── storage/
│   ├── configStorage.ts    # Disk: load/save the config JSON atomically, corrupted-file .bak backup, parseAppConfig validation
│   ├── citiesStorage.ts    # City operations on AppConfig: findCityById, addCityToConfig, removeCityFromConfig, setDefaultCityById
│   ├── settingsStorage.ts  # Preferences: setUnit, toggleUnit
│   ├── citiesStorage.test.ts / configStorage.test.ts / settingsStorage.test.ts
├── types/
│   ├── City.ts             # City, CityMatches
│   ├── Config.ts           # AppConfig, TemperatureUnit, LoadConfigResult
│   ├── Weather.ts          # CurrentWeather, DailyForecast, Forecast
│   └── MenuOption.ts       # Menu option contract for menu rendering
├── utils/
│   ├── format.ts           # unitSymbol, formatCity (ANSI-free), formatForecastDate, formatRain
│   ├── constants.ts        # APP_NAME, config paths, Open-Meteo URLs/timeouts/retries, shared Spanish messages
│   ├── colors.ts           # style() ANSI helper + color-support detection
│   └── weather-codes.ts    # WMO code → Spanish description
└── index.ts                # Entrypoint: config load, main menu loop, dispatch to actions; catches known API errors and prints their Spanish messages
```

## Conventions

- README and the CLI keep user-facing strings in Spanish.
- `tsconfig.json` is strict with `noUncheckedIndexedAccess` — array/object index access yields `T | undefined`; handle it instead of disabling or casting around it.
- Layers point downwards only: `actions` orchestrate, `presentation` does all console I/O, `storage` and `api` never print or read stdin. The spinner (`presentation/loading.ts`) is the only module allowed to draw the transient loading line.
- Colors go only through `style()` from `utils/colors.ts` and the `paint` map in `presentation/theme.ts`; never inline raw ANSI, never measure a colored string's length (breaks menu alignment).
- Every prompt goes through the `ask*` helpers in `presentation/input.ts`. `ask()` clears the console after each non-null answer, but only when both stdin and stdout are TTYs.
- Shared config mutations go through `actions/shared.ts` (`persistConfig` wraps `storage/configStorage.saveConfig` with the loading spinner).
- Keep `formatCity()` (in `utils/format.ts`) free of ANSI (it feeds messages, lists and tests).

## Behavior notes

CLI menu shape (do not invent a different design):
1. Weather for default city, 2. Weather for all saved cities, 3. Search & add city, 4. Remove city, 5. Set default city, 6. 7-day forecast for all saved cities, 8. Settings (unit: °C/°F), 9. Exit. Settings submenu: 1 toggle unit, 2 back.

Weather lookup is a two-step call to Open-Meteo (no API key needed):
1. Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=10&language=es&format=json` — up to 10 candidates. With exactly 1 match the city is added directly; with several, a numbered list is shown and the user picks one (empty input cancels).
2. Forecast (using returned lat/lon): `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m` (`temperature_unit=fahrenheit` when configured).

Retries: every Open-Meteo request gets one automatic retry (500 ms later) on transient failures — network errors, timeouts and HTTP 5xx/429. Client errors (4xx) and malformed responses are not retried, and after a failed retry the original Spanish error message is shown unchanged.

7-day forecast (option 6): same forecast endpoint for every saved city in parallel, with `daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max`, `forecast_days=7` and `timezone=auto`. `precipitation_probability_max` is optional and may be `null` (shown as `Lluvia —`). A failed city shows an error line without stopping the others.

Loading spinner: every async operation (config load/save, geocoding, weather, forecast) is wrapped with `withLoading` from `src/presentation/loading.ts` (actions route saves through `persistConfig` in `actions/shared.ts`). The spinner is drawn only when stdin and stdout are TTY and `TERM` is not `dumb`, waits 150 ms before the first frame (fast operations print nothing), clears its line in a `finally`, and is never nested — wrap a whole `Promise.all` instead of each city.

Persistence: config lives at `~/.weather-cli/config.json` (not `~/.config/...`). Writes are atomic (`.json.tmp` → rename); a corrupted file is backed up as `.bak` and replaced with a fresh config.

Keep this file in sync when adding features.
