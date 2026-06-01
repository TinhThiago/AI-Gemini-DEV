import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as HandleUploadBody;

        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async () => {
                return {
                    allowedContentTypes: [
                        "application/zip",
                        "application/x-zip-compressed",
                        "application/octet-stream",
                    ],
                };
            },
            onUploadCompleted: async ({ blob }) => {
                console.log("Blob upload completed:", blob.url);
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error: any) {
        console.error("blob-upload error:", error);

        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Blob upload failed",
            },
            { status: 400 }
        );
    }
}