import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { gradeReview, ReviewRequestError, validateReviewPayload } from "./review.js";
import { calculateReviewSchedule, levelFromXp, xpForReview } from "./progress.js";
import { runMigrations } from "./migrations.js";
import { normalizeCardImage } from "./card-media.js";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "study.sqlite");
const LOCAL_DB_PATH = process.env.STUDY_DB_PATH || DEFAULT_DB_PATH;
const REMOTE_DB_URL = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL;
const REMOTE_DB_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;
const HOSTED_ENV = Boolean(
  process.env.NETLIFY ||
    process.env.CONTEXT ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
);

let client;
let readyPromise;

function nowIso() {
  return new Date().toISOString();
}

function toInt(value) {
  return Number.parseInt(value, 10);
}

export function isHostedWithoutDatabase() {
  return Boolean(HOSTED_ENV && (!REMOTE_DB_URL || !REMOTE_DB_TOKEN));
}

function getClient() {
  if (isHostedWithoutDatabase()) {
    throw new Error("Hosted database is not configured. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Netlify.");
  }

  if (!client) {
    if (!REMOTE_DB_URL) {
      fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
    }

    client = createClient({
      url: REMOTE_DB_URL || `file:${LOCAL_DB_PATH}`,
      authToken: REMOTE_DB_TOKEN
    });
  }

  return client;
}

async function migrate() {
  const db = getClient();
  await rawRun("PRAGMA foreign_keys = ON");
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS deck_folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(user_id, name COLLATE NOCASE)
      )`,
      `CREATE TABLE IF NOT EXISTS decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        folder_id INTEGER REFERENCES deck_folders(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
        term TEXT NOT NULL,
        definition TEXT NOT NULL,
        hint TEXT DEFAULT '',
        image_url TEXT,
        image_public_id TEXT,
        image_alt TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS study_stats (
        card_id INTEGER PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
        deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
        ease REAL NOT NULL DEFAULT 2.5,
        interval_days INTEGER NOT NULL DEFAULT 0,
        repetitions INTEGER NOT NULL DEFAULT 0,
        lapses INTEGER NOT NULL DEFAULT 0,
        due_at TEXT NOT NULL,
        last_reviewed_at TEXT,
        correct_count INTEGER NOT NULL DEFAULT 0,
        incorrect_count INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        best_streak INTEGER NOT NULL DEFAULT 0,
        weak INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS review_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
        deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
        attempt_id TEXT,
        mode TEXT NOT NULL,
        answer TEXT DEFAULT '',
        expected TEXT NOT NULL,
        correct INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )`,

    `CREATE TABLE IF NOT EXISTS user_progress (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      total_xp INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    ],
    "write"
  );
  await runMigrations(db);
}

async function ensureReady() {
  if (!readyPromise) {
    readyPromise = migrate();
  }

  await readyPromise;
}

async function rawRun(sql, args = []) {
  return getClient().execute({ sql, args });
}

function toPlainRow(row) {
  return Object.fromEntries(Object.entries(row));
}

async function rawAll(sql, args = []) {
  const result = await getClient().execute({ sql, args });
  return result.rows.map(toPlainRow);
}

export async function queryRun(sql, args = []) {
  await ensureReady();
  return rawRun(sql, args);
}

export async function queryAll(sql, args = []) {
  await ensureReady();
  return rawAll(sql, args);
}

export async function queryOne(sql, args = []) {
  const rows = await queryAll(sql, args);
  return rows[0] || null;
}

function normalizeDeck(row) {
  return {
    ...row,
    card_count: row.card_count || 0,
    due_count: row.due_count || 0,
    weak_count: row.weak_count || 0,
    accuracy: row.review_count ? Math.round((row.correct_total / row.review_count) * 100) : 0,
    review_count: row.review_count || 0
  };
}

