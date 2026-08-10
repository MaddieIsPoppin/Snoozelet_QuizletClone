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

  await suite.test("records reviews and preserves current XP and scheduler calculations", async () => {
    const [card] = await db.getCards(deckId, ownerId);

    const first = await db.recordReview({
      cardId: card.id,
      mode: "typed",
      answer: "Produces ATP",
      expected: "Produces ATP",
      correct: true,
      userId: ownerId,
    });

    assert.equal(first.correct, true);
    assert.equal(Number(first.interval_days), 1);
    assert.equal(Number(first.streak), 1);
    assert.equal(first.weak, false);
    assert.equal(Number(first.xpGained), 15);
    assert.equal(Number(first.progress.totalXp), 15);

    const second = await db.recordReview({
      cardId: card.id,
      mode: "multiple",
      answer: "Produces ATP",
      expected: "Produces ATP",
      correct: true,
      userId: ownerId,
    });

    assert.equal(Number(second.interval_days), 3);
    assert.equal(Number(second.streak), 2);
    assert.equal(Number(second.xpGained), 10);
    assert.equal(Number(second.progress.totalXp), 25);

    const beforeIncorrect = Date.now();
    const third = await db.recordReview({
      cardId: card.id,
      mode: "typed",
      answer: "Wrong",
      expected: "Produces ATP",
      correct: false,
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
        cardId: card.id,
        mode: "typed",
        answer: "Produces ATP",
        expected: "Produces ATP",
        correct: true,
        userId: otherUserId,
      }),
      /Card not found/
    );
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
