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

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildOptions(card, cards, answerDirection) {
  const correct =
    answerDirection === "definition"
      ? card.definition
      : card.term;

  const alternatives = cards
    .filter((item) => item.id !== card.id)
    .map((item) =>
      answerDirection === "definition"
        ? item.definition
        : item.term
    )
    .filter(
      (value) =>
        normalize(value) !== normalize(correct)
    );

  return shuffle([
    correct,
    ...shuffle(alternatives).slice(0, 3),
  ]);
}

export default function BlastGame({
  deck,
  cards = [],
}) {
  const [mounted, setMounted] = useState(false);

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [answerDirection, setAnswerDirection] =
    useState("definition");

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  const [lives, setLives] = useState(3);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const [feedbackId, setFeedbackId] = useState(null);
  const [feedbackType, setFeedbackType] = useState(null);

  const [locked, setLocked] = useState(false);

  const [timeLeft, setTimeLeft] = useState(6000);

  const timerRef = useRef(null);
  const roundStartedRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const currentCard = queue[currentIndex];

  const prompt =
    currentCard
      ? answerDirection === "definition"
        ? currentCard.term
        : currentCard.definition
      : "";

  const correctAnswer =
    currentCard
      ? answerDirection === "definition"
        ? currentCard.definition
        : currentCard.term
      : "";

  const options = useMemo(() => {
    if (!currentCard) {
      return [];
    }

    return buildOptions(
      currentCard,
      cards,
      answerDirection
    );
  }, [
    currentCard,
    cards,
    answerDirection,
  ]);

  const roundDuration = Math.max(
    2500,
    6000 - currentIndex * 120
  );

  function stopRoundTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startRoundTimer(duration) {
    stopRoundTimer();

    const startedAt = Date.now();
    roundStartedRef.current = startedAt;

    setTimeLeft(duration);

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(
        0,
        duration - elapsed
      );

      setTimeLeft(remaining);

      if (remaining <= 0) {
        stopRoundTimer();
        handleTimeout();
      }
    }, 50);
  }

  function startGame() {
    if (cards.length < 2) {
      return;
    }

    const newQueue = shuffle(cards);

    setQueue(newQueue);
    setCurrentIndex(0);

    setScore(0);
    setCombo(0);
    setBestCombo(0);

    setLives(3);

    setCorrectCount(0);
    setWrongCount(0);

    setFeedbackId(null);
    setFeedbackType(null);

    setLocked(false);

    setGameOver(false);
    setGameStarted(true);

    window.setTimeout(() => {
      startRoundTimer(6000);
    }, 100);
  }

  function nextQuestion() {
    const nextIndex = currentIndex + 1;

    if (nextIndex >= queue.length) {
      const reshuffled = shuffle(cards);

      setQueue(reshuffled);
      setCurrentIndex(0);

      window.setTimeout(() => {
        startRoundTimer(
          Math.max(
            2500,
            6000 - nextIndex * 120
          )
        );
      }, 120);

      return;
    }

    setCurrentIndex(nextIndex);

    window.setTimeout(() => {
      startRoundTimer(
        Math.max(
          2500,
          6000 - nextIndex * 120
        )
      );
    }, 120);
  }

  function endGame() {
    stopRoundTimer();
    setGameOver(true);
    setLocked(true);
  }

  function loseLife() {
    setLives((currentLives) => {
      const nextLives = currentLives - 1;

      if (nextLives <= 0) {
        window.setTimeout(() => {
          endGame();
        }, 450);
      }

      return Math.max(0, nextLives);
    });
  }

  function handleTimeout() {
    if (locked || gameOver) {
      return;
    }

    setLocked(true);
    setFeedbackType("timeout");
    setCombo(0);
    setWrongCount((value) => value + 1);

    loseLife();

    window.setTimeout(() => {
      if (!gameOver) {
        setFeedbackType(null);
        setLocked(false);

        nextQuestion();
      }
    }, 700);
  }

  function handleAnswer(option, index) {
    if (
      locked ||
      gameOver ||
      !currentCard
    ) {
      return;
    }

    stopRoundTimer();
    setLocked(true);

    const isCorrect =
      normalize(option) ===
      normalize(correctAnswer);

    setFeedbackId(index);

    if (isCorrect) {
      setFeedbackType("correct");

      const nextCombo = combo + 1;

      setCombo(nextCombo);

      setBestCombo((value) =>
        Math.max(value, nextCombo)
      );

      const multiplier =
        1 + Math.floor(nextCombo / 3) * 0.25;

      const speedBonus =
        Math.round(timeLeft / 100);

      const points =
        Math.round(
          (100 + speedBonus) * multiplier
        );

      setScore(
        (value) => value + points
      );

      setCorrectCount(
        (value) => value + 1
      );

      window.setTimeout(() => {
        setFeedbackId(null);
        setFeedbackType(null);
        setLocked(false);

        nextQuestion();
      }, 500);

      return;
    }

    setFeedbackType("wrong");

    setCombo(0);

    setWrongCount(
      (value) => value + 1
    );

    loseLife();

    window.setTimeout(() => {
      if (!gameOver) {
        setFeedbackId(null);
        setFeedbackType(null);
        setLocked(false);

        nextQuestion();
      }
    }, 700);
  }

  if (!mounted) {
    return (
      <section className="study-shell">
        <div className="empty-state">
          <p>Loading Blast...</p>
        </div>
      </section>
    );
  }

  if (cards.length < 2) {
    return (
      <section className="study-shell">
        <div className="empty-state">
          <h2>Blast needs more cards</h2>

          <p>
            Add at least two cards to this deck before
            starting Blast.
          </p>
        </div>
      </section>
    );
  }

  if (!gameStarted) {
    return (
      <section className="study-shell blast-game">
        <div className="study-header">
          <div>
            <p className="eyebrow">
              Game mode
            </p>

            <h1>Blast</h1>

            <p>
              Answer quickly, build your combo, and survive
              as the rounds get faster.
            </p>
          </div>
        </div>

        <section className="editor-panel blast-setup">
          <h2>Answer with</h2>

          <div className="direction-toggle">
            <button
              type="button"
              className={
                answerDirection === "definition"
                  ? "button primary"
                  : "button"
              }
              onClick={() =>
                setAnswerDirection("definition")
              }
            >
              Definitions
            </button>

            <button
              type="button"
              className={
                answerDirection === "term"
                  ? "button primary"
                  : "button"
              }
              onClick={() =>
                setAnswerDirection("term")
              }
            >
              Terms
            </button>
          </div>

          <div className="blast-rules">
            <span>3 lives</span>
            <span>Faster every round</span>
            <span>Combo score multiplier</span>
          </div>

          <button
            className="button primary"
            type="button"
            onClick={startGame}
          >
            Start Blast
          </button>
        </section>
      </section>
    );
  }

  if (gameOver) {
    const totalAnswers =
      correctCount + wrongCount;

    const accuracy =
      totalAnswers > 0
        ? Math.round(
            (correctCount / totalAnswers) * 100
          )
        : 0;

    return (
      <section className="study-shell blast-game">
        <div className="empty-state blast-results">
          <p className="eyebrow">
            Game over
          </p>

          <h1>{score} points</h1>

          <div className="metrics-strip small">
            <div>
              <span>{correctCount}</span>
              <p>Correct</p>
            </div>

            <div>
              <span>{accuracy}%</span>
              <p>Accuracy</p>
            </div>

            <div>
              <span>{bestCombo}x</span>
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

  const progress =
    roundDuration > 0
      ? Math.max(
          0,
          Math.min(
            100,
            (timeLeft / roundDuration) * 100
          )
        )
      : 0;

  return (
    <section className="study-shell blast-game">
      <div className="blast-hud">
        <div>
          <span className="blast-hud-label">
            Score
          </span>

          <strong>{score}</strong>
        </div>

        <div>
          <span className="blast-hud-label">
            Combo
          </span>

          <strong>{combo}x</strong>
        </div>

        <div>
          <span className="blast-hud-label">
            Lives
          </span>

          <strong>
            {"♥".repeat(lives)}
            {"♡".repeat(3 - lives)}
          </strong>
        </div>
      </div>

      <div className="blast-time-track">
        <div
          className="blast-time-fill"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <section className="blast-question-card">
        <p className="eyebrow">
          Blast
        </p>

        <h1>{prompt}</h1>

        {feedbackType === "timeout" ? (
          <div className="blast-feedback timeout">
            Too slow!
          </div>
        ) : null}
      </section>

      <div className="blast-target-grid">
        {options.map((option, index) => {
          let className = "blast-target";

          if (
            feedbackId === index &&
            feedbackType === "correct"
          ) {
            className += " blast-target-correct";
          }

          if (
            feedbackId === index &&
            feedbackType === "wrong"
          ) {
            className += " blast-target-wrong";
          }

          return (
            <button
              key={`${option}-${index}`}
              type="button"
              className={className}
              disabled={locked}
              onClick={() =>
                handleAnswer(option, index)
              }
            >
              <span>
                {option}
              </span>
            </button>
          );
        })}
      </div>

      <div className="blast-footer">
        <span>
          {correctCount} correct
        </span>

        <span>
          Round {currentIndex + 1}
        </span>

        <span>
          {Math.ceil(timeLeft / 1000)}s
        </span>
      </div>
    </section>
  );
}