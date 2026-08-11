import { createClient } from "@libsql/client";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { latestSchemaVersion } from "../lib/migrations.js";

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
  const cardColumns = await db.queryAll("PRAGMA table_info(cards)");
  const indexes = await db.queryAll("PRAGMA index_list(review_logs)");
  const preserved = await db.queryOne("SELECT * FROM review_logs WHERE id = 1");
  const versions = await db.queryAll("SELECT version FROM schema_migrations ORDER BY version");
  const cardPlan = await db.queryAll("EXPLAIN QUERY PLAN SELECT * FROM cards WHERE deck_id = 1");
  const duePlan = await db.queryAll(
    "EXPLAIN QUERY PLAN SELECT * FROM study_stats WHERE deck_id = 1 AND due_at <= '2026-01-01'"
  );
  const reviewPlan = await db.queryAll(
    "EXPLAIN QUERY PLAN SELECT * FROM review_logs WHERE deck_id = 1 ORDER BY created_at DESC"
  );

  assert.ok(columns.some((column) => column.name === "attempt_id"));
  assert.ok(
    indexes.some(
      (index) => index.name === "idx_review_logs_attempt_id" && Number(index.unique) === 1
    )
  );
  assert.equal(preserved.answer, "answer");
  assert.equal(preserved.expected, "answer");
  assert.equal(preserved.attempt_id, null);
  assert.deepEqual(versions.map(({ version }) => Number(version)), [1, 2, 3, 4, 5, 6, 7]);
  const goalTable = await db.queryOne("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'learning_goals'");
  assert.equal(goalTable.name, "learning_goals");
  assert.ok(cardColumns.some((column) => column.name === "image_url"));
  assert.ok(cardColumns.some((column) => column.name === "image_public_id"));
  assert.ok(cardColumns.some((column) => column.name === "image_alt"));
  assert.ok(cardColumns.some((column) => column.name === "hint"));
  assert.equal(Number(versions.at(-1).version), latestSchemaVersion);
  assert.match(cardPlan.map(({ detail }) => detail).join(" "), /idx_cards_deck_id/);
  assert.match(duePlan.map(({ detail }) => detail).join(" "), /idx_study_stats_deck_due/);
  assert.match(reviewPlan.map(({ detail }) => detail).join(" "), /idx_review_logs_deck_created/);

  assert.equal(versions.length, latestSchemaVersion);
});
