import { NextRequest, NextResponse } from "next/server";
import { getWorkspacePath } from "@/lib/workspace";
import { writeProjectFile } from "@/lib/scanner";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { projectId, changes, tests } = body;

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "Missing projectId" },
        { status: 400 }
      );
    }

    const rootPath = getWorkspacePath(projectId);

    for (const change of changes || []) {
      writeProjectFile(rootPath, change.file, change.content);
    }

    for (const test of tests || []) {
      writeProjectFile(rootPath, test.file, test.content);
    }

    return NextResponse.json({
      ok: true,
      message: "Đã apply changes và tests",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}