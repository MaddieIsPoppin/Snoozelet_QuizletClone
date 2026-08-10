"use client";

import { useState } from "react";
import SnoozeMascot from "@/components/SnoozeMascot";

export default function MascotCoach({ messages, mood = "happy", compact = false }) {
  const safeMessages = messages?.length ? messages : ["You have got this!"];
  const [index, setIndex] = useState(0);

  return (
    <button
      className={`mascot-coach${compact ? " compact" : ""}`}
      type="button"
      onClick={() => setIndex((current) => (current + 1) % safeMessages.length)}
      aria-label="Ask Snoo for another study tip"
    >
      <SnoozeMascot variant="coach" mood={mood} />
      <span>
        <strong>Snoo says</strong>
        {safeMessages[index]}
        {safeMessages.length > 1 ? <small>Tap me for another tip</small> : null}
      </span>
    </button>
  );
}
