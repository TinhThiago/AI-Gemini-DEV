import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { v4 as uuidv4 } from "uuid";

export function getWorkspaceRoot() {
  const root = process.env.WORKSPACE_ROOT || "./workspaces";
  const full = path.resolve(process.cwd(), root);

  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }

  return full;
}

export function createWorkspace() {
  const id = uuidv4();
  const root = getWorkspaceRoot();
  const workspacePath = path.join(root, id);

  fs.mkdirSync(workspacePath, { recursive: true });

  return {
    projectId: id,
    workspacePath,
  };
}

export function getWorkspacePath(projectId: string) {
  const root = getWorkspaceRoot();
  const workspacePath = path.resolve(root, projectId);

  if (!workspacePath.startsWith(root)) {
    throw new Error("Invalid project id");
  }

  return workspacePath;
}

export function unzipToWorkspace(zipBuffer: Buffer) {
  const { projectId, workspacePath } = createWorkspace();

  const zip = new AdmZip(zipBuffer);
  zip.extractAllTo(workspacePath, true);

  return {
    projectId,
    workspacePath,
  };
}

export function zipWorkspace(projectId: string) {
  const workspacePath = getWorkspacePath(projectId);

  if (!fs.existsSync(workspacePath)) {
    throw new Error("Workspace not found");
  }

  const zip = new AdmZip();
  zip.addLocalFolder(workspacePath);

  return zip.toBuffer();
}

export function safeJoin(rootPath: string, relativePath: string) {
  const safeRoot = path.resolve(rootPath);
  const fullPath = path.resolve(rootPath, relativePath);

  if (!fullPath.startsWith(safeRoot)) {
    throw new Error("Invalid file path");
  }

  return fullPath;
}