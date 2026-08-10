const TEST_TYPE_ALIASES = {
  multiple: "multiple",
  typed: "typed",
  truefalse: "truefalse",
  "true-false": "truefalse",
};

export function selectLearnCards(cards, scope = "targeted") {
  if (scope === "all") {
    return [...cards];
  }

  return cards.filter(
    (card) => card.due || card.weak || Number(card.attempts) === 0
  );
}

export function normalizeTestTypes(types) {
  const requested = Array.isArray(types) ? types : types ? [types] : [];

  return [
    ...new Set(requested.map((type) => TEST_TYPE_ALIASES[type]).filter(Boolean)),
  ];
}

export function createTestPlan(cards, count, types, random = Math.random) {
  const enabledTypes = normalizeTestTypes(types);

  if (enabledTypes.length === 0) {
    return [];
  }

  const shuffledCards = [...cards];

  for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffledCards[index], shuffledCards[swapIndex]] = [
      shuffledCards[swapIndex],
      shuffledCards[index],
    ];
  }

  const requestedCount = Number(count);
  const questionCount = Number.isFinite(requestedCount) && requestedCount > 0
    ? Math.min(Math.floor(requestedCount), cards.length)
    : cards.length;

  return shuffledCards.slice(0, questionCount).map((card, index) => ({
    card,
    type: enabledTypes[index % enabledTypes.length],
  }));
}
