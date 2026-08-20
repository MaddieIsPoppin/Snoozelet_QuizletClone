import fs from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";
import { createLocalBackup } from "@/lib/db";

export const runtime = "nodejs";
export async function GET() {
  await requireUser();
  const backupPath = await createLocalBackup("download");
  const file = await fs.readFile(backupPath);
  return new Response(file, { headers: { "Content-Type": "application/vnd.sqlite3", "Content-Disposition": `attachment; filename="${path.basename(backupPath)}"`, "Cache-Control": "no-store" } });
}
