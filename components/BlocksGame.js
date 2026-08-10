"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { shuffle } from "@/lib/collections";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildRound(card, cards) {
  const correct = card.definition;

  const alternatives = cards
    .filter((item) => item.id !== card.id)
    .map((item) => item.definition)
    .filter(
      (value) =>
        normalize(value) !== normalize(correct)
    );

  const options = shuffle([
    correct,
    ...shuffle(alternatives).slice(0, 3),
  ]);

  return {
    card,
    options,

    correctIndex: options.findIndex(
      (option) =>
        normalize(option) === normalize(correct)
    ),
  };
}

export default function BlocksGame({
  deck,
  cards = [],
}) {
  const MAX_STACK = 6;
  const MAX_FALL_ROW = 6;

  const [mounted, setMounted] =
    useState(false);

  const [gameStarted, setGameStarted] =
    useState(false);

  const [gameOver, setGameOver] =
    useState(false);

  const [cardQueue, setCardQueue] =
    useState([]);

  const [
    currentCardIndex,
    setCurrentCardIndex,
  ] = useState(0);

  const [round, setRound] =
    useState(null);

  const [
    playerColumn,
    setPlayerColumn,
  ] = useState(1);

  const [fallRow, setFallRow] =
    useState(0);

  const [stacks, setStacks] =
    useState([0, 0, 0, 0]);

  const [score, setScore] =
    useState(0);

  const [combo, setCombo] =
    useState(0);

  const [bestCombo, setBestCombo] =
    useState(0);

  const [
    correctCount,
    setCorrectCount,
  ] = useState(0);

  const [
    wrongCount,
    setWrongCount,
  ] = useState(0);

  const [feedback, setFeedback] =
    useState(null);

  const [locked, setLocked] =
    useState(false);

  const [
    dangerColumn,
    setDangerColumn,
  ] = useState(null);

  const fallTimerRef =
    useRef(null);

  const lockRef =
    useRef(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      if (fallTimerRef.current) {
        window.clearInterval(
          fallTimerRef.current
        );
      }
    };
  }, []);

  const fallSpeed = useMemo(() => {
    return Math.max(
      400,
      1200 -
        Math.floor(score / 500) * 80
    );
  }, [score]);

  const highestStack =
    Math.max(...stacks);

  const dangerPercent =
    Math.round(
      (highestStack / MAX_STACK) * 100
    );

  const blocksUntilLoss =
    MAX_STACK - highestStack;

  const dangerLevel =
    dangerPercent >= 83
      ? "critical"
      : dangerPercent >= 50
        ? "warning"
        : "safe";

  function stopFallTimer() {
    if (fallTimerRef.current) {
      window.clearInterval(
        fallTimerRef.current
      );

      fallTimerRef.current = null;
    }
  }

  function prepareRound(
    queue,
    index
  ) {
    if (!queue.length) {
      return;
    }

    const card =
      queue[index];

    setRound(
      buildRound(card, cards)
    );

    setPlayerColumn(
      Math.floor(Math.random() * 4)
    );

    setFallRow(0);

    setFeedback(null);

    setDangerColumn(null);

    lockRef.current = false;

    setLocked(false);
  }

  function startGame() {
    if (cards.length < 4) {
      return;
    }

    stopFallTimer();

    const queue =
      shuffle(cards);

    setCardQueue(queue);

    setCurrentCardIndex(0);

    setStacks([
      0,
      0,
      0,
      0,
    ]);

    setScore(0);

    setCombo(0);

    setBestCombo(0);

    setCorrectCount(0);

    setWrongCount(0);

    setFeedback(null);

    setDangerColumn(null);

    setGameOver(false);

    setGameStarted(true);

    prepareRound(
      queue,
      0
    );
  }

  function endGame() {
    stopFallTimer();

    lockRef.current = true;

    setLocked(true);

    setGameOver(true);
  }

  function advanceRound() {
    let nextIndex =
      currentCardIndex + 1;

    let queue =
      cardQueue;

    if (
      nextIndex >=
      queue.length
    ) {
      queue =
        shuffle(cards);

      nextIndex = 0;

      setCardQueue(queue);
    }

    setCurrentCardIndex(
      nextIndex
    );

    prepareRound(
      queue,
      nextIndex
    );
  }

  const lockPiece =
    useCallback(() => {
      if (
        lockRef.current ||
        !round ||
        gameOver
      ) {
        return;
      }

      lockRef.current = true;

      setLocked(true);

      stopFallTimer();

      const correct =
        playerColumn ===
        round.correctIndex;

      /*
       * CORRECT
       */
      if (correct) {
        const nextCombo =
          combo + 1;

        setCombo(nextCombo);

        setBestCombo(
          (value) =>
            Math.max(
              value,
              nextCombo
            )
        );

        setCorrectCount(
          (value) =>
            value + 1
        );

        const multiplier =
          1 +
          Math.floor(
            nextCombo / 3
          ) *
            0.25;

        const points =
          Math.round(
            100 * multiplier
          );

        setScore(
          (value) =>
            value + points
        );

        setFeedback({
          type: "correct",
          title: "Correct!",
          detail:
            `Piece cleared · +${points} points`,
        });

        window.setTimeout(
          advanceRound,
          600
        );

        return;
      }

      /*
       * WRONG
       */
      setCombo(0);

      setWrongCount(
        (value) =>
          value + 1
      );

      setDangerColumn(
        playerColumn
      );

      setStacks(
        (existing) => {
          const updated = [
            ...existing,
          ];

          updated[
            playerColumn
          ] += 1;

          const newHeight =
            updated[
              playerColumn
            ];

          const remaining =
            MAX_STACK -
            newHeight;

          setFeedback({
            type: "wrong",

            title: "Wrong!",

            detail:
              remaining <= 0
                ? "Stack reached the loss line!"
                : remaining === 1
                  ? "Stack +1 · ONE BLOCK FROM LOSING"
                  : `Stack +1 · ${remaining} blocks until this column loses`,
          });

          if (
            newHeight >=
            MAX_STACK
          ) {
            window.setTimeout(
              endGame,
              900
            );
          } else {
            window.setTimeout(
              advanceRound,
              850
            );
          }

          return updated;
        }
      );
    }, [
      round,
      gameOver,
      playerColumn,
      combo,
      currentCardIndex,
      cardQueue,
      cards,
    ]);

  useEffect(() => {
    if (
      !gameStarted ||
      gameOver ||
      locked ||
      !round
    ) {
      return;
    }

    stopFallTimer();

    fallTimerRef.current =
      window.setInterval(
        () => {
          setFallRow(
            (current) => {
              if (
                current >=
                MAX_FALL_ROW
              ) {
                window.setTimeout(
                  lockPiece,
                  0
                );

                return current;
              }

              return current + 1;
            }
          );
        },
        fallSpeed
      );

    return stopFallTimer;
  }, [
    gameStarted,
    gameOver,
    locked,
    round,
    fallSpeed,
    lockPiece,
  ]);

  function moveLeft() {
    if (
      locked ||
      gameOver
    ) {
      return;
    }

    setPlayerColumn(
      (column) =>
        Math.max(
          0,
          column - 1
        )
    );
  }

  function moveRight() {
    if (
      locked ||
      gameOver
    ) {
      return;
    }

    setPlayerColumn(
      (column) =>
        Math.min(
          3,
          column + 1
        )
    );
  }

  function hardDrop() {
    if (
      locked ||
      gameOver
    ) {
      return;
    }

    stopFallTimer();

    setFallRow(
      MAX_FALL_ROW
    );

    window.setTimeout(
      lockPiece,
      80
    );
  }

  useEffect(() => {
    if (
      !gameStarted ||
      gameOver
    ) {
      return;
    }

    function handleKeyDown(
      event
    ) {
      const key =
        event.key.toLowerCase();

      if (
        event.key ===
          "ArrowLeft" ||
        key === "a"
      ) {
        event.preventDefault();

        moveLeft();
      }

      if (
        event.key ===
          "ArrowRight" ||
        key === "d"
      ) {
        event.preventDefault();

        moveRight();
      }

      if (
        event.key ===
          "ArrowDown" ||
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();

        hardDrop();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  });

  if (!mounted) {
    return (
      <section className="study-shell">
        <div className="empty-state">
          <p>
            Loading Blocks...
          </p>
        </div>
      </section>
    );
  }

  if (cards.length < 4) {
    return (
      <section className="study-shell">
        <div className="empty-state">
          <h2>
            Blocks needs more cards
          </h2>

          <p>
            Add at least four cards before playing.
          </p>
        </div>
      </section>
    );
  }

  /*
   * SETUP
   */
  if (!gameStarted) {
    return (
      <section className="study-shell blocks-game">

        <div className="study-header">
          <div>
            <p className="eyebrow">
              Game mode
            </p>

            <h1>
              Blocks
            </h1>

            <p>
              Move the falling term onto its matching
              definition. Wrong answers build upward
              from the bottom.
            </p>
          </div>
        </div>

        <section className="editor-panel blocks-setup">

          <h2>
            How to play
          </h2>

          <div className="blocks-controls-help">

            <span>
              ← / A Move left
            </span>

            <span>
              → / D Move right
            </span>

            <span>
              ↓ / Space Drop
            </span>

          </div>

          <div className="blocks-rule-card">

            <strong>
              Correct
            </strong>

            <span>
              The falling block disappears and your
              combo increases.
            </span>

          </div>

          <div className="blocks-rule-card danger-rule">

            <strong>
              Wrong
            </strong>

            <span>
              A penalty block stacks from the bottom.
              If any stack reaches the loss line, game over.
            </span>

          </div>

          <button
            className="button primary"
            type="button"
            onClick={startGame}
          >
            Start Blocks
          </button>

        </section>

      </section>
    );
  }

  /*
   * GAME OVER
   */
  if (gameOver) {
    const attempts =
      correctCount +
      wrongCount;

    const accuracy =
      attempts > 0
        ? Math.round(
            (
              correctCount /
              attempts
            ) *
              100
          )
        : 0;

    return (
      <section className="study-shell blocks-game">

        <div className="empty-state blocks-results">

          <p className="eyebrow">
            Game over
          </p>

          <h1>
            {score} points
          </h1>

          <p>
            One of your stacks reached the loss line.
          </p>

          <div className="metrics-strip small">

            <div>
              <span>
                {correctCount}
              </span>
              <p>Correct</p>
            </div>

            <div>
              <span>
                {accuracy}%
              </span>
              <p>Accuracy</p>
            </div>

            <div>
              <span>
                {bestCombo}x
              </span>
              <p>Best combo</p>
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
                setGameOver(false);
              }}
            >
              Back to setup
            </button>

          </div>

        </div>

      </section>
    );
  }

  if (!round) {
    return null;
  }

  return (
    <section className="study-shell blocks-game">

      {/* HUD */}

      <div className="blocks-hud">

        <div>
          <span>Score</span>
          <strong>{score}</strong>
        </div>

        <div>
          <span>Combo</span>
          <strong>{combo}x</strong>
        </div>

        <div>
          <span>Mistakes</span>
          <strong>{wrongCount}</strong>
        </div>

      </div>


      {/* GLOBAL DANGER */}

      <section
        className={`blocks-danger-panel ${dangerLevel}`}
      >

        <div className="blocks-danger-heading">

          <div>
            <p className="eyebrow">
              Danger
            </p>

            <strong>
              {dangerPercent}%
            </strong>
          </div>

          <span>
            {highestStack === 0
              ? "Board clear"
              : blocksUntilLoss === 1
                ? "One wrong answer away from losing"
                : `${blocksUntilLoss} blocks until your tallest stack loses`}
          </span>

        </div>

        <div className="blocks-danger-track">

          <div
            className="blocks-danger-fill"
            style={{
              width:
                `${dangerPercent}%`,
            }}
          />

        </div>

      </section>


      {/* CURRENT TERM */}

      <section className="blocks-question">

        <p className="eyebrow">
          Match this term
        </p>

        <h1>
          {round.card.term}
        </h1>

        {feedback ? (
          <div
            className={
              `blocks-feedback ${feedback.type}`
            }
          >

            <strong>
              {feedback.title}
            </strong>

            <span>
              {feedback.detail}
            </span>

          </div>
        ) : (
          <p className="blocks-question-hint">
            Move to the correct definition, then drop.
          </p>
        )}

      </section>


      {/* GAME BOARD */}

      <div className="blocks-board">

        {round.options.map(
          (
            option,
            columnIndex
          ) => {
            const isActive =
              playerColumn ===
              columnIndex;

            const stackHeight =
              stacks[
                columnIndex
              ];

            const remaining =
              MAX_STACK -
              stackHeight;

            const nearLoss =
              stackHeight >=
              MAX_STACK - 1;

            const wrongFlash =
              dangerColumn ===
                columnIndex &&
              feedback?.type ===
                "wrong";

            return (
              <div
                key={`${option}-${columnIndex}`}
                className={[
                  "blocks-column",

                  isActive
                    ? "active"
                    : "",

                  nearLoss
                    ? "near-loss"
                    : "",

                  wrongFlash
                    ? "wrong-flash"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >

                {/* FALLING AREA */}

                <div className="blocks-fall-area">

                  {isActive ? (
                    <div
                      className="falling-block"
                      style={{
                        top:
                          `${
                            (
                              fallRow /
                              MAX_FALL_ROW
                            ) *
                            76
                          }%`,
                      }}
                    >
                      {round.card.term}
                    </div>
                  ) : null}

                </div>


                {/* LOSS LINE */}

                <div
                  className={
                    nearLoss
                      ? "blocks-loss-line critical"
                      : "blocks-loss-line"
                  }
                >

                  <span>
                    {nearLoss
                      ? "⚠ ONE LEFT"
                      : "LOSS LINE"}
                  </span>

                </div>


                {/* STACK AREA */}

                <div className="blocks-stack">

                  {Array.from({
                    length:
                      MAX_STACK,
                  }).map(
                    (
                      _,
                      index
                    ) => {
                      /*
                       * Reverse visual order:
                       *
                       * bottom slot fills first.
                       */
                      const filled =
                        index >=
                        MAX_STACK -
                          stackHeight;

                      return (
                        <div
                          key={index}
                          className={
                            filled
                              ? "stack-slot filled"
                              : "stack-slot"
                          }
                        />
                      );
                    }
                  )}

                </div>


                {/* STACK STATUS */}

                <div className="blocks-column-status">

                  <strong>
                    {stackHeight}/{MAX_STACK}
                  </strong>

                  <span>
                    {stackHeight === 0
                      ? "Clear"
                      : remaining === 1
                        ? "DANGER"
                        : `${remaining} until loss`}
                  </span>

                </div>


                {/* ANSWER */}

                <button
                  type="button"

                  className={
                    isActive
                      ? "blocks-answer active"
                      : "blocks-answer"
                  }

                  onClick={() => {
                    if (!locked) {
                      setPlayerColumn(
                        columnIndex
                      );
                    }
                  }}
                >
                  {option}
                </button>

              </div>
            );
          }
        )}

      </div>


      {/* CONTROLS */}

      <div className="blocks-controls">

        <button
          className="button"
          type="button"
          onClick={moveLeft}
        >
          ← Left
        </button>

        <button
          className="button primary"
          type="button"
          onClick={hardDrop}
        >
          Drop
        </button>

        <button
          className="button"
          type="button"
          onClick={moveRight}
        >
          Right →
        </button>

      </div>

    </section>
  );
}
