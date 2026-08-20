import { NextResponse } from "next/server";

export const runtime = "nodejs";
export async function POST() {
  return NextResponse.json({ ok: false, error: "Cloud sync is paused in the stable local edition." }, { status: 410 });
}
