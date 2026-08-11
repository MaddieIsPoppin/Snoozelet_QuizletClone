const XP_BY_MODE = {
  flashcard: 5,
  multiple: 10,
  "test-multiple": 10,
  typed: 15,
  "test-typed": 15,
  "true-false": 8,
  truefalse: 8,
  "test-truefalse": 8,
  "test-true-false": 8,
};

export function xpForReview(mode, correct) {
  return correct ? XP_BY_MODE[mode] || 5 : 0;
}

export function flowMultiplierForCombo(combo) {
  const value = Math.max(0, Number(combo) || 0);
  if (value >= 12) return 2;
  if (value >= 8) return 1.5;
  if (value >= 5) return 1.2;
  return 1;
}

export function levelFromXp(totalXp) {
  const xp = Math.max(0, Number(totalXp) || 0);
  const thresholds = [
    0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 4900,
    5900, 7000, 8200,
  ];
  let level = 1;

  for (let index = 0; index < thresholds.length; index += 1) {
    if (xp >= thresholds[index]) level = index + 1;
    else break;
  }

  if (level >= thresholds.length) {
    level += Math.floor((xp - thresholds[thresholds.length - 1]) / 1500);
  }

  const currentLevelStart = level <= thresholds.length
    ? thresholds[level - 1]
    : thresholds[thresholds.length - 1] + (level - thresholds.length) * 1500;
  const nextLevelXp = level < thresholds.length
    ? thresholds[level]
    : currentLevelStart + 1500;

  return {
    level,
    totalXp: xp,
    currentLevelXp: xp - currentLevelStart,
    xpForNextLevel: nextLevelXp - currentLevelStart,
    xpUntilNextLevel: Math.max(0, nextLevelXp - xp),
  };
}

export function calculateReviewSchedule(stat, { wasCorrect, mode, now = new Date() }) {
  const attempts = stat.correct_count + stat.incorrect_count + 1;
  const correctCount = stat.correct_count + Number(wasCorrect);
  const incorrectCount = stat.incorrect_count + (wasCorrect ? 0 : 1);
  const accuracy = correctCount / attempts;
  let ease = stat.ease;
  let intervalDays = stat.interval_days;
  let repetitions = stat.repetitions;
  let lapses = stat.lapses;
  let streak = stat.streak;

  if (wasCorrect) {
    repetitions += 1;
    streak += 1;
    ease = Math.min(3.2, ease + (mode === "typed" ? 0.08 : 0.04));
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 3;
    else intervalDays = Math.max(4, Math.round(intervalDays * ease));
  } else {
    repetitions = 0;
    streak = 0;
    lapses += 1;
    intervalDays = 0;
    ease = Math.max(1.3, ease - 0.24);
  }

  const dueAt = new Date(now);
  if (wasCorrect) dueAt.setDate(dueAt.getDate() + intervalDays);
  else dueAt.setMinutes(dueAt.getMinutes() + 10);

  const weak = wasCorrect && streak >= 3 && accuracy >= 0.75
    ? 0
    : Number(!wasCorrect || accuracy < 0.7 || lapses > 0);

  return {
    accuracy,
    correctCount,
    dueAt,
    ease,
    incorrectCount,
    intervalDays,
    lapses,
    repetitions,
    streak,
    weak,
  };
}
