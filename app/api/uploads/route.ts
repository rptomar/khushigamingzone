import { NextRequest, NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/providers/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "avatars";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const storage = getStorageProvider();
    const result = await storage.uploadBuffer(buffer, {
      folder,
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "general";
  const storage = getStorageProvider();
  const signedParams = storage.getSignedUploadParams(folder);
  return NextResponse.json(signedParams);
}

