import { gradeTypedAnswer, normalizeForGrading } from "./grading.js";

export const REVIEW_MODES = new Set([
  "flashcard",
  "multiple",
  "typed",
  "true-false",
  "truefalse",
  "test-multiple",
  "test-typed",
  "test-true-false",
  "test-truefalse",
]);

const GRADING_LEVELS = new Set(["strict", "flexible", "lenient"]);
const ANSWER_DIRECTIONS = new Set(["definition", "term"]);
const TRUE_FALSE_MODES = new Set([
  "true-false",
  "truefalse",
  "test-true-false",
  "test-truefalse",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ANSWER_LENGTH = 2000;
const ALLOWED_FIELDS = new Set([
  "attemptId",
  "sessionId",
  "cardId",
  "mode",
  "answer",
  "answerDirection",
  "grading",
  "presentedAnswer",
  "selfAssessedCorrect",
]);

export class ReviewRequestError extends Error {
  constructor(message, status = 400, code = "INVALID_REVIEW") {
    super(message);
    this.name = "ReviewRequestError";
    this.status = status;
    this.code = code;
  }
}

function requireBoundedString(value, field, { allowEmpty = false } = {}) {
  if (typeof value !== "string") {
    throw new ReviewRequestError(`${field} must be a string`);
  }

  const cleaned = value.trim();
  if (!allowEmpty && !cleaned) {
    throw new ReviewRequestError(`${field} is required`);
  }
  if (value.length > MAX_ANSWER_LENGTH) {
    throw new ReviewRequestError(`${field} must be ${MAX_ANSWER_LENGTH} characters or fewer`);
  }
  return value;
}

export function validateReviewPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ReviewRequestError("Request body must be a JSON object");
  }

  const unknownField = Object.keys(body).find((field) => !ALLOWED_FIELDS.has(field));
  if (unknownField) {
    throw new ReviewRequestError(`Unexpected field: ${unknownField}`);
  }

  if (typeof body.attemptId !== "string" || !UUID_PATTERN.test(body.attemptId)) {
    throw new ReviewRequestError("attemptId must be a valid UUID");
  }
  if (body.sessionId !== undefined && (typeof body.sessionId !== "string" || !UUID_PATTERN.test(body.sessionId))) {
    throw new ReviewRequestError("sessionId must be a valid UUID");
  }

  if (!Number.isSafeInteger(body.cardId) || body.cardId <= 0) {
    throw new ReviewRequestError("cardId must be a positive integer");
  }

  if (typeof body.mode !== "string" || !REVIEW_MODES.has(body.mode)) {
    throw new ReviewRequestError("Invalid review mode");
  }

  if (!ANSWER_DIRECTIONS.has(body.answerDirection)) {
    throw new ReviewRequestError("Invalid answer direction");
  }

  const answer = requireBoundedString(body.answer, "answer", {
    allowEmpty: body.mode === "flashcard",
  });

  if (body.mode === "flashcard") {
    if (typeof body.selfAssessedCorrect !== "boolean") {
      throw new ReviewRequestError("selfAssessedCorrect must be a boolean");
    }
  } else if (body.selfAssessedCorrect !== undefined) {
    throw new ReviewRequestError("selfAssessedCorrect is only valid for flashcards");
  }

  const grading = body.grading ?? "lenient";
  if (!GRADING_LEVELS.has(grading)) {
    throw new ReviewRequestError("Invalid grading level");
  }

  let presentedAnswer;
  if (TRUE_FALSE_MODES.has(body.mode)) {
    presentedAnswer = requireBoundedString(body.presentedAnswer, "presentedAnswer");
    if (!/^(true|false)$/i.test(answer.trim())) {
      throw new ReviewRequestError("True/false answers must be True or False");
    }
  } else if (body.presentedAnswer !== undefined) {
    throw new ReviewRequestError("presentedAnswer is only valid for true/false reviews");
  }

  return {
    attemptId: body.attemptId.toLowerCase(),
    sessionId: typeof body.sessionId === "string" && UUID_PATTERN.test(body.sessionId)
      ? body.sessionId.toLowerCase()
      : body.attemptId.toLowerCase(),
    cardId: body.cardId,
    mode: body.mode,
    answer,
    answerDirection: body.answerDirection,
    grading,
    presentedAnswer,
    selfAssessedCorrect: body.selfAssessedCorrect,
  };
}

export async function parseReviewRequest(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ReviewRequestError("Malformed JSON request");
  }
  return validateReviewPayload(body);
}

export function gradeReview(card, review) {
  const expected =
    review.answerDirection === "definition" ? card.definition : card.term;

  if (review.mode === "flashcard") {
    return {
      correct: review.selfAssessedCorrect,
      expected,
      assessment: "self",
    };
  }

  if (TRUE_FALSE_MODES.has(review.mode)) {
    const displayedIsCorrect =
      normalizeForGrading(review.presentedAnswer, "flexible") ===
      normalizeForGrading(expected, "flexible");
    const expectedChoice = displayedIsCorrect ? "True" : "False";

    return {
      correct: review.answer.trim().toLowerCase() === expectedChoice.toLowerCase(),
      expected: expectedChoice,
      assessment: "objective",
    };
  }

  const strictness = review.mode.includes("typed") ? review.grading : "flexible";
  const result = gradeTypedAnswer(review.answer, expected, strictness);
  return {
    ...result,
    expected,
    assessment: "objective",
  };
}
