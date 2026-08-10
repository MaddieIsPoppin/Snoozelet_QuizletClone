const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "because", "been", "being",
  "by", "can", "does", "for", "from", "has", "have", "in", "is", "it",
  "its", "makes", "means", "must", "of", "on", "or", "that", "the",
  "their", "then", "this", "to", "was", "were", "which", "with",
]);

const CONCEPT_ALIASES = new Map(
  [
    ["database", ["database", "databases", "db"]],
    ["transaction", ["transaction", "transactions"]],
    ["completion", [
      "complete", "completes", "completed", "completing", "happen", "happens",
      "happened", "occur", "occurs", "occurred", "execute", "executes", "executed",
    ]],
    ["entirety", ["all", "entire", "entirely", "whole", "wholly"]],
    ["negation", ["neither", "never", "no", "none", "not", "nothing"]],
    ["logical", ["conceptual", "logical"]],
    ["work", ["operation", "operations", "task", "tasks", "work"]],
  ].flatMap(([concept, words]) => words.map((word) => [word, concept]))
);

function baseNormalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function stripParentheticalDetails(value) {
  return value.replace(/\s*[\(\[\{][^)\]\}]*[\)\]\}]\s*/g, " ");
}

function stripLeadingArticle(value) {
  return value.replace(/^(the|a|an)\s+/u, "");
}

function flexibleNormalize(value) {
  return stripLeadingArticle(baseNormalize(stripParentheticalDetails(value)))
    .replace(/&/g, " and ")
    .replace(/[-\u2013\u2014_]/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(left, right) {
  if (left === right) return 0;
  if (!left) return right.length;
  if (!right) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + cost
      );
    }
    for (let column = 0; column <= right.length; column += 1) {
      previous[column] = current[column];
    }
  }

  return previous[right.length];
}

function closeEnough(response, target) {
  if (response.length < 5 || target.length < 5) return false;
  const distance = editDistance(response, target);
  const longest = Math.max(response.length, target.length);
  return distance <= (longest >= 18 ? 2 : 1);
}

