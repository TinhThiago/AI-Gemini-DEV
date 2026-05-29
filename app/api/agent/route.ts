import { NextRequest, NextResponse } from "next/server";
import { getWorkspacePath } from "@/lib/workspace";
import { createSeniorDevPlan } from "@/lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { projectId, prompt } = body;

    if (!projectId || !prompt) {
      return NextResponse.json(
        { ok: false, error: "Missing projectId or prompt" },
        { status: 400 }
      );
    }

    const rootPath = getWorkspacePath(projectId);
    const result = await createSeniorDevPlan(rootPath, prompt);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (err: any) {
    console.error("AGENT ERROR:", err);

    const message = String(err?.message || err);

    if (
      message.includes("503") ||
      message.toLowerCase().includes("high demand") ||
      message.toLowerCase().includes("unavailable")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Gemini đang quá tải tạm thời. Vui lòng bấm Run lại sau 1-2 phút.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}