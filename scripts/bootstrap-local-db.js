import { createClient } from "@libsql/client";
import nextEnv from "@next/env";
import fs from "node:fs";
import path from "node:path";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const dataDir = path.resolve("data");
const finalPath = path.resolve(process.env.STUDY_DB_PATH || path.join(dataDir, "study.sqlite"));
const nextPath = path.join(dataDir, "study-bootstrap.sqlite");
const markerPath = path.join(dataDir, ".local-first-ready");
const remoteUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL;
const remoteToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

fs.mkdirSync(dataDir, { recursive: true });
if (fs.existsSync(markerPath)) process.exit(0);
if (!remoteUrl || !remoteToken || remoteUrl.startsWith("file:")) {
  fs.writeFileSync(markerPath, "Existing local database retained: cloud credentials unavailable.\n");
  process.exit(0);
}

try {
  fs.rmSync(nextPath, { force: true });
  fs.rmSync(`${nextPath}-shm`, { force: true });
  fs.rmSync(`${nextPath}-wal`, { force: true });
  process.env.SNOOZELET_DATABASE_MODE = "local";
  process.env.STUDY_DB_PATH = nextPath;
  const localModule = await import(`../lib/db.js?bootstrap=${Date.now()}`);
  await localModule.queryOne("SELECT 1 AS ready");

  const remote = createClient({ url: remoteUrl, authToken: remoteToken });
  const local = createClient({ url: `file:${nextPath}` });
  const tables = ["users", "sessions", "subjects", "deck_folders", "decks", "cards", "study_stats", "review_logs", "user_progress", "learning_goals", "resource_links"];
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

  const previousPath = path.join(dataDir, "study-before-local-first.sqlite");
  if (fs.existsSync(finalPath) && !fs.existsSync(previousPath)) fs.copyFileSync(finalPath, previousPath);
  fs.rmSync(finalPath, { force: true });
  fs.rmSync(`${finalPath}-shm`, { force: true });
  fs.rmSync(`${finalPath}-wal`, { force: true });
  fs.renameSync(nextPath, finalPath);
  fs.writeFileSync(markerPath, `Initialized from Turso at ${new Date().toISOString()}\n`);
  console.log("Local Snoozelet database initialized from Turso.");
} catch (error) {
  fs.rmSync(nextPath, { force: true });
  fs.rmSync(`${nextPath}-shm`, { force: true });
  fs.rmSync(`${nextPath}-wal`, { force: true });
  fs.writeFileSync(markerPath, `Existing local database retained after bootstrap failure at ${new Date().toISOString()}.\n`);
  console.error(`Local bootstrap could not download Turso data; the existing local database was retained. ${error instanceof Error ? error.message : error}`);
}
