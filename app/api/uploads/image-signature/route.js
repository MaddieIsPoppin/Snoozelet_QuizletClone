import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createImageUploadSignature } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST() {
  await requireUser();
  const upload = createImageUploadSignature(Math.floor(Date.now() / 1000));

  if (!upload) {
    return NextResponse.json(
      { error: "Image uploads are not configured" },
      { status: 503 }
    );
  }

  return NextResponse.json(upload, {
    headers: { "Cache-Control": "no-store" },
  });
}
