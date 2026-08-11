import { requireUser } from "@/lib/auth";
import { getBackupData } from "@/lib/db";

export const runtime = "nodejs";
export async function GET() {
  const user = await requireUser();
  const backup = await getBackupData(user.id);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="snoozelet-backup-${day}.json"`, "cache-control": "no-store" },
  });
}
