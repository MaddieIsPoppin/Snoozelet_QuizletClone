import assert from "node:assert/strict";
import test from "node:test";

import {
  gradeTypedAnswer,
  gradingOptions,
  isTypedCorrect,
  normalizeForGrading,
} from "../lib/grading.js";

test("strict grading normalizes case, whitespace, and accents", () => {
  assert.equal(normalizeForGrading("  ESTACIÓN   CENTRAL  ", "strict"), "estacion central");
  assert.equal(isTypedCorrect("  Cell   Membrane ", "cell membrane", "strict"), true);
  assert.equal(isTypedCorrect("the nucleus", "nucleus", "strict"), false);
});

test("flexible grading ignores articles, parenthetical details, punctuation, and ampersands", () => {
  assert.equal(
    normalizeForGrading("The actor-observer bias (psychology)", "flexible"),
    "actor observer bias"
  );
  assert.equal(isTypedCorrect("salt & water", "Salt and water", "flexible"), true);
  assert.equal(isTypedCorrect("a mitochondrion", "mitochondrion", "flexible"), true);
});

test("lenient grading preserves the existing small-typo tolerance", () => {
  assert.equal(isTypedCorrect("mitocondria", "mitochondria", "lenient"), true);
  assert.equal(isTypedCorrect("mitocondria", "mitochondria", "flexible"), false);
  assert.equal(isTypedCorrect("cat", "bat", "lenient"), false);
  assert.equal(isTypedCorrect("completely wrong", "mitochondria", "lenient"), false);
});

test("grading results expose deterministic score and method metadata", () => {
  assert.deepEqual(gradeTypedAnswer("Atomicity", "Atomicity", "lenient"), {
    correct: true,
    score: 1,
    method: "exact",
  });
  assert.equal(gradeTypedAnswer("atomicity", "Atomicity", "lenient").method, "normalized");
  assert.equal(gradeTypedAnswer("mitocondria", "mitochondria", "lenient").method, "typo-tolerant");
});

test("normalization handles punctuation, accents, whitespace, articles, and parenthetical details", () => {
  assert.equal(isTypedCorrect("  résumé!!! ", "Resume", "flexible"), true);
  assert.equal(
    isTypedCorrect("The actor observer bias", "actor-observer bias (psychology)", "flexible"),
    true
  );
});

test("short factual, technical, acronym, and numeric answers remain protected", () => {
  assert.equal(isTypedCorrect("UDP", "TCP", "lenient"), false);
  assert.equal(isTypedCorrect("TC", "TCP", "lenient"), false);
  assert.equal(isTypedCorrect("atomicity", "Atomicity", "lenient"), true);
  assert.equal(isTypedCorrect("41", "42", "lenient"), false);
  assert.equal(isTypedCorrect("4", "5", "lenient"), false);
  assert.equal(isTypedCorrect("cat", "bat", "lenient"), false);
  assert.equal(
    isTypedCorrect("The HTTP status code is 500", "The HTTP status code is 404", "lenient"),
    false
  );
});

test("long conceptual answers tolerate reordered equivalent wording", () => {
  assert.equal(
    isTypedCorrect(
      "A transaction is a logical unit of work in a database.",
      "A transaction is a logical unit of database work.",
      "lenient"
    ),
    true
  );
  assert.equal(
    isTypedCorrect(
      "Atomicity means the entire transaction must happen, otherwise none of it happens.",
      "Atomicity ensures that a transaction completes entirely or not at all.",
      "lenient"
    ),
    true
  );
  assert.equal(
    isTypedCorrect(
      "Light energy is changed into stored chemical energy during photosynthesis.",
      "Photosynthesis converts light energy into chemical energy.",
      "lenient"
    ),
    true
  );
});

test("concept grading rejects missing concepts, generic wording, and similar contradictions", () => {
  const expected = "Atomicity ensures that a transaction completes entirely or not at all.";
  assert.equal(isTypedCorrect("Atomicity makes transactions execute faster.", expected, "lenient"), false);
  assert.equal(isTypedCorrect("A transaction completes partially.", expected, "lenient"), false);
  assert.equal(isTypedCorrect("The is a and of to in.", expected, "lenient"), false);
  assert.equal(
    isTypedCorrect(
      "A transaction is a unit of work.",
      "A transaction is a logical unit of database work.",
      "lenient"
    ),
    false
  );
});

test("strict and flexible modes do not enable conceptual similarity", () => {
  const expected = "A transaction is a logical unit of database work.";
  const reordered = "A transaction is a logical unit of work in a database.";
  assert.equal(isTypedCorrect(reordered, expected, "strict"), false);
  assert.equal(isTypedCorrect(reordered, expected, "flexible"), false);
});

test("the three documented grading choices remain available", () => {
  assert.deepEqual(
    gradingOptions.map(({ value }) => value),
    ["strict", "flexible", "lenient"]
  );
});