export async function getDecks(userId) {
  const now = nowIso();
  const rows = await queryAll(
    `
    SELECT
      d.*,
      COUNT(c.id) AS card_count,
      COALESCE(SUM(CASE WHEN s.due_at <= ? THEN 1 ELSE 0 END), 0) AS due_count,
      COALESCE(SUM(CASE WHEN s.weak = 1 THEN 1 ELSE 0 END), 0) AS weak_count,
      COALESCE(SUM(s.correct_count), 0) AS correct_total,
      COALESCE(SUM(s.correct_count + s.incorrect_count), 0) AS review_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    LEFT JOIN study_stats s ON s.card_id = c.id
    WHERE d.user_id = ?
    GROUP BY d.id
    ORDER BY d.updated_at DESC
  `,
    [now, toInt(userId)]
  );

  return rows.map(normalizeDeck);
}

export async function getDeckFolders(userId) {
  return queryAll(
    `SELECT f.id, f.name, f.created_at, f.updated_at, COUNT(d.id) AS deck_count
     FROM deck_folders f
     LEFT JOIN decks d ON d.folder_id = f.id AND d.user_id = f.user_id
     WHERE f.user_id = ?
     GROUP BY f.id
     ORDER BY f.name COLLATE NOCASE`,
    [toInt(userId)]
  );
}

export async function createDeckFolder({ name, userId }) {
  const cleanedName = String(name || "").trim();
  if (!cleanedName) throw new Error("Folder name is required");
  if (cleanedName.length > 80) throw new Error("Folder names must be 80 characters or fewer");
  const timestamp = nowIso();
  const result = await queryRun(
    "INSERT INTO deck_folders (user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
    [toInt(userId), cleanedName, timestamp, timestamp]
  );
  return Number(result.lastInsertRowid);
}

export async function assignDeckFolder({ deckId, folderId, userId }) {
  const normalizedFolderId = folderId ? toInt(folderId) : null;
  if (normalizedFolderId) {
    const folder = await queryOne(
      "SELECT id FROM deck_folders WHERE id = ? AND user_id = ?",
      [normalizedFolderId, toInt(userId)]
    );
    if (!folder) throw new Error("Folder not found");
  }
  const result = await queryRun(
    "UPDATE decks SET folder_id = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    [normalizedFolderId, nowIso(), toInt(deckId), toInt(userId)]
  );
  if (Number(result.rowsAffected) === 0) throw new Error("Deck not found");
}

export async function deleteDeckFolder({ folderId, userId }) {
  return queryRun("DELETE FROM deck_folders WHERE id = ? AND user_id = ?", [
    toInt(folderId),
    toInt(userId),
  ]);
}

export async function getDeck(deckId, userId) {
  const now = nowIso();
  const row = await queryOne(
    `
    SELECT
      d.*,
      COUNT(c.id) AS card_count,
      COALESCE(SUM(CASE WHEN s.due_at <= ? THEN 1 ELSE 0 END), 0) AS due_count,
      COALESCE(SUM(CASE WHEN s.weak = 1 THEN 1 ELSE 0 END), 0) AS weak_count,
      COALESCE(SUM(s.correct_count), 0) AS correct_total,
      COALESCE(SUM(s.correct_count + s.incorrect_count), 0) AS review_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    LEFT JOIN study_stats s ON s.card_id = c.id
    WHERE d.id = ? AND d.user_id = ?
    GROUP BY d.id
  `,
    [now, toInt(deckId), toInt(userId)]
  );

  return row ? normalizeDeck(row) : null;
}

export async function getCards(deckId, userId) {
  return queryAll(
    `
    SELECT
      c.id,
      c.deck_id,
      c.term,
      c.definition,
      COALESCE(c.hint, '') AS hint,
      c.image_url AS imageUrl,
      c.image_public_id AS imagePublicId,
      c.image_alt AS imageAlt,
      c.created_at,
      c.updated_at,
      s.ease,
      s.interval_days,
      s.repetitions,
      s.lapses,
      s.due_at,
      s.last_reviewed_at,
      s.correct_count,
      s.incorrect_count,
      s.streak,
      s.best_streak,
      s.weak
    FROM cards c
    JOIN decks d ON d.id = c.deck_id
    JOIN study_stats s ON s.card_id = c.id
    WHERE c.deck_id = ? AND d.user_id = ?
    ORDER BY
      CASE WHEN s.due_at <= ? THEN 0 ELSE 1 END,
      s.weak DESC,
      (s.incorrect_count - s.correct_count) DESC,
      c.created_at ASC
  `,
    [toInt(deckId), toInt(userId), nowIso()]
  );
}

