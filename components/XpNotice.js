"use client";

export default function XpNotice({ notice }) {
  if (!notice) {
    return null;
  }

  return (
    <div className="xp-earned-popup">
      <strong>+{notice.amount} XP</strong>

      {notice.totalXp !== undefined ? (
        <span>
          {notice.totalXp} total XP · Level {notice.level}
        </span>
      ) : null}
      {notice.multiplier > 1 ? <span>Flow bonus: {notice.multiplier.toFixed(1)}×</span> : null}
      {notice.bonusXp > 0 ? <span>Victory bonus: +{notice.bonusXp} XP</span> : null}
    </div>
  );
}
