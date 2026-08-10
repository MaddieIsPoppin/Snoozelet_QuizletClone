import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import {
  gradeReview,
  parseReviewRequest,
  ReviewRequestError,
  validateReviewPayload,
} from "../lib/review.js";

function validPayload(overrides = {}) {
  return {
    attemptId: randomUUID(),
    cardId: 42,
    mode: "typed",
    answer: "Produces ATP",
    answerDirection: "definition",
    grading: "lenient",
    ...overrides,
  };
}

function assertInvalid(payload, pattern) {
  assert.throws(
    () => validateReviewPayload(payload),
    (error) =>
      error instanceof ReviewRequestError &&
      error.status === 400 &&
      pattern.test(error.message)
  );
}

test("rejects malformed JSON review requests", async () => {
  const request = new Request("http://localhost/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not-json",
  });

  await assert.rejects(
    parseReviewRequest(request),
    (error) =>
      error instanceof ReviewRequestError &&
      error.status === 400 &&
      error.message === "Malformed JSON request"
  );
});

test("validates required fields and identifiers", () => {
  assertInvalid({}, /attemptId/);
  assertInvalid(validPayload({ attemptId: "not-a-uuid" }), /attemptId/);
  assertInvalid(validPayload({ cardId: 0 }), /cardId/);
  assertInvalid(validPayload({ cardId: "42" }), /cardId/);
  assertInvalid(validPayload({ answer: undefined }), /answer/);
  assertInvalid(validPayload({ answerDirection: "sideways" }), /answer direction/);
});

test("requires real booleans for flashcard self-assessment", () => {
  assertInvalid(
    validPayload({
      mode: "flashcard",
      answer: "Got it",
      selfAssessedCorrect: "true",
    }),
    /must be a boolean/
  );

  const parsed = validateReviewPayload(
    validPayload({
      mode: "flashcard",
      answer: "Got it",
      selfAssessedCorrect: false,
    })
  );
  assert.equal(parsed.selfAssessedCorrect, false);
});

test("rejects invalid modes, grading levels, oversized answers, and unexpected fields", () => {
  assertInvalid(validPayload({ mode: "admin-xp" }), /Invalid review mode/);
  assertInvalid(validPayload({ grading: "anything-goes" }), /Invalid grading level/);
  assertInvalid(validPayload({ answer: "x".repeat(2001) }), /2000 characters/);
  assertInvalid(validPayload({ correct: true }), /Unexpected field: correct/);
  assertInvalid(validPayload({ expected: "Forged answer" }), /Unexpected field: expected/);
});

test("server-side typed grading derives the expected answer from the card", () => {
  const card = { term: "Mitochondria", definition: "Produces ATP" };
  const forged = gradeReview(card, validPayload({ answer: "Wrong", correct: true }));
  const correct = gradeReview(card, validPayload({ answer: "produces atp" }));

  assert.deepEqual(forged, {
    correct: false,
    score: 0,
    method: "protected-token-mismatch",
    expected: "Produces ATP",
    assessment: "objective",
  });
  assert.equal(correct.correct, true);
});

test("server-authoritative grading accepts conceptual paraphrases but ignores forged correctness", () => {
  const card = {
    term: "Atomicity",
    definition: "Atomicity ensures that a transaction completes entirely or not at all.",
  };
  const paraphrase = gradeReview(
    card,
    validPayload({
      answer: "Atomicity means the entire transaction must happen, otherwise none of it happens.",
      correct: false,
    })
  );
  const forged = gradeReview(
    card,
    validPayload({ answer: "Atomicity makes transactions execute faster.", correct: true })
  );

  assert.equal(paraphrase.correct, true);
  assert.equal(paraphrase.method, "concept-similarity");
  assert.equal(forged.correct, false);
});

test("server-side grading respects answer direction and canonical grading levels", () => {
  const card = { term: "The nucleus", definition: "Stores DNA" };

  assert.equal(
    gradeReview(
      card,
      validPayload({
        answer: "nucleus",
        answerDirection: "term",
        grading: "flexible",
      })
    ).correct,
    true
  );
  assert.equal(
    gradeReview(
      card,
      validPayload({
        answer: "nucleus",
        answerDirection: "term",
        grading: "strict",
      })
    ).correct,
    false
  );
});

test("true/false grading validates the presented answer against the owned card", () => {
  const card = { term: "Nucleus", definition: "Stores DNA" };
  const trueStatement = validateReviewPayload(
    validPayload({
      mode: "test-truefalse",
      answer: "True",
      presentedAnswer: "stores dna",
    })
  );
  const falseStatement = validateReviewPayload(
    validPayload({
      mode: "test-truefalse",
      answer: "False",
      presentedAnswer: "Produces ATP",
    })
  );

  assert.equal(gradeReview(card, trueStatement).correct, true);
  assert.equal(gradeReview(card, falseStatement).correct, true);
  assertInvalid(
    validPayload({
      mode: "test-truefalse",
      answer: "Maybe",
      presentedAnswer: "Stores DNA",
    }),
    /must be True or False/
  );
});
