import { exec } from "child_process";
import fs from "fs";
import path from "path";

export function runCommand(command: string, cwd: string) {
  return new Promise<{
    command: string;
    stdout: string;
    stderr: string;
    code: number;
  }>((resolve) => {
    exec(
      command,
      {
        cwd,
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 10,
      },
      (error, stdout, stderr) => {
        resolve({
          command,
          stdout,
          stderr,
          code: error ? 1 : 0,
        });
      }
    );
  });
}

export function detectTestCommand(rootPath: string) {
  const packageJsonPath = path.join(rootPath, "package.json");

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    if (packageJson.scripts?.test) {
      return "npm test";
    }

    if (packageJson.devDependencies?.vitest || packageJson.dependencies?.vitest) {
      return "npx vitest run";
    }

    if (packageJson.devDependencies?.jest || packageJson.dependencies?.jest) {
      return "npx jest";
    }
  }

  if (fs.existsSync(path.join(rootPath, "pytest.ini"))) {
    return "pytest";
  }

  if (fs.existsSync(path.join(rootPath, "requirements.txt"))) {
    return "pytest";
  }

  return "";
}