# AGENTS.md

## Overview

Educational project (course exercise): a Spanish-language interactive console weather CLI. Currently a skeleton — `index.ts` is still the Bun starter template; the real app has not been written yet.

## Commands

- Runtime is **Bun** (not Node): use `bun`, never `node`/`npm`/`npx`.
- Install: `bun install`
- Run: `bun run index.ts`
- Typecheck (the only script, used for verification): `bun run typecheck` (maps to `bun check`)

No test, lint, or CI setup exists.

## Conventions

- README and the CLI menu are in Spanish; keep user-facing strings in Spanish.
- `tsconfig.json` is strict with `noUncheckedIndexedAccess` — array/object index access yields `T | undefined`; handle it instead of disabling or casting around it.

## Project spec (from README)

Final goal is a compiled executable binary (`bun build --compile`).

CLI menu shape (do not invent a different design):
1. Weather for default city, 2. Weather for all saved cities, 3. Search & add city, 4. Remove city, 5. Set default city, 8. Settings (°C), 9. Exit.

Weather lookup is a two-step call to OpenMeteo (no API key needed):
1. Geocoding: `https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=es&format=json`
2. Forecast (using returned lat/lon): `https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m`
