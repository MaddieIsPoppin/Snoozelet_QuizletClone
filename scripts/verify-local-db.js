import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const databasePath = path.resolve(process.env.STUDY_DB_PATH || "data/study.sqlite");
const backupDir = path.join(path.dirname(databasePath), "backups");

async function validDatabase(file) {
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) return false;
  const db = createClient({ url: `file:${file}` });
  try {
    const result = await db.execute("PRAGMA integrity_check");
    return result.rows[0]?.integrity_check === "ok";
  } catch {
    return false;
  } finally {
    db.close();
  }
}

if (!fs.existsSync(databasePath)) process.exit(0);
if (await validDatabase(databasePath)) {
  console.log(`Local database verified: ${databasePath}`);
  process.exit(0);
}

const candidates = fs.existsSync(backupDir)
  ? fs.readdirSync(backupDir).filter((name) => name.endsWith(".sqlite")).sort().reverse().map((name) => path.join(backupDir, name))
  : [];
const recovery = (await Promise.all(candidates.map(async (file) => ({ file, valid: await validDatabase(file) })))).find((item) => item.valid)?.file;
if (!recovery) throw new Error("The local database is damaged and no valid automatic backup is available.");

const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const damagedCopy = path.join(path.dirname(databasePath), `study-corrupt-${stamp}.sqlite`);
fs.copyFileSync(databasePath, damagedCopy);
fs.copyFileSync(recovery, databasePath);
console.log(`Recovered the local database from ${recovery}. The damaged file was preserved at ${damagedCopy}.`);
