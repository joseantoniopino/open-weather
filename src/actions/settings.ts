import { askMenuChoice, displaySettingsMenu } from "../presentation/menu.ts";
import { printBlankLine, printError, printSuccess } from "../presentation/output.ts";
import { toggleUnit } from "../storage/settingsStorage.ts";
import type { AppConfig } from "../types/Config.ts";
import { unitSymbol } from "../utils/format.ts";
import { persistConfig } from "./shared.ts";

/** Opción 8: submenú de ajustes. */
export async function openSettings(config: AppConfig): Promise<void> {
  let goingBack = false;
  while (!goingBack) {
    displaySettingsMenu(config.unit);
    const choice = askMenuChoice();
    if (choice === null) {
      goingBack = true;
      break;
    }
    printBlankLine();
    switch (choice) {
      case "1": {
        const nextUnit = toggleUnit(config);
        await persistConfig(config);
        printSuccess(`Unidad de temperatura actualizada a ${unitSymbol(nextUnit)}`);
        break;
      }
      case "2":
        goingBack = true;
        break;
      default:
        printError("Opción no válida. Elige un número del menú de ajustes.");
        break;
    }
  }
}
