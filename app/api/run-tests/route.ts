import { NextRequest, NextResponse } from "next/server";
import { getWorkspacePath } from "@/lib/workspace";
import { detectTestCommand, runCommand } from "@/lib/test-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, command } = body;

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "Missing projectId" },
        { status: 400 }
      );
    }

    const rootPath = getWorkspacePath(projectId);
    const testCommand = command || detectTestCommand(rootPath);

    if (!testCommand) {
      return NextResponse.json(
        {
          ok: false,
          error: "Không detect được test command. Hãy nhập command thủ công.",
        },
        { status: 400 }
      );
    }

    const result = await runCommand(testCommand, rootPath);

    return NextResponse.json({
      ok: true,
      result,
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