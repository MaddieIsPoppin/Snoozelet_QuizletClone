"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const modes = [
  { id: "multiple-choice", icon: "A", name: "Multiple choice", description: "Choose between related answers." },
  { id: "learn", icon: "◎", name: "Learn", description: "Guided, adaptive practice.", recommended: true },
  { id: "flashcards", icon: "▱", name: "Flashcards", description: "Flip and rate your recall." },
  { id: "recall", icon: "↑", name: "Deep Recall", description: "Hard retrieval with missed cards repeated." },
  { id: "test", icon: "✓", name: "Practice test", description: "Build a mixed test." },
  { id: "match", icon: "◇", name: "Match", description: "Pair terms and definitions." },
  { id: "blast", icon: "✦", name: "Blast", description: "Fast retrieval under time pressure." },
];

export default function StudyLauncher({ decks, folders, subjects, purpose = "study", scope = "all" }) {
  const organised = decks.filter((deck) => deck.folder_id && deck.subject_id);
  const firstModule = subjects.find((subject) => organised.some((deck) => String(deck.subject_id) === String(subject.id)));
  const [subjectId, setSubjectId] = useState(String(firstModule?.id || ""));
  const availableUnits = useMemo(
    () => folders.filter((unit) => String(unit.subject_id) === subjectId && organised.some((deck) => String(deck.folder_id) === String(unit.id))),
    [folders, organised, subjectId]
  );
  const [unitId, setUnitId] = useState(String(availableUnits[0]?.id || ""));
  const effectiveUnit = availableUnits.some((unit) => String(unit.id) === unitId) ? unitId : String(availableUnits[0]?.id || "");
  const availableDecks = organised.filter((deck) => String(deck.folder_id) === effectiveUnit);
  const [deckId, setDeckId] = useState(String(availableDecks[0]?.id || ""));
  const effectiveDeck = availableDecks.find((deck) => String(deck.id) === deckId) || availableDecks[0];
  const [mode, setMode] = useState(scope === "weak" ? "recall" : "learn");
  const studyHref = effectiveDeck
    ? `/decks/${effectiveDeck.id}/${mode}${scope === "weak" && mode === "recall" ? "?scope=weak" : ""}`
    : "";

  const chooseModule = (id) => {
    setSubjectId(String(id));
    setUnitId("");
    setDeckId("");
  };
  const chooseUnit = (id) => {
    setUnitId(String(id));
    setDeckId("");
  };

  if (!organised.length) {
    return <div className="workspace-empty"><strong>No organised decks yet</strong><p>Add a Module and Study Unit, then move a deck into it.</p><Link className="button primary" href="/library">Organise Modules</Link></div>;
  }

  return <section className="study-browser">
    <div className="study-path" aria-label="Study selection">
      <div className="path-column">
        <div className="path-heading"><span>1</span><div><strong>Module</strong><small>Choose your course</small></div></div>
        {subjects.filter((subject) => organised.some((deck) => String(deck.subject_id) === String(subject.id))).map((subject) => <button className={subjectId === String(subject.id) ? "selected" : ""} type="button" onClick={() => chooseModule(subject.id)} key={subject.id}><span>◎</span><strong>{subject.name}</strong><b>›</b></button>)}
      </div>
      <div className="path-column">
        <div className="path-heading"><span>2</span><div><strong>Study Unit</strong><small>Narrow the topic</small></div></div>
        {availableUnits.map((unit) => <button className={effectiveUnit === String(unit.id) ? "selected" : ""} type="button" onClick={() => chooseUnit(unit.id)} key={unit.id}><span>▤</span><strong>{unit.name}</strong><b>›</b></button>)}
      </div>
      <div className="path-column">
        <div className="path-heading"><span>3</span><div><strong>Deck</strong><small>Pick the flashcard set</small></div></div>
        {availableDecks.map((deck) => <button className={String(effectiveDeck?.id) === String(deck.id) ? "selected" : ""} type="button" onClick={() => setDeckId(String(deck.id))} key={deck.id}><span>▱</span><span><strong>{deck.title}</strong><small>{deck.card_count} cards · {deck.due_count} due</small></span><b>✓</b></button>)}
      </div>
    </div>
    {purpose === "ai" ? <div className="launcher-footer"><div><strong>{effectiveDeck?.title || "Choose a deck"}</strong><span>Generate a focused AI study prompt</span></div>{effectiveDeck ? <Link className="button primary launcher-start" href={`/decks/${effectiveDeck.id}/ai`}>Open AI Help →</Link> : null}</div> : <>
      <div className="launcher-divider" />
      <div className="launcher-step"><span className="step-number">4</span><div><h2>Choose a learning mode</h2><p>Use the method that fits this session.</p></div></div>
      <div className="activity-choice-grid">{modes.map((item) => <button type="button" className={mode === item.id ? "selected" : ""} onClick={() => setMode(item.id)} key={item.id}><span className="activity-choice-icon">{item.icon}</span><span><strong>{item.name}{item.recommended ? <em>Recommended</em> : null}</strong><small>{item.description}</small></span><b>{mode === item.id ? "✓" : ""}</b></button>)}</div>
      <div className="launcher-footer"><div><strong>{effectiveDeck?.title || "Choose a deck"}</strong><span>{modes.find((item) => item.id === mode)?.name}</span></div>{effectiveDeck ? <Link className="button primary launcher-start" href={studyHref}>Start studying →</Link> : null}</div>
    </>}
  </section>;
}
