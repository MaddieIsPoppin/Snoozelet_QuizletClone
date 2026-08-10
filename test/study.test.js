import test from "node:test";
import assert from "node:assert/strict";

import {
  createTestPlan,
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
