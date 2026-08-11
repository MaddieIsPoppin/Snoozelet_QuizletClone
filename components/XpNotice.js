"use client";

import { useEffect } from "react";

export default function XpNotice({ notice }) {
  useEffect(() => {
    if (!notice || document.documentElement.dataset.sounds === "false") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.setValueAtTime(520, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(760, context.currentTime + .12);
    gain.gain.setValueAtTime(.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .16);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .16);
    oscillator.onended = () => context.close();
  }, [notice]);
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