function stem(token) {
  if (token.length > 5 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 6 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 5 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 5 && token.endsWith("ly")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function canonicalToken(token) {
  return CONCEPT_ALIASES.get(token) || CONCEPT_ALIASES.get(stem(token)) || stem(token);
}

function contentTokens(value) {
  return flexibleNormalize(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token))
    .map((token) => ({ raw: token, value: canonicalToken(token) }));
}

function tokenWeight(token) {
  if (/^\d+(?:[.,]\d+)?$/u.test(token.raw)) return 2.5;
  if (token.raw.length <= 5 && /^[a-z]+$/u.test(token.raw)) return 1;
  return token.raw.length >= 8 ? 1.4 : 1;
}

function isProtectedToken(rawExpected, token) {
  const originalWords = String(rawExpected).match(/[\p{L}\p{N}.]+/gu) || [];
  return (
    /^\d+(?:[.,]\d+)?$/u.test(token.raw) ||
    originalWords.some(
      (word) => word.length >= 2 && word === word.toUpperCase() && baseNormalize(word) === token.raw
    )
  );
}

function hasProtectedTokenMismatch(answer, expected) {
  const expectedTokens = contentTokens(expected);
  const responseTokens = contentTokens(answer);

  return expectedTokens.some(
    (expectedToken) =>
      isProtectedToken(expected, expectedToken) &&
      !responseTokens.some((responseToken) => responseToken.raw === expectedToken.raw)
  );
}

function tokensMatch(expected, response, protectedToken) {
  if (expected.value === response.value) return true;
  if (protectedToken) return false;
  return closeEnough(expected.value, response.value);
}

function conceptSimilarity(answer, expected) {
  const expectedTokens = contentTokens(expected);
  const responseTokens = contentTokens(answer);
  if (expectedTokens.length < 3 || responseTokens.length === 0) return null;

  const expectedHasNegation = expectedTokens.some(({ value }) => value === "negation");
  const responseHasNegation = responseTokens.some(({ value }) => value === "negation");
  if (expectedHasNegation !== responseHasNegation) {
    return { correct: false, score: 0, method: "concept-similarity" };
  }

  const usedResponses = new Set();
  let matchedExpectedWeight = 0;
  let matchedResponseWeight = 0;
  const expectedWeight = expectedTokens.reduce((total, token) => total + tokenWeight(token), 0);
  const responseWeight = responseTokens.reduce((total, token) => total + tokenWeight(token), 0);
  let missingProtectedToken = false;

  for (const expectedToken of expectedTokens) {
    const protectedToken = isProtectedToken(expected, expectedToken);
    const responseIndex = responseTokens.findIndex(
      (responseToken, index) =>
        !usedResponses.has(index) && tokensMatch(expectedToken, responseToken, protectedToken)
    );

    if (responseIndex === -1) {
      if (protectedToken) missingProtectedToken = true;
      continue;
    }

    usedResponses.add(responseIndex);
    matchedExpectedWeight += tokenWeight(expectedToken);
    matchedResponseWeight += tokenWeight(responseTokens[responseIndex]);
  }

  const coverage = expectedWeight ? matchedExpectedWeight / expectedWeight : 0;
  const precision = responseWeight ? matchedResponseWeight / responseWeight : 0;
  const score = 0.7 * coverage + 0.3 * precision;
  const longAnswer = expectedTokens.length >= 5 || flexibleNormalize(expected).length >= 50;
  const minimumCoverage = longAnswer ? 0.7 : 0.8;
  const minimumPrecision = longAnswer ? 0.5 : 0.6;
  const minimumScore = longAnswer ? 0.68 : 0.74;

  return {
    correct:
      !missingProtectedToken &&
      coverage >= minimumCoverage &&
      precision >= minimumPrecision &&
      score >= minimumScore,
    score: Number(score.toFixed(3)),
    method: "concept-similarity",
  };
}

export function normalizeForGrading(value, strictness) {
  if (strictness === "strict") return baseNormalize(value);
  return flexibleNormalize(value);
}

export function gradeTypedAnswer(answer, expected, strictness = "flexible") {
  const rawAnswer = String(answer || "").trim();
  const rawExpected = String(expected || "").trim();
  if (!rawAnswer || !rawExpected) return { correct: false, score: 0, method: "empty" };
  if (rawAnswer === rawExpected) return { correct: true, score: 1, method: "exact" };

  const response = normalizeForGrading(answer, strictness);
  const target = normalizeForGrading(expected, strictness);
  if (response === target) return { correct: true, score: 1, method: "normalized" };
  if (strictness !== "lenient") return { correct: false, score: 0, method: "incorrect" };
  if (hasProtectedTokenMismatch(answer, expected)) {
    return { correct: false, score: 0, method: "protected-token-mismatch" };
  }

  if (closeEnough(response, target)) {
    const longest = Math.max(response.length, target.length);
    return {
      correct: true,
      score: Number((1 - editDistance(response, target) / longest).toFixed(3)),
      method: "typo-tolerant",
    };
  }

  return conceptSimilarity(answer, expected) || { correct: false, score: 0, method: "incorrect" };
}

export function isTypedCorrect(answer, expected, strictness = "flexible") {
  return gradeTypedAnswer(answer, expected, strictness).correct;
}

export const gradingOptions = [
  {
    value: "strict",
    label: "Strict",
    description: "Ignores capitalization, accents, and extra spaces."
  },
  {
    value: "flexible",
    label: "Flexible",
    description: "Also ignores leading articles, punctuation, dashes, parentheses, and & versus and."
  },
  {
    value: "lenient",
    label: "Lenient",
    description: "Also allows small typos and equivalent wording in longer conceptual answers."
  }
];
