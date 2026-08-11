import assert from "node:assert/strict";
import test from "node:test";
import { calculateReadiness } from "../lib/readiness.js";

test("readiness starts small and recommends a short first session", () => {
  assert.deepEqual(calculateReadiness([]), { score: 0, mastered: 0, label: "Not started", minutes: 5 });
  const result = calculateReadiness([{ repetitions: 0, accuracy: 0, weak: false, due: true, attempts: 0 }]);
  assert.equal(result.score, 0);
  assert.equal(result.minutes, 5);
});

test("readiness rewards demonstrated mastery", () => {
  const result = calculateReadiness(Array.from({ length: 6 }, () => ({ repetitions: 4, accuracy: 100, weak: false, due: false, attempts: 5 })));
  assert.equal(result.score, 100);
  assert.equal(result.mastered, 6);
  assert.equal(result.label, "Exam ready");
});
