import { createClient } from "@libsql/client";
import { isLocalDatabase, queryAll, queryOne } from "./db.js";

const remoteUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL;
const remoteToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

const insertedId = (result) => Number(result.lastInsertRowid);

export async function syncLocalUserToCloud(userId) {
  if (!isLocalDatabase()) throw new Error("Cloud publishing is only available from the local Windows database.");
  if (!remoteUrl || !remoteToken || remoteUrl.startsWith("file:")) throw new Error("Turso sync is not configured in .env.local.");

  const localUser = await queryOne("SELECT * FROM users WHERE id = ?", [Number(userId)]);
  if (!localUser) throw new Error("Local user not found.");

  const [subjects, folders, decks, cards, stats, reviews, progress, goals, resources] = await Promise.all([
    queryAll("SELECT * FROM subjects WHERE user_id = ? ORDER BY id", [userId]),
    queryAll("SELECT * FROM deck_folders WHERE user_id = ? ORDER BY id", [userId]),
    queryAll("SELECT * FROM decks WHERE user_id = ? ORDER BY id", [userId]),
    queryAll("SELECT c.* FROM cards c JOIN decks d ON d.id = c.deck_id WHERE d.user_id = ? ORDER BY c.id", [userId]),
    queryAll("SELECT s.* FROM study_stats s JOIN decks d ON d.id = s.deck_id WHERE d.user_id = ? ORDER BY s.card_id", [userId]),
    queryAll("SELECT r.* FROM review_logs r JOIN decks d ON d.id = r.deck_id WHERE d.user_id = ? ORDER BY r.id", [userId]),
    queryOne("SELECT * FROM user_progress WHERE user_id = ?", [userId]),
    queryAll("SELECT * FROM learning_goals WHERE user_id = ? ORDER BY id", [userId]),
    queryAll("SELECT * FROM resource_links WHERE user_id = ? ORDER BY id", [userId]),
  ]);

  const remote = createClient({ url: remoteUrl, authToken: remoteToken });
  try {
    let remoteUser = await remote.execute({ sql: "SELECT id FROM users WHERE username = ? COLLATE NOCASE", args: [localUser.username] });
    let cloudUserId;
    if (remoteUser.rows.length) {
      cloudUserId = Number(remoteUser.rows[0].id);
    } else {
      const created = await remote.execute({
        sql: "INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
        args: [localUser.username, localUser.password_hash, localUser.salt, localUser.created_at],
      });
      cloudUserId = insertedId(created);
    }

    const transaction = await remote.transaction("write");
    try {
      await transaction.execute({ sql: "DELETE FROM resource_links WHERE user_id = ?", args: [cloudUserId] });
      await transaction.execute({ sql: "DELETE FROM learning_goals WHERE user_id = ?", args: [cloudUserId] });
      await transaction.execute({ sql: "DELETE FROM decks WHERE user_id = ?", args: [cloudUserId] });
      await transaction.execute({ sql: "DELETE FROM deck_folders WHERE user_id = ?", args: [cloudUserId] });
      await transaction.execute({ sql: "DELETE FROM subjects WHERE user_id = ?", args: [cloudUserId] });
      await transaction.execute({ sql: "DELETE FROM user_progress WHERE user_id = ?", args: [cloudUserId] });

      const subjectIds = new Map();
      for (const row of subjects) {
        const result = await transaction.execute({ sql: "INSERT INTO subjects (user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", args: [cloudUserId, row.name, row.description, row.created_at, row.updated_at] });
        subjectIds.set(Number(row.id), insertedId(result));
      }
      const folderIds = new Map();
      for (const row of folders) {
        const result = await transaction.execute({ sql: "INSERT INTO deck_folders (user_id, subject_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", args: [cloudUserId, row.subject_id ? subjectIds.get(Number(row.subject_id)) : null, row.name, row.created_at, row.updated_at] });
        folderIds.set(Number(row.id), insertedId(result));
      }
      const deckIds = new Map();
      for (const row of decks) {
        const result = await transaction.execute({ sql: "INSERT INTO decks (user_id, folder_id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)", args: [cloudUserId, row.folder_id ? folderIds.get(Number(row.folder_id)) : null, row.title, row.description, row.created_at, row.updated_at] });
        deckIds.set(Number(row.id), insertedId(result));
      }
      const cardIds = new Map();
      for (const row of cards) {
        const result = await transaction.execute({ sql: "INSERT INTO cards (deck_id, term, definition, hint, image_url, image_public_id, image_alt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [deckIds.get(Number(row.deck_id)), row.term, row.definition, row.hint, row.image_url, row.image_public_id, row.image_alt, row.created_at, row.updated_at] });
        cardIds.set(Number(row.id), insertedId(result));
      }
      for (const row of stats) await transaction.execute({ sql: "INSERT INTO study_stats (card_id, deck_id, ease, interval_days, repetitions, lapses, due_at, last_reviewed_at, correct_count, incorrect_count, streak, best_streak, weak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [cardIds.get(Number(row.card_id)), deckIds.get(Number(row.deck_id)), row.ease, row.interval_days, row.repetitions, row.lapses, row.due_at, row.last_reviewed_at, row.correct_count, row.incorrect_count, row.streak, row.best_streak, row.weak] });
      for (const row of reviews) await transaction.execute({ sql: "INSERT INTO review_logs (card_id, deck_id, attempt_id, session_id, mode, answer, expected, correct, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [cardIds.get(Number(row.card_id)), deckIds.get(Number(row.deck_id)), row.attempt_id, row.session_id, row.mode, row.answer, row.expected, row.correct, row.created_at] });
      if (progress) await transaction.execute({ sql: "INSERT INTO user_progress (user_id, total_xp, created_at, updated_at) VALUES (?, ?, ?, ?)", args: [cloudUserId, progress.total_xp, progress.created_at, progress.updated_at] });
      for (const row of goals) await transaction.execute({ sql: "INSERT INTO learning_goals (user_id, deck_id, title, exam_date, daily_minutes, created_at) VALUES (?, ?, ?, ?, ?, ?)", args: [cloudUserId, deckIds.get(Number(row.deck_id)), row.title, row.exam_date, row.daily_minutes, row.created_at] });
      for (const row of resources) await transaction.execute({ sql: "INSERT INTO resource_links (user_id, subject_id, folder_id, title, url, type, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", args: [cloudUserId, row.subject_id ? subjectIds.get(Number(row.subject_id)) : null, row.folder_id ? folderIds.get(Number(row.folder_id)) : null, row.title, row.url, row.type, row.description, row.created_at] });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      transaction.close();
    }
    return { decks: decks.length, cards: cards.length, reviews: reviews.length, syncedAt: new Date().toISOString() };
  } finally {
    remote.close();
  }
}
