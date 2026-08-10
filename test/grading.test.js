import assert from "node:assert/strict";
import test from "node:test";

import {
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

test("lenient grading permits only the existing small-typo tolerance", () => {
  assert.equal(isTypedCorrect("mitocondria", "mitochondria", "lenient"), true);
  assert.equal(isTypedCorrect("mitocondria", "mitochondria", "flexible"), false);
  assert.equal(isTypedCorrect("cat", "bat", "lenient"), false);
  assert.equal(isTypedCorrect("completely wrong", "mitochondria", "lenient"), false);
});

test("the three documented grading choices remain available", () => {
  assert.deepEqual(
    gradingOptions.map(({ value }) => value),
    ["strict", "flexible", "lenient"]
  );
});
