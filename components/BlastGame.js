"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { shuffle } from "@/lib/collections";
import useReviewSaver from "@/hooks/useReviewSaver";

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
  const { beginAttemptGeneration, saveReview } = useReviewSaver({ mode: "multiple", answerDirection, grading: "lenient" });

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  const [lives, setLives] = useState(3);

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [round, setRound] = useState(1);
  const [lastPoints, setLastPoints] = useState(0);

  const [feedbackId, setFeedbackId] = useState(null);
  const [feedbackType, setFeedbackType] = useState(null);

  const [locked, setLocked] = useState(false);

  const [timeLeft, setTimeLeft] = useState(6000);
  const [baseTime, setBaseTime] = useState(8);
  const [betweenQuestions, setBetweenQuestions] = useState(550);
  const [startingLives, setStartingLives] = useState(3);
  const [speedUp, setSpeedUp] = useState(true);

  const timerRef = useRef(null);
  const transitionRef = useRef(null);
  const roundStartedRef = useRef(null);
  const lockedRef = useRef(false);
  const gameOverRef = useRef(false);
  const livesRef = useRef(3);

  useEffect(() => {
    setMounted(true);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (transitionRef.current) window.clearTimeout(transitionRef.current);
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

  const durationForRound = (roundNumber) => Math.max(2500, baseTime * 1000 - (speedUp ? (roundNumber - 1) * 140 : 0));
  const roundDuration = durationForRound(round);

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
    }, 100);
  }

  function startGame() {
    if (cards.length < 2) {
      return;
    }

    const newQueue = shuffle(cards);
    beginAttemptGeneration();
    if (transitionRef.current) window.clearTimeout(transitionRef.current);

    setQueue(newQueue);
    setCurrentIndex(0);

    setScore(0);
    setCombo(0);
    setBestCombo(0);

    setLives(startingLives);

    setCorrectCount(0);
    setWrongCount(0);
    setRound(1);
    setLastPoints(0);

    setFeedbackId(null);
    setFeedbackType(null);

    setLocked(false);
    lockedRef.current = false;
    livesRef.current = startingLives;

    setGameOver(false);
    gameOverRef.current = false;
    setGameStarted(true);

    window.setTimeout(() => {
      startRoundTimer(durationForRound(1));
    }, 50);
  }

  function nextQuestion() {
    if (gameOverRef.current) return;
    const nextIndex = currentIndex + 1;
    const nextRound = round + 1;
    setRound(nextRound);

    if (nextIndex >= queue.length) {
      const reshuffled = shuffle(cards);

      setQueue(reshuffled);
      setCurrentIndex(0);

      startRoundTimer(durationForRound(nextRound));

      return;
    }

    setCurrentIndex(nextIndex);

    startRoundTimer(durationForRound(nextRound));
  }

  function endGame() {
    stopRoundTimer();
    if (transitionRef.current) window.clearTimeout(transitionRef.current);
    gameOverRef.current = true;
    lockedRef.current = true;
    setGameOver(true);
    setLocked(true);
  }

  function loseLife() {
    const nextLives = Math.max(0, livesRef.current - 1);
    livesRef.current = nextLives;
    setLives(nextLives);
    return nextLives;
  }

  function scheduleNext(delay = betweenQuestions) {
    if (transitionRef.current) window.clearTimeout(transitionRef.current);
    transitionRef.current = window.setTimeout(() => {
      if (gameOverRef.current) return;
      setFeedbackId(null);
      setFeedbackType(null);
      setLastPoints(0);
      setLocked(false);
      lockedRef.current = false;
      nextQuestion();
    }, delay);
  }

  function handleTimeout() {
    if (lockedRef.current || gameOverRef.current) {
      return;
    }

    lockedRef.current = true;
    setLocked(true);
    setFeedbackType("timeout");
    setCombo(0);
    setWrongCount((value) => value + 1);

    const remainingLives = loseLife();
    if (remainingLives === 0) transitionRef.current = window.setTimeout(endGame, 900);
    else scheduleNext(Math.max(800, betweenQuestions));
  }

  function handleAnswer(option, index) {
    if (
      lockedRef.current ||
      gameOverRef.current ||
      !currentCard
    ) {
      return;
    }

    stopRoundTimer();
    lockedRef.current = true;
    setLocked(true);

    const isCorrect =
      normalize(option) ===
      normalize(correctAnswer);

    // Saving must never sit in the critical gameplay path. The review hook
    // queues offline attempts and reports errors independently.
    void saveReview(currentCard, isCorrect, "multiple", option, {
      questionKey: `blast-${round}-${roundStartedRef.current}`,
      offlineExpected: correctAnswer,
    });

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
      setLastPoints(points);

      setScore(
        (value) => value + points
      );

      setCorrectCount(
        (value) => value + 1
      );

      scheduleNext(Math.min(700, Math.max(400, betweenQuestions)));

      return;
    }

    setFeedbackType("wrong");

    setCombo(0);

    setWrongCount(
      (value) => value + 1
    );

    const remainingLives = loseLife();
    if (remainingLives === 0) transitionRef.current = window.setTimeout(endGame, 900);
    else scheduleNext(Math.max(800, betweenQuestions));
  }

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;
    function handleKeyDown(event) {
      if (event.target?.matches?.("input, textarea, select, [contenteditable=true]")) return;
      const answerIndex = Number(event.key) - 1;
      if (answerIndex >= 0 && answerIndex < 4) {
        event.preventDefault();
        document.querySelectorAll(".blast-target")[answerIndex]?.click();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, gameOver]);

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
      <section className="study-shell blast-game blast-setup-screen">
        <div className="study-header">
          <div>
            <p className="eyebrow">
              Game mode
            </p>

            <h1>Blast</h1>

            <p>
              Answer quickly, maintain accurate recall, and continue
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
            <span>{startingLives} lives</span>
            <span>{speedUp ? "Faster every round" : "Steady timer"}</span>
            <span>Correct-run score multiplier</span>
          </div>

          <div className="blast-customize-grid">
            <label>Seconds per question<select value={baseTime} onChange={(event) => setBaseTime(Number(event.target.value))}><option value="6">6 seconds</option><option value="8">8 seconds</option><option value="10">10 seconds</option><option value="15">15 seconds</option><option value="20">20 seconds</option></select></label>
            <label>Feedback pace<select value={betweenQuestions} onChange={(event) => setBetweenQuestions(Number(event.target.value))}><option value="300">Rapid — 0.3s</option><option value="550">Arcade — 0.55s</option><option value="900">Clear — 0.9s</option><option value="1500">Study — 1.5s</option></select></label>
            <label>Lives<select value={startingLives} onChange={(event) => setStartingLives(Number(event.target.value))}><option value="1">1 life</option><option value="3">3 lives</option><option value="5">5 lives</option><option value="10">10 lives</option></select></label>
            <label className="blast-toggle"><input type="checkbox" checked={speedUp} onChange={(event) => setSpeedUp(event.target.checked)} /> Speed up each round</label>
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
      <section className="study-shell blast-game blast-results-screen">
        <div className="empty-state blast-results">
          <p className="eyebrow">
            Game over
          </p>

          <h1>{score} points</h1>

          <p>{accuracy >= 90 ? "Excellent accuracy under pressure." : accuracy >= 70 ? "Strong run — your recall is getting faster." : "Try a steadier timer and prioritise accuracy."}</p>

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
              <p>Best correct run</p>
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
    <section className={`study-shell blast-game blast-playing${progress <= 30 ? " blast-danger" : ""}${feedbackType === "wrong" || feedbackType === "timeout" ? " blast-life-lost" : ""}${locked ? " blast-locked" : ""}`}>
      <div className="blast-hud">
        <div>
          <span className="blast-hud-label">
            Score
          </span>

          <strong>{score}</strong>
        </div>

        <div>
          <span className="blast-hud-label">
            Correct run
          </span>

          <strong>{combo}x</strong>
        </div>

        <div>
          <span className="blast-hud-label">
            Lives
          </span>

          <strong className="blast-lives">
            <span className="blast-hearts">{"♥".repeat(lives)}{"♡".repeat(startingLives - lives)}</span>
            <span className="blast-life-count">♥ {lives}</span>
          </strong>
        </div>
      </div>

      <div className="blast-time-row">
        <span>Time</span>
        <strong>{(timeLeft / 1000).toFixed(1)}s</strong>
      </div>
      <div className="blast-time-track">
        <div
          className="blast-time-fill"
          role="progressbar"
          aria-label="Time remaining"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(progress)}
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
          <div className="blast-feedback timeout" role="status" aria-live="assertive">
            <strong>Time&apos;s up</strong><span>Correct answer: {correctAnswer}</span>
          </div>
        ) : feedbackType === "correct" ? (
          <div className="blast-feedback correct" role="status" aria-live="assertive"><strong>✓ Correct</strong><span>+{lastPoints} · {combo} correct run</span></div>
        ) : feedbackType === "wrong" ? (
          <div className="blast-feedback wrong" role="status" aria-live="assertive"><strong>× Incorrect</strong><span>Correct answer: {correctAnswer}</span></div>
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

          if (feedbackType && normalize(option) === normalize(correctAnswer)) {
            className += " blast-target-correct";
          }

          return (
            <button
              key={`${option}-${index}`}
              type="button"
              className={className}
              disabled={locked}
              aria-label={`${index + 1}. ${option}${feedbackType === "correct" && feedbackId === index ? ". Correct" : feedbackType === "wrong" && feedbackId === index ? ". Incorrect" : feedbackType && normalize(option) === normalize(correctAnswer) ? ". Correct answer" : ""}`}
              onClick={() =>
                handleAnswer(option, index)
              }
            >
              <kbd className="blast-key">{index + 1}</kbd>
              <span>
                {option}
              </span>
              {feedbackType === "correct" && feedbackId === index ? <b className="blast-result-icon" aria-hidden="true">✓</b> : null}
              {feedbackType === "wrong" && feedbackId === index ? <b className="blast-result-icon" aria-hidden="true">×</b> : null}
              {feedbackType === "wrong" && feedbackId !== index && normalize(option) === normalize(correctAnswer) ? <b className="blast-result-icon" aria-hidden="true">✓</b> : null}
            </button>
          );
        })}
      </div>

      <div className="blast-footer">
        <span>
          {correctCount} correct
        </span>

        <span>
          Round {round}
        </span>

        <span>
          {Math.ceil(timeLeft / 1000)}s
        </span>
      </div>
    </section>
  );
}
