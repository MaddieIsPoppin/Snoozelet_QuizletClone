const modeRoutes = new Set(["learn", "flashcards", "multiple-choice", "recall", "test", "match", "blast"]);

export function routeForReviewMode(mode) {
  const normalized = String(mode || "").toLowerCase().replaceAll("_", "-");
  if (normalized === "multiple" || normalized === "choice") return "multiple-choice";
  if (normalized === "flashcard") return "flashcards";
  if (normalized === "typed") return "recall";
  return modeRoutes.has(normalized) ? normalized : "learn";
}

export function recentDeckActivity(reviews, decks, limit = 5) {
  const deckMap = new Map(decks.map((deck) => [String(deck.id), deck]));
  const seen = new Set();
  const result = [];
  for (const review of reviews) {
    const key = String(review.deck_id);
    const deck = deckMap.get(key);
    if (!deck || seen.has(key)) continue;
    seen.add(key);
    result.push({ ...deck, last_mode: routeForReviewMode(review.mode), last_studied: review.created_at });
    if (result.length >= limit) break;
  }
  return result;
}

export function dueDecks(decks, limit = 5) {
  return decks.filter((deck) => Number(deck.due_count) > 0)
    .sort((a, b) => Number(b.due_count) - Number(a.due_count) || String(a.title).localeCompare(String(b.title)))
    .slice(0, limit);
}
