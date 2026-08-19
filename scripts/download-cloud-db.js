import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const targetPath = path.resolve(process.argv[2] || "");
const remoteUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL;
const remoteToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
if (!targetPath || !remoteUrl || !remoteToken) throw new Error("Cloud download configuration is incomplete.");

for (const file of [targetPath, `${targetPath}-shm`, `${targetPath}-wal`]) fs.rmSync(file, { force: true });
process.env.SNOOZELET_DATABASE_MODE = "local";
process.env.STUDY_DB_PATH = targetPath;
const localModule = await import(`../lib/db.js?download=${Date.now()}`);
await localModule.queryOne("SELECT 1 AS ready");

const remote = createClient({ url: remoteUrl, authToken: remoteToken });
const local = createClient({ url: `file:${targetPath}` });
const tables = ["users", "sessions", "subjects", "deck_folders", "decks", "cards", "study_stats", "review_logs", "user_progress", "learning_goals", "resource_links", "notes"];
try {
  for (const table of tables) {
    const exists = await remote.execute({ sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", args: [table] });
    if (!exists.rows.length) continue;
    const columnsResult = await remote.execute(`PRAGMA table_info(${table})`);
    const columns = columnsResult.rows.map((column) => String(column.name));
    const rows = await remote.execute(`SELECT * FROM ${table}`);
    if (!rows.rows.length) continue;
    const placeholders = columns.map(() => "?").join(", ");
    await local.batch(rows.rows.map((row) => ({ sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`, args: columns.map((column) => row[column]) })), "write");
  }
  const integrity = await local.execute("PRAGMA foreign_key_check");
  if (integrity.rows.length) throw new Error("The downloaded database did not pass its integrity check.");
} finally {
  remote.close();
  local.close();
}
