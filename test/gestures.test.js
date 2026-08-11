import test from "node:test";
import assert from "node:assert/strict";
import { horizontalSwipe } from "../lib/gestures.js";

test("recognizes deliberate horizontal flashcard swipes", () => {
  assert.equal(horizontalSwipe({ startX: 10, startY: 20, endX: 100, endY: 28 }), "right");
  assert.equal(horizontalSwipe({ startX: 100, startY: 20, endX: 20, endY: 25 }), "left");
});

test("leaves taps and vertical scrolling untouched", () => {
  assert.equal(horizontalSwipe({ startX: 10, startY: 20, endX: 40, endY: 22 }), null);
  assert.equal(horizontalSwipe({ startX: 40, startY: 20, endX: 90, endY: 110 }), null);
});
