"use client";

import { useEffect, useMemo, useState } from "react";

const instructions = {
  teach: "Act as an interactive tutor. Teach this material starting with my weakest concepts. Ask questions throughout instead of giving me a wall of notes. If I misunderstand, explain it simply and then technically. End by testing the most important concepts.",
  quiz: "Quiz me one question at a time. Do not reveal an answer until I respond. Adapt the difficulty and focus more heavily on weak concepts. Explain mistakes clearly before continuing.",
  weak: "Explain my weak areas interactively. Find the likely misunderstanding behind each weak card, use a simple example, then ask me to explain it back in my own words.",
  test: "Prepare me for a test. Identify gaps, teach the highest-priority weaknesses, then run a realistic mixed test. Do not reveal answers before I attempt them.",
  check: "Check my understanding using probing questions, not simple recognition. Identify misconceptions and help me correct them before moving on.",
  improve: "Review these flashcards for ambiguity, unnecessary complexity, and poor active-recall design. Return improved cards using the # SNOOZELET Q:/A: format.",
  create: "Identify important gaps in these flashcards and create additional non-duplicate cards. Return only cards in the # SNOOZELET Q:/A: format.",
};

export function buildStudyContext({ subject, unit, decks = [], cards = [] }) {
  const weak = cards.filter((card) => card.weak || (card.attempts && card.accuracy < 60));
  const reviewed = cards.filter((card) => card.attempts);
  const accuracy = reviewed.length ? Math.round(reviewed.reduce((sum, card) => sum + card.accuracy, 0) / reviewed.length) : 0;
  const lines = [`Module: ${subject || "Unorganised"}`];
  if (unit) lines.push(`Study Unit: ${unit}`);
  lines.push(`Decks: ${decks.map((deck) => deck.title).join(", ") || "None"}`, "", "Current progress:", `Cards: ${cards.length}`, `Overall accuracy: ${accuracy}%`, `Due: ${cards.filter((card) => card.due).length}`, `Weak concepts: ${weak.map((card) => card.term).slice(0,20).join(", ") || "None identified yet"}`);
  const selected = weak.length ? weak : cards;
  if (selected.length) lines.push("", weak.length ? "Weak cards:" : "Study material:", ...selected.slice(0,100).flatMap((card) => ["", `Q: ${card.term}`, `A: ${card.definition}`, card.attempts ? `Accuracy: ${card.accuracy}%` : "Not studied yet"]));
  return lines.join("\n");
}

export default function StudyContextTools({ subject, unit = "", decks = [], cards = [] }) {
  const context = useMemo(() => buildStudyContext({ subject, unit, decks, cards }), [subject, unit, decks, cards]);
  const [mode, setMode] = useState("teach");
  const generated = `${instructions[mode]}\n\n${context}`;
  const [output, setOutput] = useState(generated);
  const [copied, setCopied] = useState(false);
  useEffect(() => setOutput(generated), [generated]);
  async function copy() { try { await navigator.clipboard.writeText(output); } catch { const area=document.createElement("textarea"); area.value=output; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); } setCopied(true); window.setTimeout(() => setCopied(false),1800); }
  const options = [["teach","Teach me this"],["quiz","Quiz me"],["weak","Explain weak areas"],["test","Prepare for a test"],["check","Check my understanding"],["improve","Improve flashcards"],["create","Create more flashcards"]];
  return <section className="context-tools ai-study-tools"><div className="ai-study-intro"><div className="ai-help-mark">AI</div><div><p className="eyebrow">AI Help</p><h2>Get help from your preferred AI tutor</h2><p>Snoozelet remains AI-free. Choose a useful prompt, copy it, then paste it into a fresh ChatGPT, Gemini, Claude, or other AI conversation.</p></div></div><div className="ai-action-grid">{options.map(([value,label]) => <button className={mode === value ? "active" : ""} type="button" onClick={() => setMode(value)} key={value}>{label}</button>)}</div><textarea value={output} onChange={(event) => setOutput(event.target.value)} rows="9" aria-label="Editable generated study prompt" /><div className="row-actions"><button className="button primary" type="button" onClick={copy}>{copied ? "Copied ✓" : "Copy study prompt"}</button><a className="button" href="https://chatgpt.com/" target="_blank" rel="noreferrer">Open ChatGPT ↗</a></div><small>Start a fresh conversation, paste the prompt, study, then return to Snoozelet.</small></section>;
}
