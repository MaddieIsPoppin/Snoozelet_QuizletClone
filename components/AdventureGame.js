"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useReviewSaver from "@/hooks/useReviewSaver";
import { makeMultipleChoiceOptions, shuffle } from "@/lib/study";
import XpNotice from "@/components/XpNotice";
import SnoozeMascot from "@/components/SnoozeMascot";

const REALM_SIZE = 16;

export default function AdventureGame({ deck, cards, variant }) {
  const hotPotato = variant === "hot-potato";
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [fuse, setFuse] = useState(25);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(5);
  const [monsterHealth, setMonsterHealth] = useState(2);
  const [room, setRoom] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const { saveReview, xpNotice } = useReviewSaver({ mode: "multiple", answerDirection: "definition", grading: "lenient" });
  const card = queue[index];
  const options = useMemo(() => card ? makeMultipleChoiceOptions(card, cards, "definition") : [], [card, cards]);

  useEffect(() => {
    if (!started || finished || !hotPotato || feedback) return;
    const timer = window.setInterval(() => setFuse((value) => {
      if (value <= 0.1) { window.clearInterval(timer); setFinished(true); return 0; }
      return Math.max(0, value - 0.1);
    }), 100);
    return () => window.clearInterval(timer);
  }, [started, finished, hotPotato, feedback]);

  function start() {
    setQueue(shuffle(cards)); setIndex(0); setFuse(25); setScore(0); setHealth(5);
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
    const saved = await saveReview(card, correct, "multiple", choice, { questionKey: `${variant}-${index}-${Date.now()}` });
    if (!saved) return;
    setFeedback(saved.correct ? "correct" : "wrong");

    if (hotPotato) {
      if (saved.correct) { setScore((value) => value + 1); setFuse((value) => Math.min(30, value + 2.5)); }
      else setFuse((value) => Math.max(0, value - 3));
    } else if (saved.correct) {
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

  if (!started) return <section className={`study-shell adventure-game ${variant}`}><div className="adventure-intro"><div><p className="eyebrow">Study arcade</p><h1>{hotPotato ? "Hot Potato" : "Dungeon Realm"}</h1><p>{hotPotato ? "Keep the study bomb alive. Correct answers add time; mistakes burn the fuse faster." : "Cross a tiled realm one encounter at a time. Defeat each guardian with correct answers and reach the portal."}</p><button className="button primary" type="button" onClick={start}>Enter the realm</button></div><SnoozeMascot variant="hero" mood="happy" /></div></section>;

  if (finished) return <section className="study-shell"><div className="empty-state adventure-results"><SnoozeMascot variant="coach" mood={score ? "happy" : "sad"} /><p className="eyebrow">Run complete</p><h1>{hotPotato ? `${score} passes` : room >= REALM_SIZE - 1 ? "Portal reached!" : `${room} rooms cleared`}</h1><p>{hotPotato ? "Each pass was another useful review." : `${score} points earned in the realm.`}</p><button className="button primary" type="button" onClick={start}>Play again</button></div></section>;

  return <section className={`study-shell adventure-game ${variant}`}>
    <XpNotice notice={xpNotice} />
    <div className="adventure-hud"><span>{hotPotato ? `Fuse ${fuse.toFixed(1)}s` : `Health ${health}/5`}</span><strong>{hotPotato ? `${score} passes` : `Room ${room + 1}/${REALM_SIZE}`}</strong><span>{hotPotato ? "Keep it alive!" : `Guardian ${monsterHealth}/2 HP`}</span></div>
    {!hotPotato ? <div className="realm-grid" aria-label={`Dungeon map, room ${room + 1} of ${REALM_SIZE}`}>
      {Array.from({ length: REALM_SIZE }, (_, tile) => <span className={`${tile < room ? "cleared" : ""}${tile === room ? " current" : ""}${tile === REALM_SIZE - 1 ? " portal" : ""}`} key={tile}>{tile === room ? "S" : tile === REALM_SIZE - 1 ? "P" : tile < room ? "✓" : ""}</span>)}
    </div> : null}
    <div className={hotPotato ? "potato-stage" : "dungeon-stage"}><div className={hotPotato ? "study-bomb" : "study-monster"}>{hotPotato ? "●" : room % 4 === 3 ? "BOSS" : "FOE"}</div><p className="eyebrow">{hotPotato ? "Defuse with knowledge" : "Clear this block to move"}</p><h1>{card?.term}</h1></div>
    <div className="adventure-options">{options.map((option) => <button className={feedback && option === card.definition ? "correct" : ""} disabled={Boolean(feedback)} type="button" onClick={() => answer(option)} key={option}>{option}</button>)}</div>
    {feedback ? <p className={`adventure-feedback ${feedback}`}>{feedback === "correct" ? (hotPotato ? "+2.5 seconds — passed!" : monsterHealth <= 1 ? "Path unlocked!" : "Direct hit!") : (hotPotato ? "The fuse lost 3 seconds!" : "Snoo took damage!")}</p> : null}
  </section>;
}
