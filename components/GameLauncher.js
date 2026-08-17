"use client";

import Link from "next/link";
import { useState } from "react";

const games = [
  { id: "match", icon: "M", name: "Match", description: "Pair terminology with the correct definition.", note: "Recognition training" },
  { id: "blast", icon: "S", name: "Speed Recall", description: "Answer accurately under a short time limit.", note: "Speed training" },
];

export default function GameLauncher({ decks }) {
  const [game, setGame] = useState("match");
  const [deckId, setDeckId] = useState(String(decks.find((deck) => deck.card_count >= 2)?.id || decks[0]?.id || ""));
  const deck = decks.find((item) => String(item.id) === deckId);
  const selectedGame = games.find((item) => item.id === game);

  if (!deck) return <div className="workspace-empty"><strong>No decks available</strong><Link className="button primary" href="/decks/new">Create a deck</Link></div>;

  return (
    <section className="launcher-card game-launcher">
      <div className="launcher-step"><span className="step-number">1</span><div><h2>Choose a training drill</h2><p>Each drill tests the same material with a different constraint.</p></div></div>
      <div className="game-choice-grid">
        {games.map((item) => <button type="button" className={game === item.id ? `selected game-${item.id}` : `game-${item.id}`} onClick={() => setGame(item.id)} key={item.id}><span className="game-choice-icon">{item.icon}</span><span><small>{item.note}</small><strong>{item.name}</strong><p>{item.description}</p></span><b>{game === item.id ? "Selected" : "Choose"}</b></button>)}
      </div>
      <div className="launcher-divider" />
      <div className="launcher-step"><span className="step-number">2</span><div><h2>Choose the deck to play with</h2><p>Games work best with at least two cards.</p></div></div>
      <label className="launcher-select-label">Deck<select value={deckId} onChange={(event) => setDeckId(event.target.value)}>{decks.map((item) => <option value={item.id} key={item.id}>{item.title} — {item.card_count} cards</option>)}</select></label>
      {deck.card_count < 2 ? <p className="launcher-warning">This deck needs at least two cards before you can play.</p> : null}
      <div className="launcher-footer"><div><strong>{selectedGame.name}</strong><span>Playing with {deck.title}</span></div>{deck.card_count >= 2 ? <Link className="button primary launcher-start" href={`/decks/${deck.id}/${game}`}>Play {selectedGame.name} →</Link> : <Link className="button" href={`/decks/${deck.id}`}>Add cards first</Link>}</div>
    </section>
  );
}
