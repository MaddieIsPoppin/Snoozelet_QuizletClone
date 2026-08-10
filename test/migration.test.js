import { createClient } from "@libsql/client";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("review idempotency migration preserves existing review rows", async () => {
  const databasePath = path.join(os.tmpdir(), `snoozelet-legacy-${randomUUID()}.sqlite`);
  const legacy = createClient({ url: `file:${databasePath}` });

  await legacy.execute(`
    CREATE TABLE review_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      deck_id INTEGER NOT NULL,
      mode TEXT NOT NULL,
      answer TEXT DEFAULT '',
      expected TEXT NOT NULL,
      correct INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await legacy.execute({
    sql: `
      INSERT INTO review_logs (card_id, deck_id, mode, answer, expected, correct, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [1, 1, "typed", "answer", "answer", 1, new Date().toISOString()],
  });
  legacy.close();

  process.env.STUDY_DB_PATH = databasePath;
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
  delete process.env.LIBSQL_DATABASE_URL;
  delete process.env.LIBSQL_AUTH_TOKEN;

  const db = await import(`../lib/db.js?migration=${randomUUID()}`);
  const columns = await db.queryAll("PRAGMA table_info(review_logs)");
  const indexes = await db.queryAll("PRAGMA index_list(review_logs)");
  const preserved = await db.queryOne("SELECT * FROM review_logs WHERE id = 1");

  assert.ok(columns.some((column) => column.name === "attempt_id"));
  assert.ok(
    indexes.some(
      (index) => index.name === "idx_review_logs_attempt_id" && Number(index.unique) === 1
    )
  );
  assert.equal(preserved.answer, "answer");
  assert.equal(preserved.expected, "answer");
  assert.equal(preserved.attempt_id, null);
});
