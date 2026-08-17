import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { syncLocalUserToCloud } from "@/lib/cloud-sync";

export const runtime = "nodejs";
export async function POST() {
  try {
    const user = await requireUser();
    const result = await syncLocalUserToCloud(user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Sync failed." }, { status: 500 });
  }
}