export async function getStudySnapshot(deckId, userId) {
  const cards = await getCards(deckId, userId);
  const now = nowIso();

  return cards.map((card) => {
    const attempts = card.correct_count + card.incorrect_count;
    const accuracy = attempts ? Math.round((card.correct_count / attempts) * 100) : 0;

    return {
      ...card,
      due: card.due_at <= now,
      weak: Boolean(card.weak),
      accuracy,
      attempts
    };
  });
}

export async function createDeck({ title, description = "", userId }) {
  const timestamp = nowIso();
  const result = await queryRun(
    "INSERT INTO decks (user_id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    [toInt(userId), title.trim(), description.trim(), timestamp, timestamp]
  );

  return Number(result.lastInsertRowid);
}

export async function updateDeck({ deckId, title, description = "", userId }) {
  const cleanedTitle = String(title || "").trim();
  const cleanedDescription = String(description || "").trim();
  if (!cleanedTitle) throw new Error("Deck title is required");
  if (cleanedTitle.length > 120) throw new Error("Deck titles must be 120 characters or fewer");

  const result = await queryRun(
    "UPDATE decks SET title = ?, description = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    [cleanedTitle, cleanedDescription, nowIso(), toInt(deckId), toInt(userId)]
  );
  if (Number(result.rowsAffected) === 0) throw new Error("Deck not found");
  return result.rowsAffected;
}

function cleanCardRows(cards) {
  return cards
    .map((card) => {
      const image = normalizeCardImage(card);
      return {
        term: String(card.term || "").trim(),
        definition: String(card.definition || "").trim(),
        hint: String(card.hint || "").trim(),
        ...image,
      };
    })
    .filter((card) => card.term && card.definition);
}

