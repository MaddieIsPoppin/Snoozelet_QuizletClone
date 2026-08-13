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
  {
    version: 4,
    name: "card images",
    async up(transaction) {
      const columns = await transaction.execute("PRAGMA table_info(cards)");
      const names = new Set(columns.rows.map((column) => column.name));
      if (!names.has("image_url")) {
        await transaction.execute("ALTER TABLE cards ADD COLUMN image_url TEXT");
      }
      if (!names.has("image_public_id")) {
        await transaction.execute("ALTER TABLE cards ADD COLUMN image_public_id TEXT");
      }
      if (!names.has("image_alt")) {
        await transaction.execute("ALTER TABLE cards ADD COLUMN image_alt TEXT");
      }
    },
  },
  {
    version: 5,
    name: "deck folders",
    async up(transaction) {
      await transaction.execute(`
        CREATE TABLE IF NOT EXISTS deck_folders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(user_id, name COLLATE NOCASE)
        )
      `);
      const columns = await transaction.execute("PRAGMA table_info(decks)");
      if (!columns.rows.some((column) => column.name === "folder_id")) {
        await transaction.execute(
          "ALTER TABLE decks ADD COLUMN folder_id INTEGER REFERENCES deck_folders(id) ON DELETE SET NULL"
        );
      }
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_deck_folders_user_name ON deck_folders(user_id, name)"
      );
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_decks_folder_id ON decks(folder_id)"
      );
    },
  },
  {
    version: 6,
    name: "card hints",
    async up(transaction) {
      const columns = await transaction.execute("PRAGMA table_info(cards)");
      if (!columns.rows.some((column) => column.name === "hint")) {
        await transaction.execute("ALTER TABLE cards ADD COLUMN hint TEXT DEFAULT ''");
      }
    },
  },
  {
    version: 7,
    name: "learning goals",
    async up(transaction) {
      await transaction.execute(`CREATE TABLE IF NOT EXISTS learning_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE, title TEXT NOT NULL,
        exam_date TEXT NOT NULL, daily_minutes INTEGER NOT NULL DEFAULT 15, created_at TEXT NOT NULL
      )`);
      await transaction.execute("CREATE INDEX IF NOT EXISTS idx_learning_goals_user_date ON learning_goals(user_id, exam_date)");
    },
  },
  {
    version: 8,
    name: "review flow sessions",
    async up(transaction) {
      const columns = await transaction.execute("PRAGMA table_info(review_logs)");
      if (!columns.rows.some((column) => column.name === "session_id")) {
        await transaction.execute("ALTER TABLE review_logs ADD COLUMN session_id TEXT");
      }
      await transaction.execute(
        "CREATE INDEX IF NOT EXISTS idx_review_logs_session_id ON review_logs(session_id, id DESC)"
      );
    },
  },
  {
    version: 9,
    name: "subjects study units and resources",
    async up(transaction) {
      await transaction.execute(`CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, name COLLATE NOCASE)
      )`);
      const folderColumns = await transaction.execute("PRAGMA table_info(deck_folders)");
      if (!folderColumns.rows.some((column) => column.name === "subject_id")) {
        await transaction.execute("ALTER TABLE deck_folders ADD COLUMN subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL");
      }
      await transaction.execute(`CREATE TABLE IF NOT EXISTS resource_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        folder_id INTEGER REFERENCES deck_folders(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT DEFAULT 'website',
        description TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        CHECK(subject_id IS NOT NULL OR folder_id IS NOT NULL)
      )`);
      await transaction.execute("CREATE INDEX IF NOT EXISTS idx_subjects_user_name ON subjects(user_id, name)");
      await transaction.execute("CREATE INDEX IF NOT EXISTS idx_deck_folders_subject ON deck_folders(subject_id, user_id)");
      await transaction.execute("CREATE INDEX IF NOT EXISTS idx_resources_subject ON resource_links(subject_id, user_id)");
      await transaction.execute("CREATE INDEX IF NOT EXISTS idx_resources_folder ON resource_links(folder_id, user_id)");
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
