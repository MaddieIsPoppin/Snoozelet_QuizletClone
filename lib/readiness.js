export function calculateReadiness(cards = []) {
  if (!cards.length) return { score: 0, mastered: 0, label: "Not started", minutes: 5 };
  const mastered = cards.filter((card) => card.repetitions >= 3 && card.accuracy >= 75 && !card.weak).length;
  const confidence = cards.reduce((sum, card) => sum + Math.min(100, card.accuracy || 0), 0) / cards.length;
  const duePenalty = cards.filter((card) => card.due).length / cards.length * 22;
  const weakPenalty = cards.filter((card) => card.weak).length / cards.length * 18;
  const score = Math.max(0, Math.min(100, Math.round(confidence * .65 + (mastered / cards.length * 100) * .35 - duePenalty - weakPenalty)));
  return { score, mastered, label: score >= 85 ? "Exam ready" : score >= 65 ? "Building confidence" : score >= 35 ? "In progress" : "Needs a first pass", minutes: Math.max(5, Math.min(30, Math.ceil((cards.filter((card) => card.due || card.weak || !card.attempts).length * 35) / 60))) };
}
