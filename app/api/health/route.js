import { NextResponse } from "next/server";
import { getDatabaseInfo, queryOne } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await queryOne("SELECT 1 AS ok");
    return NextResponse.json({
      ok: true,
      database: result?.ok === 1 ? "connected" : "unavailable",
      databaseMode: "local",
      databasePath: getDatabaseInfo().path,
      release: "web-stable-5"
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        database: "unavailable"
      },
      { status: 503 }
    );
  }
}
