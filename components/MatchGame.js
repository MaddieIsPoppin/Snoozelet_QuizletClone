"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function shuffle(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function formatTime(milliseconds) {
  return (milliseconds / 1000).toFixed(2);
}

export default function MatchGame({
  deck,
  cards = [],
}) {
  const [mounted, setMounted] = useState(false);

  const [roundSize, setRoundSize] = useState(
    Math.min(cards.length, 6)
  );

  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  const [tiles, setTiles] = useState([]);

  const [selectedTile, setSelectedTile] = useState(null);

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

  const timerRef = useRef(null);
  const wrongTimerRef = useRef(null);
  const correctTimerRef = useRef(null);

  useEffect(() => {
    setMounted(true);

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
  }, []);

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
    const generatedTiles = [];

    selectedCards.forEach((card) => {
      generatedTiles.push({
        id: `term-${card.id}`,
        pairId: card.id,
        type: "term",
        text: card.term,
      });

      generatedTiles.push({
        id: `definition-${card.id}`,
        pairId: card.id,
        type: "definition",
        text: card.definition,
      });
    });

    return shuffle(generatedTiles);
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
      setElapsedTime(
        Date.now() - startTime
      );
    }

    setGameFinished(true);
  }

  function handleTileClick(tile) {
    if (
      !gameStarted ||
      gameFinished ||
      matchedIds.includes(tile.id) ||
      wrongTileIds.length > 0 ||
      correctTileIds.length > 0
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

    const isValidMatch =
      selectedTile.pairId === tile.pairId &&
      selectedTile.type !== tile.type;

    /*
     * CORRECT MATCH
     */
    if (isValidMatch) {
      const pairIds = [
        selectedTile.id,
        tile.id,
      ];

      /*
       * Flash both tiles green.
       */
      setCorrectTileIds(pairIds);

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
      }, 650);
  }

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
      <section className="study-shell match-game">
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
      <section className="study-shell match-game">
        <div className="empty-state match-results">
          <p className="eyebrow">
            Round complete
          </p>

          <h1>
            {formatTime(elapsedTime)} seconds
          </h1>

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
    <section className="study-shell match-game">
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

      <div className="match-grid">
        {tiles.map((tile) => {
          const matched =
            matchedIds.includes(tile.id);

          const selected =
            selectedTile?.id === tile.id;

          const wrong =
            wrongTileIds.includes(tile.id);

          const correct =
            correctTileIds.includes(tile.id);

          let className =
            "match-tile";

          if (matched) {
            className +=
              " match-tile-matched";
          }

          if (selected) {
            className +=
              " match-tile-selected";
          }

          if (wrong) {
            className +=
              " match-tile-wrong";
          }

          if (correct) {
            className +=
              " match-tile-correct";
          }

          return (
            <button
              key={tile.id}
              type="button"
              className={className}
              disabled={matched}
              onClick={() =>
                handleTileClick(tile)
              }
            >
              <span className="match-tile-type">
                {tile.type === "term"
                  ? "Term"
                  : "Definition"}
              </span>

              <span className="match-tile-text">
                {tile.text}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}