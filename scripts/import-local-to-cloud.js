import { createClient } from "@libsql/client";
import nextEnv from "@next/env";
import fs from "node:fs";
import path from "node:path";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const localPath = path.resolve(process.env.STUDY_DB_PATH || "data/study.sqlite");
const remoteUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL;
const remoteToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

if (!fs.existsSync(localPath)) throw new Error(`Local database not found: ${localPath}`);
if (!remoteUrl || !remoteToken) throw new Error("Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to .env.local first");
if (remoteUrl.startsWith("file:")) throw new Error("TURSO_DATABASE_URL must point to a remote database");

// Importing db.js initializes the current remote database with Snoozelet's
// complete schema and migrations before data is copied into it.
const remoteDb = await import(`../lib/db.js?cloud-import=${Date.now()}`);
await remoteDb.queryOne("SELECT 1 AS ready");

const local = createClient({ url: `file:${localPath}` });
const remote = createClient({ url: remoteUrl, authToken: remoteToken });
const destinationUsers = await remote.execute("SELECT COUNT(*) AS count FROM users");
if (Number(destinationUsers.rows[0].count) > 0) {
  throw new Error("Cloud import stopped: the destination already contains users. No data was changed.");
}

const tables = [
  "users",
  "deck_folders",
  "decks",
  "cards",
  "study_stats",
  "review_logs",
  "user_progress",
  "learning_goals",
];

const copied = {};
try {
  for (const table of tables) {
    const sourceExists = await local.execute({
      sql: "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      args: [table],
    });
    if (!sourceExists.rows.length) continue;
    const columnsResult = await local.execute(`PRAGMA table_info(${table})`);
    const columns = columnsResult.rows.map((column) => String(column.name));
    const rows = await local.execute(`SELECT * FROM ${table}`);
    if (rows.rows.length) {
      const placeholders = columns.map(() => "?").join(", ");
      const statements = rows.rows.map((row) => ({
        sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
        args: columns.map((column) => row[column]),
      }));
      await remote.batch(statements, "write");
    }
    copied[table] = rows.rows.length;
  }
  const integrity = await remote.execute("PRAGMA foreign_key_check");
  if (integrity.rows.length) throw new Error("Cloud import completed with foreign-key errors");
  console.log("Cloud import complete:");
  for (const [table, count] of Object.entries(copied)) console.log(`  ${table}: ${count}`);
} finally {
  local.close();
  remote.close();
}
