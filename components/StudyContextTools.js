"use client";

import { useEffect, useMemo, useState } from "react";

const instructions = {
  teach: "Act as an interactive tutor. Teach this material starting with my weakest concepts. Ask questions throughout and explain misunderstandings simply and then technically.",
  quiz: "Quiz me one question at a time. Do not reveal an answer until I respond. Adapt difficulty and explain mistakes clearly.",
  weak: "Explain my weak areas interactively. Find the likely misunderstanding, use a simple example, then ask me to explain it back.",
  test: "Prepare me for a test. Identify gaps, teach the highest-priority weaknesses, then run a realistic mixed test.",
  check: "Check my understanding using probing questions. Identify misconceptions and help me correct them.",
  improve: "Review these flashcards for ambiguity and poor active-recall design. Return improved cards using the # SNOOZELET Q:/A: format.",
  create: "Identify important gaps and create non-duplicate cards. Return only cards in the # SNOOZELET Q:/A: format.",
};

export function buildStudyContext({ subject, unit, decks = [], cards = [] }) {
  const weak = cards.filter((card) => card.weak || (card.attempts && card.accuracy < 60));
  const reviewed = cards.filter((card) => card.attempts);
  const accuracy = reviewed.length ? Math.round(reviewed.reduce((sum, card) => sum + card.accuracy, 0) / reviewed.length) : 0;
  const lines = [`Module: ${subject || "Unorganised"}`];
  if (unit) lines.push(`Study Unit: ${unit}`);
  lines.push(`Decks: ${decks.map((deck) => deck.title).join(", ") || "None"}`, "", "Current progress:", `Cards: ${cards.length}`, `Overall accuracy: ${accuracy}%`, `Due: ${cards.filter((card) => card.due).length}`, `Weak concepts: ${weak.map((card) => card.term).slice(0, 20).join(", ") || "None identified yet"}`);
  const selected = weak.length ? weak : cards;
  if (selected.length) lines.push("", weak.length ? "Weak cards:" : "Study material:", ...selected.slice(0, 100).flatMap((card) => ["", `Q: ${card.term}`, `A: ${card.definition}`, card.attempts ? `Accuracy: ${card.accuracy}%` : "Not studied yet"]));
  return lines.join("\n");
}

const goals = [["teach", "Teach me this", "Explain concepts interactively"], ["quiz", "Quiz me", "Ask one question at a time"], ["weak", "Explain weak areas", "Focus on likely misunderstandings"], ["test", "Prepare for a test", "Find gaps and run a mixed test"], ["check", "Check my understanding", "Probe for misconceptions"], ["improve", "Improve flashcards", "Make existing cards clearer"], ["create", "Create more flashcards", "Fill important gaps"]];

export default function StudyContextTools({ subject, unit = "", decks = [], cards = [], initialProvider = "chatgpt" }) {
  const context = useMemo(() => buildStudyContext({ subject, unit, decks, cards }), [subject, unit, decks, cards]);
  const [mode, setMode] = useState("teach");
  const [provider, setProvider] = useState(initialProvider === "gemini" ? "gemini" : "chatgpt");
  const generated = `${instructions[mode]}\n\n${context}`;
  const [output, setOutput] = useState(generated);
  const [copied, setCopied] = useState(false);
  useEffect(() => setOutput(generated), [generated]);
  async function copy() {
    try { await navigator.clipboard.writeText(output); }
    catch { const area = document.createElement("textarea"); area.value = output; document.body.append(area); area.select(); document.execCommand("copy"); area.remove(); }
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }
  async function launch() {
    const tab = window.open("about:blank", "_blank");
    await copy();
    const url = provider === "gemini" ? "https://gemini.google.com/app" : "https://chatgpt.com/";
    if (tab) tab.location.href = url; else window.open(url, "_blank", "noopener,noreferrer");
  }
  const providerName = provider === "gemini" ? "Gemini" : "ChatGPT";
  return <section className="context-tools ai-study-tools">
    <div className="ai-study-intro"><div className="ai-help-mark">AI</div><div><p className="eyebrow">Study with AI</p><h2>Choose a study goal</h2><p>Snoozelet prepares your selected Deck as a prompt. Nothing is sent until you copy and open your tutor.</p></div></div>
    <div className="ai-workspace-grid"><div><h3>Study goal</h3><div className="ai-action-grid">{goals.map(([value, label, note]) => <button className={mode === value ? "active" : ""} aria-pressed={mode === value} type="button" onClick={() => setMode(value)} key={value}><strong>{label}</strong><small>{note}</small></button>)}</div></div>
      <aside><h3>AI provider</h3><div className="ai-provider-picker" aria-label="Choose AI tutor"><button className={provider === "chatgpt" ? "active" : ""} aria-pressed={provider === "chatgpt"} type="button" onClick={() => setProvider("chatgpt")}><strong>ChatGPT</strong><small>OpenAI</small></button><button className={provider === "gemini" ? "active" : ""} aria-pressed={provider === "gemini"} type="button" onClick={() => setProvider("gemini")}><strong>Google Gemini</strong><small>Google</small></button></div></aside>
    </div>
    <details className="prompt-preview"><summary>Preview and edit prompt</summary><textarea value={output} onChange={(event) => setOutput(event.target.value)} rows="12" aria-label="Editable generated study prompt" /></details>
    <div className="ai-launch-row"><div><strong>{goals.find(([value]) => value === mode)?.[1]}</strong><small>Prompt ready for {providerName}</small></div><div className="row-actions"><button className="button" type="button" onClick={copy}>{copied ? "Copied ✓" : "Copy prompt"}</button><button className="button primary" type="button" onClick={launch}>Copy and open {providerName} ↗</button></div></div>
    <small className="privacy-note">Your study content stays local until you choose to paste the copied prompt into an external conversation.</small>
  </section>;
}
