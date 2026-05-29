import { NextRequest, NextResponse } from "next/server";
import { unzipToWorkspace } from "@/lib/workspace";
import { scanProject } from "@/lib/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing ZIP file" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json(
        { ok: false, error: "Only .zip files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { ok: false, error: "ZIP file is empty" },
        { status: 400 }
      );
    }

    const { projectId, workspacePath } = unzipToWorkspace(buffer);
    const files = await scanProject(workspacePath);

    return NextResponse.json({
      ok: true,
      projectId,
      workspacePath,
      files,
      fileCount: files.length,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Upload failed",
      },
      { status: 500 }
    );
  }
}