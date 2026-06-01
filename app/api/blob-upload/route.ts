import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Missing BLOB_READ_WRITE_TOKEN",
                },
                { status: 500 }
            );
        }

        const body = (await request.json()) as HandleUploadBody;

        const jsonResponse = await handleUpload({
            body,
            request,
            token: process.env.BLOB_READ_WRITE_TOKEN,
            onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
                console.log("Generate Blob token:", {
                    pathname,
                    clientPayload,
                    multipart,
                });

                return {
                    maximumSizeInBytes: 500 * 1024 * 1024,
                    addRandomSuffix: true,
                    tokenPayload: JSON.stringify({
                        type: "source-zip",
                        pathname,
                    }),
                };
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                console.log("Blob upload completed:", blob.url, tokenPayload);
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