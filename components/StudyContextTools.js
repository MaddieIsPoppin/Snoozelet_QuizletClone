"use client";

import { useMemo, useState } from "react";

const introductions = {
  context: "Here is my current study context. Help me decide what to study next.",
  teach: "Teach me these weak areas. Start simply, increase technical depth gradually, then check my understanding.",
  quiz: "Quiz me on this material one question at a time. Do not reveal an answer until I respond. Focus more on weak concepts.",
  test: "Prepare me for a test using this material. Identify gaps, teach the weakest concepts, then test me under realistic conditions.",
  improve: "Review these flashcards for ambiguity, unnecessary complexity, and poor active-recall design. Suggest clearer replacements in Snoozelet format.",
};

export function buildStudyContext({ subject, unit, decks = [], cards = [] }) {
  const weak = cards.filter((card) => card.weak || (card.attempts && card.accuracy < 60));
  const lines = [`Subject: ${subject || "Unassigned"}`];
  if (unit) lines.push(`Study Unit: ${unit}`);
  lines.push("", "Current progress:", `Sets: ${decks.length}`, `Cards: ${cards.length}`, `Due: ${cards.filter((card) => card.due).length}`, `Weak: ${weak.length}`);
  const selected = weak.length ? weak : cards;
  if (selected.length) lines.push("", weak.length ? "Weak cards:" : "Flashcards:", ...selected.slice(0, 100).flatMap((card) => ["", `Q: ${card.term}`, `A: ${card.definition}`, card.attempts ? `Accuracy: ${card.accuracy}%` : "Not studied yet"]));
  return lines.join("\n");
}

export default function StudyContextTools({ subject, unit = "", decks = [], cards = [] }) {
  const context = useMemo(() => buildStudyContext({ subject, unit, decks, cards }), [subject, unit, decks, cards]);
  const [mode, setMode] = useState("context");
  const [copied, setCopied] = useState(false);
  const output = `${introductions[mode]}\n\n${context}`;

  async function copy() {
    try { await navigator.clipboard.writeText(output); }
    catch {
      const area = document.createElement("textarea"); area.value = output; document.body.append(area); area.select(); document.execCommand("copy"); area.remove();
    }
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }

  return <section className="context-tools"><div><p className="eyebrow">External study companion</p><h2>Copy study context</h2><p>Snoozelet stays AI-free. Copy this into any external tutor or a fresh ChatGPT Study Mode conversation.</p></div><label>Prompt<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="context">Copy study context</option><option value="teach">Teach my weak areas</option><option value="quiz">Quiz me</option><option value="test">Prepare me for a test</option><option value="improve">Improve these flashcards</option></select></label><textarea value={output} onChange={() => {}} readOnly rows="7" aria-label="Generated study prompt" /><button className="button primary" type="button" onClick={copy}>{copied ? "Copied ✓" : "Copy to clipboard"}</button></section>;
}
