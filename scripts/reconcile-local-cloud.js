import { createClient } from "@libsql/client";
import nextEnv from "@next/env";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const localPath = path.resolve(process.env.STUDY_DB_PATH || "data/study.sqlite");
const remoteUrl = process.env.TURSO_DATABASE_URL;
const remoteToken = process.env.TURSO_AUTH_TOKEN;
if (!remoteUrl || !remoteToken) throw new Error("Turso is not configured.");
const mergeOnly = process.argv.includes("--merge-only");

if (!mergeOnly) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.resolve("data", `study-before-reconcile-${stamp}.sqlite`);
  fs.copyFileSync(localPath, backupPath);
  const mergeOutput = execFileSync(process.execPath, [path.resolve("scripts/reconcile-local-cloud.js"), "--merge-only"], { cwd: process.cwd(), env: process.env, encoding: "utf8" });
  const nextPath = path.resolve("data", `study-reconciled-${process.pid}.sqlite`);
  execFileSync(process.execPath, [path.resolve("scripts/download-cloud-db.js"), nextPath], { cwd: process.cwd(), env: process.env, stdio: "pipe" });
  fs.rmSync(localPath, { force: true });
  fs.renameSync(nextPath, localPath);
  console.log(`${mergeOutput.trim()} Local database refreshed. Backup: ${backupPath}`);
  process.exit(0);
}

const local = createClient({ url: `file:${localPath}` });
const remote = createClient({ url: remoteUrl, authToken: remoteToken });
const key = (row) => `${String(row.username).toLowerCase()}\u0000${String(row.deck_title).trim().toLowerCase()}\u0000${String(row.term).trim().toLowerCase()}\u0000${String(row.definition).trim().toLowerCase()}`;
let imported = 0;
try {
  const [localCards, remoteCards, localReviews, remoteReviews, localStats, remoteStats] = await Promise.all([
    local.execute("SELECT c.id, c.term, c.definition, d.title deck_title, u.username FROM cards c JOIN decks d ON d.id=c.deck_id JOIN users u ON u.id=d.user_id"),
    remote.execute("SELECT c.id, c.term, c.definition, d.id deck_id, d.title deck_title, u.username FROM cards c JOIN decks d ON d.id=c.deck_id JOIN users u ON u.id=d.user_id"),
    local.execute("SELECT r.*, c.term, c.definition, d.title deck_title, u.username FROM review_logs r JOIN cards c ON c.id=r.card_id JOIN decks d ON d.id=r.deck_id JOIN users u ON u.id=d.user_id ORDER BY r.id"),
    remote.execute("SELECT r.*, c.term, c.definition, d.title deck_title, u.username FROM review_logs r JOIN cards c ON c.id=r.card_id JOIN decks d ON d.id=r.deck_id JOIN users u ON u.id=d.user_id ORDER BY r.id"),
    local.execute("SELECT s.*, c.term, c.definition, d.title deck_title, u.username FROM study_stats s JOIN cards c ON c.id=s.card_id JOIN decks d ON d.id=s.deck_id JOIN users u ON u.id=d.user_id"),
    remote.execute("SELECT s.*, c.term, c.definition, d.title deck_title, u.username FROM study_stats s JOIN cards c ON c.id=s.card_id JOIN decks d ON d.id=s.deck_id JOIN users u ON u.id=d.user_id"),
  ]);
  const remoteCardByKey = new Map(remoteCards.rows.map((row) => [key(row), row]));
  const attempts = new Set(remoteReviews.rows.filter((row) => row.attempt_id).map((row) => String(row.attempt_id)));
  const signatures = new Set(remoteReviews.rows.map((row) => `${key(row)}\u0000${row.mode}\u0000${row.answer}\u0000${row.created_at}`));
  for (const row of localReviews.rows) {
    const card = remoteCardByKey.get(key(row));
    if (!card) continue;
    const signature = `${key(row)}\u0000${row.mode}\u0000${row.answer}\u0000${row.created_at}`;
    if ((row.attempt_id && attempts.has(String(row.attempt_id))) || signatures.has(signature)) continue;
    await remote.execute({ sql: "INSERT INTO review_logs (card_id, deck_id, attempt_id, session_id, mode, answer, expected, correct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [card.id, card.deck_id, row.attempt_id, row.session_id, row.mode, row.answer, row.expected, row.correct, row.created_at] });
    if (row.attempt_id) attempts.add(String(row.attempt_id));
    signatures.add(signature);
    imported += 1;
  }
  const remoteStatsByKey = new Map(remoteStats.rows.map((row) => [key(row), row]));
  for (const row of localStats.rows) {
    const card = remoteCardByKey.get(key(row));
    const cloudStat = remoteStatsByKey.get(key(row));
    if (!card || !cloudStat || String(row.last_reviewed_at || "") <= String(cloudStat.last_reviewed_at || "")) continue;
    await remote.execute({ sql: "UPDATE study_stats SET ease=?, interval_days=?, repetitions=?, lapses=?, due_at=?, last_reviewed_at=?, streak=?, best_streak=?, weak=? WHERE card_id=?", args: [row.ease, row.interval_days, row.repetitions, row.lapses, row.due_at, row.last_reviewed_at, row.streak, row.best_streak, row.weak, card.id] });
  }
  for (const card of remoteCards.rows) await remote.execute({ sql: "UPDATE study_stats SET correct_count=(SELECT COUNT(*) FROM review_logs WHERE card_id=? AND correct=1), incorrect_count=(SELECT COUNT(*) FROM review_logs WHERE card_id=? AND correct=0) WHERE card_id=?", args: [card.id, card.id, card.id] });
} finally {
  local.close();
  remote.close();
}

console.log(`Merged ${imported} local-only reviews into Turso.`);
