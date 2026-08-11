"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function FocusJourney({ deck, minutes }) {
  const [remaining, setRemaining] = useState(minutes * 60);
  const [running, setRunning] = useState(false);
  const storageKey = `snoozelet-focus-${deck.id}`;
  useEffect(() => {
    const saved = Number(window.localStorage.getItem(storageKey));
    if (saved > Date.now()) {
      setRemaining(Math.ceil((saved - Date.now()) / 1000));
      setRunning(true);
    }
  }, [storageKey]);
  useEffect(() => {
    if (!running || remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, remaining]);
  useEffect(() => {
    if (running && remaining > 0) window.localStorage.setItem(storageKey, String(Date.now() + remaining * 1000));
    if (remaining === 0) window.localStorage.removeItem(storageKey);
  }, [remaining, running, storageKey]);
  const display = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2,"0")}`;
  return <section className="focus-journey"><div className="focus-orb"><span>{display}</span><small>{remaining ? "focus remaining" : "journey complete"}</small></div><div><p className="eyebrow">Focus Journey</p><h1>{deck.title}</h1><p>Stay inside one calm learning loop. Snoo recommends Learn first, then a confidence check, and Match as a short cooldown.</p><div className="journey-steps"><Link href={`/decks/${deck.id}/learn`}>1 <span><strong>Recall</strong><small>Work through due and weak cards</small></span></Link><Link href={`/decks/${deck.id}/test?start=1&count=5&types=multiple&types=typed`}>2 <span><strong>Confidence check</strong><small>Five mixed questions</small></span></Link><Link href={`/decks/${deck.id}/match`}>3 <span><strong>Cool down</strong><small>Reconnect the constellation</small></span></Link></div><div className="row-actions"><button className="button primary" type="button" onClick={() => setRunning((value) => !value)}>{running ? "Pause timer" : remaining < minutes * 60 ? "Resume" : "Begin focus"}</button><button className="button" type="button" onClick={() => { setRunning(false); setRemaining(minutes * 60); window.localStorage.removeItem(storageKey); }}>Reset</button></div><p className="focus-persistence">The timer follows you while you complete each step.</p></div></section>;
}
