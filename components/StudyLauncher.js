"use client";

import Link from "next/link";
import { useState } from "react";

const modes = [
  { id: "multiple-choice", icon: "A", name: "Multiple choice", description: "Choose between related answers from your deck." },
  { id: "learn", icon: "◎", name: "Learn", description: "A guided mix that adapts as you answer.", recommended: true },
  { id: "flashcards", icon: "▱", name: "Flashcards", description: "Flip through cards and rate your recall." },
  { id: "test", icon: "✓", name: "Practice test", description: "Build a mixed test and see your score." },
  { id: "match", icon: "◇", name: "Match", description: "Pair terms and definitions in a quick visual challenge." },
  { id: "blast", icon: "✦", name: "Blast", description: "Answer rapidly, build a combo, and charge the telescope." },
];

export default function StudyLauncher({ decks }) {
  const [deckId, setDeckId] = useState(String(decks[0]?.id || ""));
  const [mode, setMode] = useState("learn");
  const deck = decks.find((item) => String(item.id) === deckId);

  if (!deck) return <div className="workspace-empty"><strong>No decks available</strong><p>Create a deck before starting a study session.</p><Link className="button primary" href="/decks/new">Create your first deck</Link></div>;

  return (
    <section className="launcher-card">
      <div className="launcher-step">
        <span className="step-number">1</span>
        <div><h2>Which deck do you want to study?</h2><p>Choose the subject you want to work on.</p></div>
      </div>
      <div className="deck-choice-grid">
        {decks.map((item) => <button type="button" className={deckId === String(item.id) ? "selected" : ""} onClick={() => setDeckId(String(item.id))} key={item.id}><span className="deck-choice-icon">▤</span><span><strong>{item.title}</strong><small>{item.card_count} cards · {item.due_count} due</small></span><b>{deckId === String(item.id) ? "✓" : ""}</b></button>)}
      </div>

      <div className="launcher-divider" />
      <div className="launcher-step">
        <span className="step-number">2</span>
        <div><h2>How would you like to study?</h2><p>You can change methods whenever you return here.</p></div>
      </div>
      <div className="activity-choice-grid">
        {modes.map((item) => <button type="button" className={mode === item.id ? "selected" : ""} onClick={() => setMode(item.id)} key={item.id}><span className="activity-choice-icon">{item.icon}</span><span><strong>{item.name}{item.recommended ? <em>Recommended</em> : null}</strong><small>{item.description}</small></span><b>{mode === item.id ? "✓" : ""}</b></button>)}
      </div>
      <div className="launcher-footer"><div><strong>{deck.title}</strong><span>{modes.find((item) => item.id === mode)?.name}</span></div><Link className="button primary launcher-start" href={`/decks/${deck.id}/${mode}`}>Start studying →</Link></div>
    </section>
  );
}
