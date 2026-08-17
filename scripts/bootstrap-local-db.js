import nextEnv from "@next/env";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const dataDir = path.resolve("data");
const finalPath = path.resolve(process.env.STUDY_DB_PATH || path.join(dataDir, "study.sqlite"));
const nextPath = path.join(dataDir, `study-bootstrap-${process.pid}.sqlite`);
const previousPath = path.join(dataDir, "study-before-local-first.sqlite");
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
  execFileSync(process.execPath, [path.resolve("scripts", "download-cloud-db.js"), nextPath], {
    cwd: process.cwd(),
    env: { ...process.env, TURSO_DATABASE_URL: remoteUrl, TURSO_AUTH_TOKEN: remoteToken },
    stdio: "pipe",
  });
  if (fs.existsSync(finalPath) && !fs.existsSync(previousPath)) fs.copyFileSync(finalPath, previousPath);
  fs.rmSync(finalPath, { force: true });
  fs.rmSync(`${finalPath}-shm`, { force: true });
  fs.rmSync(`${finalPath}-wal`, { force: true });
  fs.renameSync(nextPath, finalPath);
  fs.writeFileSync(markerPath, `Initialized from Turso at ${new Date().toISOString()}\n`);
  console.log("Local Snoozelet database initialized from Turso.");
} catch (error) {
  for (const file of [nextPath, `${nextPath}-shm`, `${nextPath}-wal`]) {
    try { fs.rmSync(file, { force: true }); } catch { /* A failed child may still be releasing its handle. */ }
  }
  fs.writeFileSync(markerPath, `Existing local database retained after bootstrap failure at ${new Date().toISOString()}.\n`);
  const detail = error instanceof Error ? `${error.message}${error.stderr ? ` ${String(error.stderr)}` : ""}` : String(error);
  console.error(`Local bootstrap could not download Turso data; the existing local database was retained. ${detail}`);
}
