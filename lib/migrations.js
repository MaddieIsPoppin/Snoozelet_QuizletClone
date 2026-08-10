const migrations = [
  {
    version: 1,
    name: "deck ownership and session indexes",
    async up(transaction) {
      const columns = await transaction.execute("PRAGMA table_info(decks)");
      if (!columns.rows.some((column) => column.name === "user_id")) {
        await transaction.execute(
          "ALTER TABLE decks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE"
        );
      }
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id)"
      );
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)"
      );
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)"
      );
    },
  },
  {
    version: 2,
    name: "review attempt idempotency",
    async up(transaction) {
      const columns = await transaction.execute("PRAGMA table_info(review_logs)");
      if (!columns.rows.some((column) => column.name === "attempt_id")) {
        await transaction.execute("ALTER TABLE review_logs ADD COLUMN attempt_id TEXT");
      }
      await transaction.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_review_logs_attempt_id ON review_logs(attempt_id) WHERE attempt_id IS NOT NULL"
      );
    },
  },
  {
    version: 3,
    name: "study query indexes",
    async up(transaction) {
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id)"
      );
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_study_stats_deck_due ON study_stats(deck_id, due_at)"
      );
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_review_logs_deck_created ON review_logs(deck_id, created_at DESC)"
      );
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_decks_user_updated ON decks(user_id, updated_at DESC)"
      );
    },
  },
];

export async function runMigrations(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = await db.execute("SELECT version FROM schema_migrations");
  const appliedVersions = new Set(applied.rows.map((row) => Number(row.version)));

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue;

    const transaction = await db.transaction("write");
    try {
      await migration.up(transaction);
      await transaction.execute({
        sql: "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
        args: [migration.version, migration.name, new Date().toISOString()],
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      transaction.close();
    }
  }
}

export const latestSchemaVersion = migrations.at(-1).version;
