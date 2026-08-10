import { shuffle } from "./collections.js";
export { shuffle } from "./collections.js";

const TEST_TYPE_ALIASES = {
  multiple: "multiple",
  typed: "typed",
  truefalse: "truefalse",
  "true-false": "truefalse",
};

export function normalizeAnswer(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeFlexibleAnswer(value) {
  return normalizeAnswer(value)
    .replace(/&/g, "and")
    .replace(/[.,/#!$%^*;:{}=\-_`~()?'"[\]\\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function answerForDirection(card, answerDirection) {
  return answerDirection === "definition" ? card.definition : card.term;
}

export function promptForDirection(card, answerDirection) {
  return answerDirection === "definition" ? card.term : card.definition;
}

function significantWords(value) {
  return new Set(normalizeFlexibleAnswer(value).split(" ").filter((word) => word.length > 3));
}

function distractorSimilarity(card, candidate, answerDirection) {
  const promptWords = significantWords(promptForDirection(card, answerDirection));
  const candidatePromptWords = significantWords(promptForDirection(candidate, answerDirection));
  const candidateAnswerWords = significantWords(answerForDirection(candidate, answerDirection));
  let score = 0;
  promptWords.forEach((word) => {
    if (candidatePromptWords.has(word)) score += 3;
    if (candidateAnswerWords.has(word)) score += 1;
  });
  return score;
}

export function makeMultipleChoiceOptions(
  card,
  cards,
  answerDirection,
  random = Math.random
) {
  const correct = answerForDirection(card, answerDirection);
  const alternatives = cards
    .filter((item) => item.id !== card.id)
    .filter((item) => normalizeAnswer(answerForDirection(item, answerDirection)) !== normalizeAnswer(correct))
    .map((item) => ({
      value: answerForDirection(item, answerDirection),
      score: distractorSimilarity(card, item, answerDirection),
      tieBreaker: random(),
    }))
    .sort((a, b) => b.score - a.score || a.tieBreaker - b.tieBreaker)
    .map(({ value }) => value);

  return shuffle([correct, ...alternatives.slice(0, 3)], random);
}

export function makeTrueFalseQuestion(
  card,
  cards,
  answerDirection,
  random = Math.random
) {
  const correctAnswer = answerForDirection(card, answerDirection);

  if (random() >= 0.5 || cards.length < 2) {
    return { displayedAnswer: correctAnswer, correctValue: "True" };
  }

  const alternatives = cards
    .filter((item) => item.id !== card.id)
    .map((item) => ({ item, score: distractorSimilarity(card, item, answerDirection), tieBreaker: random() }))
    .sort((a, b) => b.score - a.score || a.tieBreaker - b.tieBreaker);
  const randomCard = alternatives[0].item;
  return {
    displayedAnswer: answerForDirection(randomCard, answerDirection),
    correctValue: "False",
  };
}

export function questionTypeLabel(type) {
  if (type === "multiple") return "Multiple choice";
  if (type === "typed") return "Written";
  if (type === "truefalse" || type === "true-false") return "True / False";
  if (type === "flashcard") return "Flashcard";
  return type;
}

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

  const shuffledCards = shuffle(cards, random);

  const requestedCount = Number(count);
  const questionCount = Number.isFinite(requestedCount) && requestedCount > 0
    ? Math.min(Math.floor(requestedCount), cards.length)
    : cards.length;

  return shuffledCards.slice(0, questionCount).map((card, index) => ({
    card,
    type: enabledTypes[index % enabledTypes.length],
  }));
}

export function generateTestQuestions(
  cards,
  count,
  types,
  answerDirection,
  random = Math.random
) {
  return createTestPlan(cards, count, types, random).map(({ card, type }, index) => {
    if (type === "multiple") {
      return {
        id: `${card.id}-${index}`,
        card,
        type,
        options: makeMultipleChoiceOptions(card, cards, answerDirection, random),
      };
    }

    if (type === "truefalse") {
      return {
        id: `${card.id}-${index}`,
        card,
        type,
        ...makeTrueFalseQuestion(card, cards, answerDirection, random),
      };
    }

    return { id: `${card.id}-${index}`, card, type: "typed" };
  });
}

export function advanceStudyQueue({ queue, currentIndex, wasCorrect, requeueMissed }) {
  const card = queue[currentIndex];
  if (!card) return null;

  const nextQueue = !wasCorrect && requeueMissed ? [...queue, card] : queue;
  const nextIndex = currentIndex + 1;

  return {
    queue: nextQueue,
    currentIndex: nextIndex,
    complete: nextIndex >= nextQueue.length,
    correctDelta: wasCorrect ? 1 : 0,
    missedDelta: wasCorrect ? 0 : 1,
  };
}
