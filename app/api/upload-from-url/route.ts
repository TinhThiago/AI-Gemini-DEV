import { NextRequest, NextResponse } from "next/server";
import { unzipToWorkspace } from "@/lib/workspace";
import { scanProject } from "@/lib/scanner";

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Missing blob url",
                },
                { status: 400 }
            );
        }

        const fileRes = await fetch(url);

        if (!fileRes.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Cannot download uploaded blob",
                },
                { status: 400 }
            );
        }

        const arrayBuffer = await fileRes.arrayBuffer();
        const zipBuffer = Buffer.from(arrayBuffer);

        const { projectId, workspacePath } = unzipToWorkspace(zipBuffer);
        const files = scanProject(workspacePath);

        return NextResponse.json({
            ok: true,
            projectId,
            files,
        });
    } catch (error: any) {
        console.error("upload-from-url error:", error);

        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Upload from URL failed",
            },
            { status: 500 }
        );
    }
}