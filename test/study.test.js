import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceStudyQueue,
  createTestPlan,
  generateTestQuestions,
  isStudyAnswerCorrect,
  makeMultipleChoiceOptions,
  makeTrueFalseQuestion,
  normalizeTestTypes,
  selectLearnCards,
} from "../lib/study.js";

test("targeted Learn includes due, weak, and unstudied cards in snapshot order", () => {
  const cards = [
    { id: 1, due: true, weak: false, attempts: 4 },
    { id: 2, due: false, weak: true, attempts: 3 },
    { id: 3, due: false, weak: false, attempts: 0 },
    { id: 4, due: false, weak: false, attempts: 5 },
  ];

  assert.deepEqual(selectLearnCards(cards, "targeted").map(({ id }) => id), [
    1, 2, 3,
  ]);
  assert.deepEqual(selectLearnCards(cards, "all").map(({ id }) => id), [
    1, 2, 3, 4,
  ]);
});

test("test type configuration accepts the route spelling and rejects unknown types", () => {
  assert.deepEqual(
    normalizeTestTypes(["typed", "true-false", "unknown", "typed"]),
    ["typed", "truefalse"]
  );
});

test("test plans respect question count and enabled question types", () => {
  const cards = Array.from({ length: 6 }, (_, index) => ({ id: index + 1 }));
  const plan = createTestPlan(cards, 4, ["multiple", "true-false"], () => 0.5);

  assert.equal(plan.length, 4);
  assert.deepEqual(plan.map(({ type }) => type), [
    "multiple",
    "truefalse",
    "multiple",
    "truefalse",
  ]);
  assert.equal(new Set(plan.map(({ card }) => card.id)).size, 4);
});

test("test plans generate no questions when no valid type is enabled", () => {
  assert.deepEqual(createTestPlan([{ id: 1 }], 1, ["unsupported"]), []);
});

test("multiple-choice options contain one correct answer and unique distractors", () => {
  const cards = [
    { id: 1, term: "A", definition: "One" },
    { id: 2, term: "B", definition: "Two" },
    { id: 3, term: "C", definition: "Four" },
    { id: 4, term: "D", definition: "Three" },
  ];
  const options = makeMultipleChoiceOptions(cards[0], cards, "definition", () => 0);

  assert.equal(options.filter((option) => option === "One").length, 1);
  assert.equal(new Set(options).size, options.length);
});

test("true/false generation is deterministic and direction-aware with injected randomness", () => {
  const cards = [
    { id: 1, term: "A", definition: "One" },
    { id: 2, term: "B", definition: "Two" },
  ];

  assert.deepEqual(makeTrueFalseQuestion(cards[0], cards, "definition", () => 0.9), {
    displayedAnswer: "One",
    correctValue: "True",
  });
  assert.deepEqual(makeTrueFalseQuestion(cards[0], cards, "term", () => 0), {
    displayedAnswer: "B",
    correctValue: "False",
  });
});

test("generated tests include configured question details", () => {
  const cards = [
    { id: 1, term: "A", definition: "One" },
    { id: 2, term: "B", definition: "Two" },
    { id: 3, term: "C", definition: "Three" },
  ];
  const questions = generateTestQuestions(
    cards,
    3,
    ["multiple", "true-false", "typed"],
    "definition",
    () => 0.9
  );

  assert.deepEqual(questions.map(({ type }) => type), ["multiple", "truefalse", "typed"]);
  assert.ok(questions[0].options.includes(questions[0].card.definition));
  assert.equal(questions[1].displayedAnswer, questions[1].card.definition);
});

test("Learn queue progression requeues misses and completes after a correct retry", () => {
  const card = { id: 1 };
  const missed = advanceStudyQueue({
    queue: [card], currentIndex: 0, wasCorrect: false, requeueMissed: true,
  });
  assert.deepEqual(missed, {
    queue: [card, card], currentIndex: 1, complete: false,
    correctDelta: 0, missedDelta: 1,
  });

  const retried = advanceStudyQueue({
    queue: missed.queue, currentIndex: missed.currentIndex,
    wasCorrect: true, requeueMissed: true,
  });
  assert.equal(retried.complete, true);
  assert.equal(retried.correctDelta, 1);
});

test("extracted study grading preserves existing client strictness behavior", () => {
  assert.equal(isStudyAnswerCorrect("  ANSWER ", "answer", "strict"), true);
  assert.equal(isStudyAnswerCorrect("answers", "answer", "lenient"), true);
  assert.equal(isStudyAnswerCorrect("", "answer", "lenient"), false);
});
