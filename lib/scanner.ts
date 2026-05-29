import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { safeJoin } from "./workspace";

const IGNORE = [
  "node_modules/**",
  ".git/**",
  "dist/**",
  "build/**",
  ".next/**",
  "coverage/**",
  ".env",
  ".env.local",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
];

const ALLOW_EXT = [
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".html",
  ".css",
  ".scss",
  ".json",
  ".md",
  ".py",
  ".cs",
  ".java",
  ".php",
  ".vue",
  ".svelte",
];

export async function scanProject(rootPath: string) {
  const files = await fg(["**/*"], {
    cwd: rootPath,
    onlyFiles: true,
    dot: true,
    ignore: IGNORE,
  });

  return files.filter((file) => ALLOW_EXT.includes(path.extname(file)));
}

export function readProjectFile(rootPath: string, relativePath: string) {
  const fullPath = safeJoin(rootPath, relativePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }

  return fs.readFileSync(fullPath, "utf8");
}

export function writeProjectFile(
  rootPath: string,
  relativePath: string,
  content: string
) {
  const fullPath = safeJoin(rootPath, relativePath);

  if (fs.existsSync(fullPath)) {
    fs.copyFileSync(fullPath, `${fullPath}.backup-${Date.now()}`);
  }

  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
}

export async function buildProjectMap(rootPath: string) {
  const files = await scanProject(rootPath);

  return files
    .map((file) => {
      const fullPath = safeJoin(rootPath, file);
      const size = fs.statSync(fullPath).size;
      return `- ${file} (${size} bytes)`;
    })
    .join("\n");
}

export async function buildCodeContext(rootPath: string, files: string[]) {
  let context = "";

  for (const file of files) {
    let content = readProjectFile(rootPath, file);

    if (content.length > 6000) {
      content = content.slice(0, 6000) + "\n\n/* FILE TRUNCATED */";
    }

    context += `
================ FILE: ${file} ================
${content}
`;
  }

  return context;
}