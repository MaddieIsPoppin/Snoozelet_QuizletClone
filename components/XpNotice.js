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
    </div>
  );
}