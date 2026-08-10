import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const databasePath = path.join(os.tmpdir(), `snoozelet-test-${randomUUID()}.sqlite`);
process.env.STUDY_DB_PATH = databasePath;
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
delete process.env.LIBSQL_DATABASE_URL;
delete process.env.LIBSQL_AUTH_TOKEN;

const db = await import(`../lib/db.js?test=${randomUUID()}`);

async function createUser(username) {
  const result = await db.queryRun(
    "INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
    [username, "test-hash", "test-salt", new Date().toISOString()]
  );
  return Number(result.lastInsertRowid);
}

function reviewFor(cardId, overrides = {}) {
  return {
    attemptId: randomUUID(),
    cardId,
    mode: "typed",
    answer: "Produces ATP",
    answerDirection: "definition",
    grading: "lenient",
    ...overrides,
  };
}

test("database integration", async (suite) => {
  const ownerId = await createUser("database-owner");
  const otherUserId = await createUser("database-other");
  const deckId = await db.createDeck({
    userId: ownerId,
    title: "Owned deck",
    description: "Integration test deck",
  });

  await suite.test("enforces user ownership when reading and adding cards", async () => {
    assert.equal((await db.getDeck(deckId, ownerId)).title, "Owned deck");
    assert.equal(await db.getDeck(deckId, otherUserId), null);

    await assert.rejects(
      db.addCards(deckId, [{ term: "Intruder", definition: "Must not be added" }], otherUserId),
      /Deck not found/
    );

    assert.deepEqual(await db.getCards(deckId, otherUserId), []);
  });

  await suite.test("creates cards with matching study-stat relationships", async () => {
    assert.equal(
      await db.addCards(
        deckId,
        [
          { term: "Mitochondria", definition: "Produces ATP" },
          { term: "Nucleus", definition: "Stores DNA" },
        ],
        ownerId
      ),
      2
    );

    const cards = await db.getCards(deckId, ownerId);
    assert.equal(cards.length, 2);

    for (const card of cards) {
      const stat = await db.queryOne(
        "SELECT card_id, deck_id, repetitions, correct_count, incorrect_count FROM study_stats WHERE card_id = ?",
        [card.id]
      );
      assert.equal(Number(stat.card_id), Number(card.id));
      assert.equal(Number(stat.deck_id), deckId);
      assert.equal(Number(stat.repetitions), 0);
      assert.equal(Number(stat.correct_count), 0);
      assert.equal(Number(stat.incorrect_count), 0);
    }
  });

  await suite.test("returns plain serializable rows without libSQL array descriptors", async () => {
    const [row] = await db.queryAll(
      "SELECT ? AS text_value, ? AS number_value, NULL AS null_value",
      ["preserved", 42]
    );

    assert.equal(Object.getPrototypeOf(row), Object.prototype);
    assert.deepEqual(Object.getOwnPropertyNames(row), [
      "text_value",
      "number_value",
      "null_value",
    ]);
    assert.deepEqual(row, {
      text_value: "preserved",
      number_value: 42,
      null_value: null,
    });

    const cards = await db.getCards(deckId, ownerId);
    assert.ok(cards.every((card) => Object.getPrototypeOf(card) === Object.prototype));
    assert.ok(cards.every((card) => !Object.hasOwn(card, "length")));
  });

  await suite.test("records reviews and preserves current XP and scheduler calculations", async () => {
    const [card] = await db.getCards(deckId, ownerId);

    const first = await db.recordReview({
      ...reviewFor(card.id),
      userId: ownerId,
    });

    assert.equal(first.correct, true);
    assert.equal(Number(first.interval_days), 1);
    assert.equal(Number(first.streak), 1);
    assert.equal(first.weak, false);
    assert.equal(Number(first.xpGained), 15);
    assert.equal(Number(first.progress.totalXp), 15);

    const second = await db.recordReview({
      ...reviewFor(card.id, { mode: "multiple" }),
      userId: ownerId,
    });

    assert.equal(Number(second.interval_days), 3);
    assert.equal(Number(second.streak), 2);
    assert.equal(Number(second.xpGained), 10);
    assert.equal(Number(second.progress.totalXp), 25);

    const beforeIncorrect = Date.now();
    const third = await db.recordReview({
      ...reviewFor(card.id, { answer: "Wrong" }),
      userId: ownerId,
    });
    const dueTime = Date.parse(third.due_at);

    assert.equal(Number(third.interval_days), 0);
    assert.equal(Number(third.streak), 0);
    assert.equal(third.weak, true);
    assert.equal(Number(third.xpGained), 0);
    assert.ok(dueTime >= beforeIncorrect + 9 * 60 * 1000);
    assert.ok(dueTime <= Date.now() + 11 * 60 * 1000);

    const stat = await db.queryOne("SELECT * FROM study_stats WHERE card_id = ?", [card.id]);
    assert.equal(Number(stat.correct_count), 2);
    assert.equal(Number(stat.incorrect_count), 1);
    assert.equal(Number(stat.repetitions), 0);
    assert.equal(Number(stat.lapses), 1);

    const logs = await db.queryAll(
      "SELECT mode, correct FROM review_logs WHERE card_id = ? ORDER BY id",
      [card.id]
    );
    assert.deepEqual(
      logs.map((row) => ({ mode: row.mode, correct: Number(row.correct) })),
      [
        { mode: "typed", correct: 1 },
        { mode: "multiple", correct: 1 },
        { mode: "typed", correct: 0 },
      ]
    );
  });

  await suite.test("rejects review recording for a non-owner", async () => {
    const [card] = await db.getCards(deckId, ownerId);
    await assert.rejects(
      db.recordReview({
        ...reviewFor(card.id),
        userId: otherUserId,
      }),
      /Card not found/
    );
  });

  await suite.test("grades answers on the server and awards no XP for a wrong answer", async () => {
    const card = (await db.getCards(deckId, ownerId)).find((item) => item.term === "Nucleus");
    const before = await db.getUserProgress(ownerId);

    const forged = await db.recordReview({
      ...reviewFor(card.id, {
        answer: "Definitely not the answer",
      }),
      userId: ownerId,
    });

    assert.equal(forged.correct, false);
    assert.equal(Number(forged.xpGained), 0);
    assert.equal(Number(forged.progress.totalXp), Number(before.totalXp));
  });

  await suite.test("treats flashcards as explicit self-assessment", async () => {
    const card = (await db.getCards(deckId, ownerId)).find((item) => item.term === "Nucleus");
    const result = await db.recordReview({
      ...reviewFor(card.id, {
        mode: "flashcard",
        answer: "Got it",
        selfAssessedCorrect: true,
      }),
      userId: ownerId,
    });

    assert.equal(result.correct, true);
    assert.equal(Number(result.xpGained), 5);
  });

  await suite.test("deduplicates attempts and awards XP only once", async () => {
    const card = (await db.getCards(deckId, ownerId)).find((item) => item.term === "Nucleus");
    const attempt = reviewFor(card.id, { answer: "Stores DNA" });
    const first = await db.recordReview({ ...attempt, userId: ownerId });
    const duplicate = await db.recordReview({ ...attempt, userId: ownerId });

    assert.equal(first.duplicate, false);
    assert.equal(Number(first.xpGained), 15);
    assert.equal(duplicate.duplicate, true);
    assert.equal(Number(duplicate.xpGained), 0);
    assert.equal(Number(duplicate.progress.totalXp), Number(first.progress.totalXp));

    const logs = await db.queryOne(
      "SELECT COUNT(*) AS count FROM review_logs WHERE attempt_id = ?",
      [attempt.attemptId]
    );
    assert.equal(Number(logs.count), 1);

    await assert.rejects(
      db.recordReview({
        ...attempt,
        cardId: card.id + 1,
        userId: ownerId,
      }),
      (error) => error.status === 409 && error.code === "ATTEMPT_CONFLICT"
    );
  });

  await suite.test("rolls back stats, logs, deck activity, and XP when a review write fails", async () => {
    const card = (await db.getCards(deckId, ownerId)).find((item) => item.term === "Nucleus");
    const statBefore = await db.queryOne("SELECT * FROM study_stats WHERE card_id = ?", [card.id]);
    const deckBefore = await db.queryOne("SELECT updated_at FROM decks WHERE id = ?", [deckId]);
    const progressBefore = await db.getUserProgress(ownerId);
    const logCountBefore = await db.queryOne(
      "SELECT COUNT(*) AS count FROM review_logs WHERE card_id = ?",
      [card.id]
    );

    await db.queryRun(`
      CREATE TRIGGER fail_review_insert
      BEFORE INSERT ON review_logs
      BEGIN
        SELECT RAISE(ABORT, 'forced rollback');
      END
    `);

    try {
      await assert.rejects(
        db.recordReview({
          ...reviewFor(card.id, { answer: "Stores DNA" }),
          userId: ownerId,
        }),
        /forced rollback/
      );
    } finally {
      await db.queryRun("DROP TRIGGER fail_review_insert");
    }

    const statAfter = await db.queryOne("SELECT * FROM study_stats WHERE card_id = ?", [card.id]);
    const deckAfter = await db.queryOne("SELECT updated_at FROM decks WHERE id = ?", [deckId]);
    const progressAfter = await db.getUserProgress(ownerId);
    const logCountAfter = await db.queryOne(
      "SELECT COUNT(*) AS count FROM review_logs WHERE card_id = ?",
      [card.id]
    );

    assert.equal(Number(statAfter.correct_count), Number(statBefore.correct_count));
    assert.equal(Number(statAfter.incorrect_count), Number(statBefore.incorrect_count));
    assert.equal(statAfter.due_at, statBefore.due_at);
    assert.equal(deckAfter.updated_at, deckBefore.updated_at);
    assert.equal(Number(progressAfter.totalXp), Number(progressBefore.totalXp));
    assert.equal(Number(logCountAfter.count), Number(logCountBefore.count));
  });

  await suite.test("deleting a card removes its stats and review logs", async () => {
    const cards = await db.getCards(deckId, ownerId);
    const reviewedCard = cards.find((card) => card.term === "Mitochondria");

    assert.equal(
      await db.deleteCard({ cardId: reviewedCard.id, deckId, userId: ownerId }),
      1
    );
    assert.equal(await db.queryOne("SELECT id FROM cards WHERE id = ?", [reviewedCard.id]), null);
    assert.equal(
      await db.queryOne("SELECT card_id FROM study_stats WHERE card_id = ?", [reviewedCard.id]),
      null
    );
    assert.equal(
      await db.queryOne("SELECT id FROM review_logs WHERE card_id = ?", [reviewedCard.id]),
      null
    );
  });

  await suite.test("deleting a deck removes its remaining card relationships", async () => {
    const remainingCards = await db.getCards(deckId, ownerId);
    assert.equal(remainingCards.length, 1);

    const result = await db.deleteDeck(deckId, ownerId);
    assert.equal(Number(result.rowsAffected), 1);
    assert.equal(await db.getDeck(deckId, ownerId), null);
    assert.equal(await db.queryOne("SELECT id FROM cards WHERE deck_id = ?", [deckId]), null);
    assert.equal(await db.queryOne("SELECT card_id FROM study_stats WHERE deck_id = ?", [deckId]), null);
    assert.equal(await db.queryOne("SELECT id FROM review_logs WHERE deck_id = ?", [deckId]), null);
  });
});
