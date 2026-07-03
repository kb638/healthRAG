import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function findProjectRoot(startDir = process.cwd()) {
  let currentDir = resolve(startDir);

  while (true) {
    if (
      existsSync(resolve(currentDir, "package.json")) &&
      existsSync(resolve(currentDir, "data"))
    ) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);

    if (parentDir === currentDir) {
      return resolve(startDir);
    }

    currentDir = parentDir;
  }
}
