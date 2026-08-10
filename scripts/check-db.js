import { createClient } from "@libsql/client";
import path from "node:path";

const dbPath = path.join(process.cwd(), "data", "study.sqlite");

const db = createClient({
  url: `file:${dbPath}`,
});

async function main() {
  console.log("\n================================");
  console.log("     SNOOZELET DATABASE CHECK");
  console.log("================================\n");

  console.log("Database location:");
  console.log(dbPath);

  // ------------------------------------------------
  // TABLES
  // ------------------------------------------------

  const tables = await db.execute(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
  `);

  console.log("\n--- TABLES ---");

  const tableNames = tables.rows.map((row) => row.name);

  for (const name of tableNames) {
    console.log("✓", name);
  }

  const expectedTables = [
    "users",
    "sessions",
    "decks",
    "cards",
    "study_stats",
    "review_logs",
    "user_progress",
  ];

  console.log("\n--- REQUIRED TABLE CHECK ---");

  for (const name of expectedTables) {
    if (tableNames.includes(name)) {
      console.log(`✓ ${name}`);
    } else {
      console.log(`✗ MISSING: ${name}`);
    }
  }

  // ------------------------------------------------
  // USERS
  // ------------------------------------------------

  console.log("\n--- USERS ---");

  const users = await db.execute(`
    SELECT id, username, created_at
    FROM users
  `);

  console.table(users.rows);

  // ------------------------------------------------
  // DECKS
  // ------------------------------------------------

  console.log("\n--- DECKS ---");

  const decks = await db.execute(`
    SELECT id, user_id, title, description
    FROM decks
  `);

  console.table(decks.rows);

  // ------------------------------------------------
  // CARDS
  // ------------------------------------------------

  console.log("\n--- CARDS ---");

  const cards = await db.execute(`
    SELECT id, deck_id, term, definition
    FROM cards
  `);

  console.table(cards.rows);

  // ------------------------------------------------
  // STUDY STATS
  // ------------------------------------------------

  console.log("\n--- STUDY STATS ---");

  const stats = await db.execute(`
    SELECT
      card_id,
      correct_count,
      incorrect_count,
      streak,
      best_streak,
      weak,
      due_at
    FROM study_stats
  `);

  console.table(stats.rows);

  // ------------------------------------------------
  // REVIEW HISTORY
  // ------------------------------------------------

  console.log("\n--- LATEST REVIEWS ---");

  const reviews = await db.execute(`
    SELECT
      id,
      card_id,
      mode,
      answer,
      expected,
      correct,
      created_at
    FROM review_logs
    ORDER BY id DESC
    LIMIT 10
  `);

  console.table(reviews.rows);

  // ------------------------------------------------
  // XP / GAMIFICATION
  // ------------------------------------------------

  console.log("\n--- USER PROGRESS / XP ---");

  if (tableNames.includes("user_progress")) {
    const progress = await db.execute(`
      SELECT *
      FROM user_progress
    `);

    console.table(progress.rows);
  } else {
    console.log("✗ user_progress table does not exist.");
  }

  console.log("\n================================");
  console.log("       DATABASE CHECK DONE");
  console.log("================================\n");
}

main()
  .catch((error) => {
    console.error("\nDATABASE CHECK FAILED:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    db.close();
  });