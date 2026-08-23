import test from "node:test";
import assert from "node:assert/strict";
import { dueDecks, recentDeckActivity, routeForReviewMode } from "../lib/study-dashboard.js";

test("review modes map to valid study routes", () => {
  assert.equal(routeForReviewMode("multiple"), "multiple-choice");
  assert.equal(routeForReviewMode("flashcard"), "flashcards");
  assert.equal(routeForReviewMode("unknown"), "learn");
});

test("recent activity is unique, ordered, and uses real review timestamps", () => {
  const decks=[{id:1,title:"One"},{id:2,title:"Two"}];
  const reviews=[{deck_id:2,mode:"blast",created_at:"2026-08-23T10:00:00Z"},{deck_id:2,mode:"learn",created_at:"2026-08-22T10:00:00Z"},{deck_id:1,mode:"flashcard",created_at:"2026-08-21T10:00:00Z"}];
  assert.deepEqual(recentDeckActivity(reviews,decks).map(item=>[item.id,item.last_mode,item.last_studied]),[[2,"blast","2026-08-23T10:00:00Z"],[1,"flashcards","2026-08-21T10:00:00Z"]]);
});

test("due decks ignore zero counts and rank the largest counts first",()=>{
  const result=dueDecks([{id:1,title:"A",due_count:0},{id:2,title:"B",due_count:3},{id:3,title:"C",due_count:8}],2);
  assert.deepEqual(result.map(item=>item.id),[3,2]);
});
