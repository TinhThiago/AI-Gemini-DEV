import { NextRequest, NextResponse } from "next/server";
import { diffLines } from "diff";
import { getWorkspacePath } from "@/lib/workspace";
import { readProjectFile } from "@/lib/scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const allChanges = [...(changes || []), ...(tests || [])];

    const result = allChanges.map((change: any) => {
      let oldContent = "";

      try {
        oldContent = readProjectFile(rootPath, change.file);
      } catch {
        oldContent = "";
      }

      const parts = diffLines(oldContent, change.content || "");

      return {
        file: change.file,
        reason: change.reason || change.description || "",
        parts,
      };
    });

    return NextResponse.json({
      ok: true,
      diffs: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || String(err),
      },
      { status: 500 }
    );
  }
}