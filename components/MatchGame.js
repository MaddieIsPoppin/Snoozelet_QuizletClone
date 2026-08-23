"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { shuffle } from "@/lib/collections";
import useReviewSaver from "@/hooks/useReviewSaver";

function formatTime(milliseconds) {
  return (milliseconds / 1000).toFixed(2);
}

export default function MatchGame({
  deck,
  cards = [],
}) {
  const { saveReview } = useReviewSaver({ mode: "multiple", answerDirection: "definition", grading: "lenient" });
  const [mounted, setMounted] = useState(false);

  const [roundSize, setRoundSize] = useState(
    Math.min(cards.length, 6)
  );

  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const [tiles, setTiles] = useState([]);

  const [selectedTile, setSelectedTile] = useState(null);
  const [mobileColumn, setMobileColumn] = useState("term");

  const [matchedIds, setMatchedIds] = useState([]);

  /*
   * NEW:
   * Correct pair flashes green before disappearing.
   */
  const [correctTileIds, setCorrectTileIds] = useState([]);

  const [wrongTileIds, setWrongTileIds] = useState([]);

  const [mistakes, setMistakes] = useState(0);

  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState(null);

  const timerRef = useRef(null);
  const wrongTimerRef = useRef(null);
  const correctTimerRef = useRef(null);
  const resolvingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (window.matchMedia("(max-width: 760px), (pointer: coarse)").matches) {
      setRoundSize(Math.min(cards.length, 4));
    }

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }

      if (wrongTimerRef.current) {
        window.clearTimeout(wrongTimerRef.current);
      }

      if (correctTimerRef.current) {
        window.clearTimeout(correctTimerRef.current);
      }
    };
  }, [cards.length]);

  const availableRoundSizes = useMemo(() => {
    const sizes = [4, 6, 8].filter(
      (size) => size <= cards.length
    );

    if (
      cards.length > 0 &&
      !sizes.includes(cards.length) &&
      cards.length < 8
    ) {
      sizes.push(cards.length);
    }

    return [...new Set(sizes)].sort(
      (a, b) => a - b
    );
  }, [cards.length]);

  function buildTiles(selectedCards) {
    const terms = selectedCards.map((card) => ({
        id: `term-${card.id}`,
        pairId: card.id,
        type: "term",
        text: card.term,
        card,
      }));
    const definitions = selectedCards.map((card) => ({
        id: `definition-${card.id}`,
        pairId: card.id,
        type: "definition",
        text: card.definition,
        card,
      }));
    return [...shuffle(terms), ...shuffle(definitions)];
  }

  function startGame() {
    if (cards.length < 2) {
      return;
    }

    const selectedCards = shuffle(cards).slice(
      0,
      Math.min(roundSize, cards.length)
    );

    setTiles(
      buildTiles(selectedCards)
    );

    setSelectedTile(null);
    setMobileColumn("term");
    resolvingRef.current = false;
    setMatchedIds([]);
    setCorrectTileIds([]);
    setWrongTileIds([]);

    setMistakes(0);
    setElapsedTime(0);

    const startedAt = Date.now();

    setStartTime(startedAt);

    setGameFinished(false);
    setGameStarted(true);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setElapsedTime(
        Date.now() - startedAt
      );
    }, 50);
  }

  function finishGame() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (startTime) {
      const finalTime = Date.now() - startTime;
      setElapsedTime(finalTime);
      const key = `snoozelet-match-best-${deck.id}-${roundSize}`;
      const previous = Number(localStorage.getItem(key)) || null;
      const nextBest = previous ? Math.min(previous, finalTime) : finalTime;
      localStorage.setItem(key, String(nextBest));
      setBestTime(nextBest);
    }

    setGameFinished(true);
  }

  function handleTileClick(tile) {
    if (
      !gameStarted ||
      gameFinished ||
      matchedIds.includes(tile.id) ||
      resolvingRef.current
    ) {
      return;
    }

    /*
     * First tile selected.
     */
    if (!selectedTile) {
      setSelectedTile(tile);
      return;
    }

    /*
     * Clicking the same tile again deselects it.
     */
    if (selectedTile.id === tile.id) {
      setSelectedTile(null);
      return;
    }

    if (selectedTile.type === tile.type) {
      setSelectedTile(tile);
      return;
    }

    const isValidMatch =
      selectedTile.pairId === tile.pairId &&
      selectedTile.type !== tile.type;

    /*
     * CORRECT MATCH
     */
    if (isValidMatch) {
      resolvingRef.current = true;
      const pairIds = [
        selectedTile.id,
        tile.id,
      ];

      /*
       * Flash both tiles green.
       */
      setCorrectTileIds(pairIds);
      const matchedCard = selectedTile.card || tile.card;
      saveReview(matchedCard, true, "multiple", matchedCard.definition, { questionKey: `match-${startTime}-${matchedCard.id}` });

      /*
       * Wait briefly so the user actually sees
       * the successful match.
       */
      correctTimerRef.current =
        window.setTimeout(() => {
          const newlyMatched = [
            ...matchedIds,
            ...pairIds,
          ];

          setMatchedIds(newlyMatched);

          setCorrectTileIds([]);
          setSelectedTile(null);
          setMobileColumn("term");
          resolvingRef.current = false;

          /*
           * Last pair completed.
           */
          if (
            newlyMatched.length === tiles.length
          ) {
            window.setTimeout(() => {
              finishGame();
            }, 250);
          }
        }, 450);

      return;
    }

    /*
     * WRONG MATCH
     */
    setMistakes(
      (value) => value + 1
    );

    resolvingRef.current = true;

    setWrongTileIds([
      selectedTile.id,
      tile.id,
    ]);

    if (wrongTimerRef.current) {
      window.clearTimeout(
        wrongTimerRef.current
      );
    }

    wrongTimerRef.current =
      window.setTimeout(() => {
        setWrongTileIds([]);
        setSelectedTile(null);
        resolvingRef.current = false;
      }, 650);
  }

  useEffect(() => {
    if (!gameStarted || gameFinished) return;
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;
    function handleKeyDown(event) {
      if (event.target?.matches?.("input, textarea, select, [contenteditable=true]")) return;
      if (event.key === "Escape") { setSelectedTile(null); return; }
      const tileIndex = Number(event.key) - 1;
      if (tileIndex >= 0 && tileIndex < 9) document.querySelectorAll(".match-tile:not(:disabled)")[tileIndex]?.click();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, gameFinished]);

  if (!mounted) {
    return (
      <section className="study-shell">
        <div className="empty-state">
          <p>Loading Match...</p>
        </div>
      </section>
    );
  }

  if (cards.length < 2) {
    return (
      <section className="study-shell">
        <div className="empty-state">
          <h2>Match needs more cards</h2>

          <p>
            Add at least two cards to this deck before
            starting Match.
          </p>
        </div>
      </section>
    );
  }

  /*
   * SETUP SCREEN
   */
  if (!gameStarted) {
    return (
      <section className="study-shell match-game match-setup-screen">
        <div className="study-header">
          <div>
            <p className="eyebrow">
              Game mode
            </p>

            <h1>Match</h1>

            <p>
              Match every term with its correct
              definition as quickly as possible.
            </p>
          </div>
        </div>

        <section className="editor-panel match-setup">
          <h2>Round size</h2>

          <p>
            Choose how many pairs you want in this
            round.
          </p>

          <div className="direction-toggle">
            {availableRoundSizes.map((size) => (
              <button
                key={size}
                type="button"
                data-round-size={size}
                className={
                  roundSize === size
                    ? "button primary"
                    : "button"
                }
                onClick={() =>
                  setRoundSize(size)
                }
              >
                {size} pairs
              </button>
            ))}
          </div>

          <button
            className="button primary"
            type="button"
            onClick={startGame}
          >
            Start Match
          </button>
        </section>
      </section>
    );
  }

  /*
   * RESULTS
   */
  if (gameFinished) {
    const matchedPairs =
      matchedIds.length / 2;

    return (
      <section className="study-shell match-game match-results-screen">
        <div className="empty-state match-results">
          <p className="eyebrow">
            Round complete
          </p>

          <h1>
            {formatTime(elapsedTime)} seconds
          </h1>

          <p>{mistakes === 0 ? "Perfect round — every pair was clean." : mistakes <= 2 ? "Sharp matching. Try again to beat your time." : "Nice finish. A replay will make these pairs feel automatic."}</p>

          <div className="metrics-strip small">
            <div>
              <span>{matchedPairs}</span>
              <p>Pairs matched</p>
            </div>

            <div>
              <span>{mistakes}</span>
              <p>Mistakes</p>
            </div>

            <div>
              <span>
                {formatTime(elapsedTime)}
              </span>
              <p>Time</p>
            </div>
            <div><span>{bestTime ? `${formatTime(bestTime)}s` : "—"}</span><p>Personal best</p></div>
          </div>

          <div className="row-actions">
            <button
              className="button primary"
              type="button"
              onClick={startGame}
            >
              Play again
            </button>

            <button
              className="button"
              type="button"
              onClick={() => {
                setGameStarted(false);
                setGameFinished(false);
              }}
            >
              Change round
            </button>
          </div>
        </div>
      </section>
    );
  }

  /*
   * ACTIVE GAME
   */
  return (
    <section className="study-shell match-game match-playing">
      <div className="match-game-header">
        <div>
          <p className="eyebrow">
            Match
          </p>

          <h1>{deck.title}</h1>
        </div>

        <div className="match-timer">
          <strong>
            {formatTime(elapsedTime)}
          </strong>

          <span>seconds</span>
        </div>
      </div>

      <div className="study-summary">
        <span>
          {matchedIds.length / 2} /{" "}
          {tiles.length / 2} matched
        </span>

        <span>
          {mistakes} mistakes
        </span>
      </div>

      <div className="match-mobile-tabs" role="tablist" aria-label="Match columns"><button className={mobileColumn === "term" ? "active" : ""} type="button" role="tab" aria-selected={mobileColumn === "term"} onClick={() => setMobileColumn("term")}>Terms{selectedTile?.type === "term" ? " · 1 selected" : ""}</button><button className={mobileColumn === "definition" ? "active" : ""} type="button" role="tab" aria-selected={mobileColumn === "definition"} onClick={() => setMobileColumn("definition")}>Definitions{selectedTile?.type === "definition" ? " · 1 selected" : ""}</button></div>
      <div className="match-columns">
        {["term", "definition"].map((column) => <section className={`match-column match-column-${column}${mobileColumn === column ? " mobile-active" : ""}`} aria-label={column === "term" ? "Terms" : "Definitions"} key={column}>
          <header><div><strong>{column === "term" ? "Terms" : "Definitions"}</strong><small>Select one {column}</small></div><span>{tiles.filter((tile) => tile.type === column && !matchedIds.includes(tile.id)).length} left</span></header>
          <div>{tiles.filter((tile) => tile.type === column).map((tile) => {
            const matched = matchedIds.includes(tile.id);
            const selected = selectedTile?.id === tile.id;
            const wrong = wrongTileIds.includes(tile.id);
            const correct = correctTileIds.includes(tile.id);
            let className = `match-tile match-tile-${tile.type}`;
            if (matched) className += " match-tile-matched";
            if (selected) className += " match-tile-selected";
            if (wrong) className += " match-tile-wrong";
            if (correct) className += " match-tile-correct";
            return <button key={tile.id} type="button" className={className} disabled={matched} aria-pressed={selected} aria-label={`${column === "term" ? "Term" : "Definition"}: ${tile.text}${matched ? ". Matched" : selected ? ". Selected" : wrong ? ". Incorrect pair" : correct ? ". Correct pair" : ""}`} onClick={() => handleTileClick(tile)}>
              <span className="match-tile-text">{tile.text}</span>
              {correct || matched ? <b className="match-result-icon" aria-hidden="true">✓</b> : wrong ? <b className="match-result-icon" aria-hidden="true">×</b> : selected ? <b className="match-result-icon" aria-hidden="true">Selected</b> : null}
            </button>;
          })}</div>
        </section>)}
      </div>
    </section>
  );
}