async function insertCards(transaction, deckId, cards, timestamp) {
  for (const row of cards) {
    const result = await transaction.execute({
      sql: `
        INSERT INTO cards (
          deck_id, term, definition, hint, image_url, image_public_id, image_alt, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        deckId,
        row.term,
        row.definition,
        row.hint,
        row.imageUrl,
        row.imagePublicId,
        row.imageAlt,
        timestamp,
        timestamp,
      ]
    });
    await transaction.execute({
      sql: "INSERT INTO study_stats (card_id, deck_id, due_at) VALUES (?, ?, ?)",
      args: [Number(result.lastInsertRowid), deckId, timestamp]
    });
  }
}

export async function createDeckWithCards({
  title,
  description = "",
  cards = [],
  userId
}) {
  await ensureReady();
  const timestamp = nowIso();
  const cleaned = cleanCardRows(cards);
  const transaction = await getClient().transaction("write");

  try {
    const result = await transaction.execute({
      sql: "INSERT INTO decks (user_id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      args: [toInt(userId), title.trim(), description.trim(), timestamp, timestamp]
    });
    const deckId = Number(result.lastInsertRowid);
    await insertCards(transaction, deckId, cleaned, timestamp);
    await transaction.commit();
    return deckId;
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    transaction.close();
  }
}

export async function touchDeck(deckId, userId) {
  await queryRun("UPDATE decks SET updated_at = ? WHERE id = ? AND user_id = ?", [
    nowIso(),
    toInt(deckId),
    toInt(userId)
  ]);
}

export async function addCards(deckId, cards, userId) {
  const cleaned = cleanCardRows(cards);

  if (cleaned.length === 0) return 0;
  await ensureReady();
  const id = toInt(deckId);
  const timestamp = nowIso();
  const transaction = await getClient().transaction("write");

  try {
    const ownedDeck = await transactionOne(
      transaction,
      "SELECT id FROM decks WHERE id = ? AND user_id = ?",
      [id, toInt(userId)]
    );
    if (!ownedDeck) throw new Error("Deck not found");

    await insertCards(transaction, id, cleaned, timestamp);
    await transaction.execute({
      sql: "UPDATE decks SET updated_at = ? WHERE id = ? AND user_id = ?",
      args: [timestamp, id, toInt(userId)]
    });
    await transaction.commit();
    return cleaned.length;
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    transaction.close();
  }
}

export async function updateCard({
  cardId,
  deckId,
  term,
  definition,
  hint,
  imageUrl,
  imagePublicId,
  imageAlt,
  userId
}) {
  const cleanedTerm = String(term || "").trim();
  const cleanedDefinition = String(definition || "").trim();

  if (!cleanedTerm || !cleanedDefinition) {
    throw new Error("Both term and definition are required");
  }
  const image = normalizeCardImage({ imageUrl, imagePublicId, imageAlt });

  const result = await queryRun(
    `
    UPDATE cards
    SET term = ?, definition = ?, hint = ?, image_url = ?, image_public_id = ?, image_alt = ?, updated_at = ?
    WHERE id = ? AND deck_id = ? AND EXISTS (
      SELECT 1 FROM decks WHERE decks.id = cards.deck_id AND decks.user_id = ?
    )
  `,
    [
      cleanedTerm,
      cleanedDefinition,
      String(hint || "").trim(),
      image.imageUrl,
      image.imagePublicId,
      image.imageAlt,
      nowIso(),
      toInt(cardId),
      toInt(deckId),
      toInt(userId)
    ]
  );

  if (result.rowsAffected > 0) {
    await touchDeck(deckId, userId);
  }

  return result.rowsAffected;
}

export async function deleteCard({ cardId, deckId, userId }) {
  await ensureReady();
  const transaction = await getClient().transaction("write");
  try {
    const result = await transaction.execute({
      sql:
    `
      DELETE FROM cards
      WHERE id = ? AND deck_id = ? AND EXISTS (
        SELECT 1 FROM decks WHERE decks.id = cards.deck_id AND decks.user_id = ?
      )
  `,
      args: [toInt(cardId), toInt(deckId), toInt(userId)]
    });
    if (result.rowsAffected > 0) {
      await transaction.execute({
        sql: "UPDATE decks SET updated_at = ? WHERE id = ? AND user_id = ?",
        args: [nowIso(), toInt(deckId), toInt(userId)]
      });
    }
    await transaction.commit();
    return result.rowsAffected;
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    transaction.close();
  }
}

export async function deleteDeck(deckId, userId) {
  return queryRun("DELETE FROM decks WHERE id = ? AND user_id = ?", [toInt(deckId), toInt(userId)]);
}

export async function getReviewTotals(userId) {
  const row = await queryOne(
    `
    SELECT
      COALESCE(SUM(study_stats.correct_count), 0) AS correct,
      COALESCE(SUM(study_stats.incorrect_count), 0) AS incorrect,
      COALESCE(MAX(study_stats.best_streak), 0) AS best_streak,
      COALESCE(SUM(CASE WHEN study_stats.weak = 1 THEN 1 ELSE 0 END), 0) AS weak_cards
    FROM study_stats
    JOIN decks d ON d.id = study_stats.deck_id
    WHERE d.user_id = ?
  `,
    [toInt(userId)]
  );

  const total = row.correct + row.incorrect;
  return {
    ...row,
    total,
    accuracy: total ? Math.round((row.correct / total) * 100) : 0
  };
}

export async function getRecentReviews(userId, limit = 12) {
  return queryAll(
    `
    SELECT r.*, c.term, d.title AS deck_title
    FROM review_logs r
    JOIN cards c ON c.id = r.card_id
    JOIN decks d ON d.id = r.deck_id
    WHERE d.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT ?
  `,
    [toInt(userId), limit]
  );
}

export async function getMotivationSummary(userId) {
  const activity = await queryAll(
    `SELECT substr(r.created_at, 1, 10) AS day, COUNT(*) AS reviews, COALESCE(SUM(r.correct), 0) AS correct
     FROM review_logs r JOIN decks d ON d.id = r.deck_id
     WHERE d.user_id = ? AND r.created_at >= datetime('now', '-365 days')
     GROUP BY substr(r.created_at, 1, 10) ORDER BY day`, [toInt(userId)]
  );
  const mastery = await queryAll(
    `SELECT d.id, d.title, COUNT(c.id) AS cards,
       COALESCE(SUM(CASE WHEN s.repetitions >= 3 AND s.correct_count >= 3 AND CAST(s.correct_count AS REAL) / MAX(1, s.correct_count + s.incorrect_count) >= .75 THEN 1 ELSE 0 END), 0) AS mastered
     FROM decks d LEFT JOIN cards c ON c.deck_id = d.id LEFT JOIN study_stats s ON s.card_id = c.id
     WHERE d.user_id = ? GROUP BY d.id ORDER BY d.updated_at DESC`, [toInt(userId)]
  );
  const activeDays = new Set(activity.map((row) => row.day));
  let streak = 0;
  const cursor = new Date();
  const today = cursor.toISOString().slice(0, 10);
  if (!activeDays.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (activeDays.has(cursor.toISOString().slice(0, 10))) { streak += 1; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  const weekStart = new Date(); weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  const weekly = activity.filter((row) => row.day >= weekStart.toISOString().slice(0, 10));
  return {
    activity,
    mastery: mastery.map((deck) => ({ ...deck, percent: deck.cards ? Math.round((deck.mastered / deck.cards) * 100) : 0 })),
    streak,
    todayReviews: Number(activity.find((row) => row.day === today)?.reviews || 0),
    weeklyReviews: weekly.reduce((sum, row) => sum + Number(row.reviews), 0),
    weeklyCorrect: weekly.reduce((sum, row) => sum + Number(row.correct), 0),
  };
}

export async function getBackupData(userId) {
  const decks = await getDecks(userId);
  return {
    format: "snoozelet-backup",
    version: 1,
    exportedAt: nowIso(),
    decks: await Promise.all(decks.map(async (deck) => ({
      title: deck.title,
      description: deck.description,
      cards: (await getCards(deck.id, userId)).map(({ term, definition, hint, imageUrl, imagePublicId, imageAlt }) => ({ term, definition, hint, imageUrl, imagePublicId, imageAlt })),
    }))),
  };
}

export async function getUserProgress(userId) {
  const id = toInt(userId);

  let progress = await queryOne(
    `
    SELECT *
    FROM user_progress
    WHERE user_id = ?
    `,
    [id]
  );

  if (!progress) {
    const timestamp = nowIso();

    await queryRun(
      `
      INSERT INTO user_progress (
        user_id,
        total_xp,
        created_at,
        updated_at
      )
      VALUES (?, 0, ?, ?)
      `,
      [id, timestamp, timestamp]
    );

    progress = {
      user_id: id,
      total_xp: 0,
      created_at: timestamp,
      updated_at: timestamp
    };
  }

  return {
    ...progress,
    ...levelFromXp(progress.total_xp)
  };
}

export async function awardXp(userId, amount) {
  const id = toInt(userId);
  const xp = Math.max(0, Number(amount) || 0);
  const timestamp = nowIso();

  if (xp === 0) {
    return getUserProgress(id);
  }

  await queryRun(
    `
    INSERT INTO user_progress (
      user_id,
      total_xp,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?)

    ON CONFLICT(user_id)
    DO UPDATE SET
      total_xp = user_progress.total_xp + excluded.total_xp,
      updated_at = excluded.updated_at
    `,
    [id, xp, timestamp, timestamp]
  );

  return getUserProgress(id);
}

async function transactionOne(transaction, sql, args = []) {
  const result = await transaction.execute({ sql, args });
  return result.rows[0] ? toPlainRow(result.rows[0]) : null;
}

function reviewResult({ cardId, correct, expected, dueAt, intervalDays, streak, weak, xpGained, progress, duplicate = false }) {
  return {
    cardId,
    correct: Boolean(correct),
    expected,
    due_at: dueAt,
    interval_days: intervalDays,
    streak,
    weak: Boolean(weak),
    xpGained,
    progress: {
      ...progress,
      ...levelFromXp(progress.total_xp),
    },
    duplicate,
  };
}

export async function recordReview(input) {
  const { userId: rawUserId, ...payload } = input || {};
  const review = validateReviewPayload(payload);
  const parsedUserId = Number(rawUserId);
  if (!Number.isSafeInteger(parsedUserId) || parsedUserId <= 0) {
    throw new ReviewRequestError("Invalid user", 401, "INVALID_USER");
  }

  await ensureReady();
  const transaction = await getClient().transaction("write");

  try {
    const userId = parsedUserId;
    const existing = await transactionOne(
      transaction,
      `
        SELECT r.card_id, r.mode, r.correct, r.expected, d.user_id, s.due_at, s.interval_days, s.streak, s.weak
        FROM review_logs r
        JOIN decks d ON d.id = r.deck_id
        JOIN study_stats s ON s.card_id = r.card_id
        WHERE r.attempt_id = ?
      `,
      [review.attemptId]
    );

    if (existing) {
      if (
        Number(existing.user_id) !== userId ||
        Number(existing.card_id) !== review.cardId ||
        existing.mode !== review.mode
      ) {
        throw new ReviewRequestError("Attempt identifier is already in use", 409, "ATTEMPT_CONFLICT");
      }

      const progress = await transactionOne(
        transaction,
        "SELECT * FROM user_progress WHERE user_id = ?",
        [userId]
      );
      await transaction.commit();
      return reviewResult({
        cardId: existing.card_id,
        correct: existing.correct,
        expected: existing.expected,
        dueAt: existing.due_at,
        intervalDays: existing.interval_days,
        streak: existing.streak,
        weak: existing.weak,
        xpGained: 0,
        progress: progress || { user_id: userId, total_xp: 0 },
        duplicate: true,
      });
    }

    const card = await transactionOne(
      transaction,
    `
      SELECT c.*
      FROM cards c
      JOIN decks d ON d.id = c.deck_id
      WHERE c.id = ? AND d.user_id = ?
    `,
      [toInt(review.cardId), userId]
    );
    if (!card) {
      throw new ReviewRequestError("Card not found", 404, "CARD_NOT_FOUND");
    }

    const stat = await transactionOne(
      transaction,
      "SELECT * FROM study_stats WHERE card_id = ?",
      [card.id]
    );
    if (!stat) {
      throw new Error("Study statistics are missing for the card");
    }

    const graded = gradeReview(card, review);
    const timestamp = nowIso();
    const wasCorrect = graded.correct ? 1 : 0;
  const {
    correctCount,
    dueAt,
    ease,
    incorrectCount,
    intervalDays,
    lapses,
    repetitions,
    streak,
    weak,
  } = calculateReviewSchedule(stat, {
    wasCorrect: Boolean(wasCorrect),
    mode: review.mode,
  });

    await transaction.execute({
      sql:
    `
    UPDATE study_stats
    SET
      ease = ?,
      interval_days = ?,
      repetitions = ?,
      lapses = ?,
      due_at = ?,
      last_reviewed_at = ?,
      correct_count = ?,
      incorrect_count = ?,
      streak = ?,
      best_streak = ?,
      weak = ?
    WHERE card_id = ?
      `,
      args: [
      ease,
      intervalDays,
      repetitions,
      lapses,
      dueAt.toISOString(),
      timestamp,
      correctCount,
      incorrectCount,
      streak,
      Math.max(stat.best_streak, streak),
      weak,
      card.id
      ],
    });

    await transaction.execute({
      sql: `
        INSERT INTO review_logs (
          card_id, deck_id, attempt_id, mode, answer, expected, correct, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        card.id,
        card.deck_id,
        review.attemptId,
        review.mode,
        review.answer,
        graded.expected,
        wasCorrect,
        timestamp,
      ],
    });

    await transaction.execute({
      sql: "UPDATE decks SET updated_at = ? WHERE id = ? AND user_id = ?",
      args: [timestamp, card.deck_id, userId],
    });

    const xpGained = xpForReview(review.mode, Boolean(wasCorrect));
    await transaction.execute({
      sql: `
        INSERT INTO user_progress (user_id, total_xp, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id)
        DO UPDATE SET
          total_xp = user_progress.total_xp + excluded.total_xp,
          updated_at = excluded.updated_at
      `,
      args: [userId, xpGained, timestamp, timestamp],
    });

    const progress = await transactionOne(
      transaction,
      "SELECT * FROM user_progress WHERE user_id = ?",
      [userId]
    );

    await transaction.commit();
    return reviewResult({
      cardId: card.id,
      correct: wasCorrect,
      expected: graded.expected,
      dueAt: dueAt.toISOString(),
      intervalDays,
      streak,
      weak,
      xpGained,
      progress,
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    transaction.close();
  }
}
