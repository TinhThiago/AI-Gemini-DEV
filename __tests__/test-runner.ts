import { exec } from "child_process";
import fs from "fs";
import path from "path";
import stripAnsi from "strip-ansi";

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
        timeout: 180000,
        maxBuffer: 1024 * 1024 * 20,
        shell: true,
      },
      (error, stdout, stderr) => {
        resolve({
          command,
          stdout: stripAnsi(stdout),
          stderr: stripAnsi(stderr),
          code: error ? 1 : 0,
        });
      }
    );
  });
}

export function detectInstallCommand(rootPath: string) {
  if (fs.existsSync(path.join(rootPath, "package-lock.json"))) {
    return "npm ci";
  }

  if (fs.existsSync(path.join(rootPath, "package.json"))) {
    return "npm install";
  }

  return "";
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

    return "";
  }

  if (fs.existsSync(path.join(rootPath, "pytest.ini"))) {
    return "pytest";
  }

  if (fs.existsSync(path.join(rootPath, "requirements.txt"))) {
    return "pytest";
  }

  return "";
}

export async function installAndRunTests(rootPath: string, command?: string) {
  const nodeModulesPath = path.join(rootPath, "node_modules");

  const shouldInstall =
    fs.existsSync(path.join(rootPath, "package.json")) &&
    !fs.existsSync(nodeModulesPath);

  let installResult = null;

  if (shouldInstall) {
    const installCommand = detectInstallCommand(rootPath);

    if (installCommand) {
      installResult = await runCommand(installCommand, rootPath);

      if (installResult.code !== 0) {
        return {
          command: installCommand,
          code: 1,
          stdout: installResult.stdout,
          stderr: installResult.stderr,
          installResult,
          testResult: null,
        };
      }
    }
  }

  const testCommand = command || detectTestCommand(rootPath);

  if (!testCommand) {
    throw new Error("Không detect được test command. Hãy nhập command thủ công.");
  }

  const testResult = await runCommand(testCommand, rootPath);

  return {
    command: testCommand,
    code: testResult.code,
    stdout: stripAnsi(
      (installResult ? "INSTALL OUTPUT:\n" + installResult.stdout + "\n\n" : "") +
      "TEST OUTPUT:\n" +
      testResult.stdout
    ),
    stderr: stripAnsi(
      (installResult ? "INSTALL STDERR:\n" + installResult.stderr + "\n\n" : "") +
      "TEST STDERR:\n" +
      testResult.stderr
    ),
    installResult,
    testResult,
  };
}