"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useReviewSaver from "@/hooks/useReviewSaver";
import { makeMultipleChoiceOptions, shuffle } from "@/lib/study";
import XpNotice from "@/components/XpNotice";
import SnoozeMascot from "@/components/SnoozeMascot";

const REALM_SIZE = 16;

export default function AdventureGame({ deck, cards }) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(5);
  const [monsterHealth, setMonsterHealth] = useState(2);
  const [room, setRoom] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const { saveReview, xpNotice } = useReviewSaver({ mode: "multiple", answerDirection: "definition", grading: "lenient" });
  const card = queue[index];
  const options = useMemo(() => card ? makeMultipleChoiceOptions(card, cards, "definition") : [], [card, cards]);

  function start() {
    setQueue(shuffle(cards)); setIndex(0); setScore(0); setHealth(5);
    setMonsterHealth(2); setRoom(0); setFeedback(null); setFinished(false); setStarted(true);
  }

  function advanceCard() {
    setFeedback(null);
    setIndex((value) => {
      if (value + 1 < queue.length) return value + 1;
      setQueue(shuffle(cards));
      return 0;
    });
  }

  async function answer(choice) {
    if (feedback || !card) return;
    const correct = choice.trim().toLowerCase() === card.definition.trim().toLowerCase();
    const saved = await saveReview(card, correct, "multiple", choice, { questionKey: `dungeon-${index}-${Date.now()}` });
    if (!saved) return;
    setFeedback(saved.correct ? "correct" : "wrong");
    if (saved.correct) {
      setScore((value) => value + 100);
      setMonsterHealth((value) => {
        if (value > 1) return value - 1;
        setRoom((currentRoom) => {
          const nextRoom = currentRoom + 1;
          if (nextRoom >= REALM_SIZE - 1) setFinished(true);
          return Math.min(nextRoom, REALM_SIZE - 1);
        });
        return 2;
      });
    } else {
      setHealth((value) => {
        const next = value - 1;
        if (next <= 0) setFinished(true);
        return Math.max(0, next);
      });
    }
    window.setTimeout(advanceCard, 850);
  }

  if (cards.length < 2) return <section className="empty-state"><h2>This game needs two cards</h2><Link className="button primary" href={`/decks/${deck.id}`}>Add cards</Link></section>;
  if (!started) return <section className="study-shell adventure-game dungeon"><div className="adventure-intro"><div><p className="eyebrow">Study arcade</p><h1>Dungeon Realm</h1><p>Cross a tiled realm one encounter at a time. Defeat each guardian with correct answers and reach the portal.</p><button className="button primary" type="button" onClick={start}>Enter the realm</button></div><SnoozeMascot variant="hero" mood="happy" /></div></section>;
  if (finished) return <section className="study-shell"><div className="empty-state adventure-results"><SnoozeMascot variant="coach" mood={score ? "happy" : "sad"} /><p className="eyebrow">Run complete</p><h1>{room >= REALM_SIZE - 1 ? "Portal reached!" : `${room} rooms cleared`}</h1><p>{score} points earned in the realm.</p><button className="button primary" type="button" onClick={start}>Play again</button></div></section>;

  return <section className="study-shell adventure-game dungeon">
    <XpNotice notice={xpNotice} />
    <div className="adventure-hud"><span>Health {health}/5</span><strong>Room {room + 1}/{REALM_SIZE}</strong><span>Guardian {monsterHealth}/2 HP</span></div>
    <div className="realm-grid" aria-label={`Dungeon map, room ${room + 1} of ${REALM_SIZE}`}>{Array.from({ length: REALM_SIZE }, (_, tile) => <span className={`${tile < room ? "cleared" : ""}${tile === room ? " current" : ""}${tile === REALM_SIZE - 1 ? " portal" : ""}`} key={tile}>{tile === room ? "S" : tile === REALM_SIZE - 1 ? "P" : tile < room ? "✓" : ""}</span>)}</div>
    <div className="dungeon-stage"><div className="study-monster">{room % 4 === 3 ? "BOSS" : "FOE"}</div><p className="eyebrow">Clear this block to move</p><h1>{card?.term}</h1></div>
    <div className="adventure-options">{options.map((option) => <button className={feedback && option === card.definition ? "correct" : ""} disabled={Boolean(feedback)} type="button" onClick={() => answer(option)} key={option}>{option}</button>)}</div>
    {feedback ? <p className={`adventure-feedback ${feedback}`}>{feedback === "correct" ? "Direct hit!" : "Snoo took damage!"}</p> : null}
  </section>;
}
