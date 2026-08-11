import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateReviewSchedule,
  flowMultiplierForCombo,
  levelFromXp,
  xpForReview,
} from "../lib/progress.js";

const stat = {
  correct_count: 2,
  incorrect_count: 0,
  ease: 2.5,
  interval_days: 3,
  repetitions: 2,
  lapses: 0,
  streak: 2,
};

test("XP awards preserve mode values and award nothing for incorrect reviews", () => {
  assert.equal(xpForReview("flashcard", true), 5);
  assert.equal(xpForReview("test-typed", true), 15);
  assert.equal(xpForReview("test-truefalse", true), 8);
  assert.equal(xpForReview("typed", false), 0);
});

test("Flow multipliers rise at the promised combo thresholds", () => {
  assert.equal(flowMultiplierForCombo(4), 1);
  assert.equal(flowMultiplierForCombo(5), 1.2);
  assert.equal(flowMultiplierForCombo(8), 1.5);
  assert.equal(flowMultiplierForCombo(12), 2);
});

test("level progress preserves threshold and post-threshold behavior", () => {
  assert.deepEqual(levelFromXp(250), {
    level: 3, totalXp: 250, currentLevelXp: 0,
    xpForNextLevel: 200, xpUntilNextLevel: 200,
  });
  assert.equal(levelFromXp(9700).level, 16);
});

test("correct review scheduling advances the interval and clears a strong card", () => {
  const result = calculateReviewSchedule(stat, {
    wasCorrect: true,
    mode: "typed",
    now: new Date("2026-01-01T12:00:00.000Z"),
  });

  assert.equal(result.ease, 2.58);
  assert.equal(result.intervalDays, 8);
  assert.equal(result.streak, 3);
  assert.equal(result.weak, 0);
  assert.equal(result.dueAt.toISOString(), "2026-01-09T12:00:00.000Z");
});

test("incorrect review scheduling resets progress and schedules a ten-minute retry", () => {
  const result = calculateReviewSchedule(stat, {
    wasCorrect: false,
    mode: "multiple",
    now: new Date("2026-01-01T12:00:00.000Z"),
  });

  assert.equal(result.ease, 2.26);
  assert.equal(result.intervalDays, 0);
  assert.equal(result.repetitions, 0);
  assert.equal(result.lapses, 1);
  assert.equal(result.weak, 1);
  assert.equal(result.dueAt.toISOString(), "2026-01-01T12:10:00.000Z");
});
