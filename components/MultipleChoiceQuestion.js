"use client";

import { useEffect, useRef } from "react";

export default function MultipleChoiceQuestion({
  prompt,
  options,
  expectedAnswer,
  feedback,
  selectedChoice,
  normalizeFlexible,
  onChoose,
  onContinue,
  hint,
}) {
  const feedbackRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;
    function handleKeyDown(event) {
      if (event.target?.matches?.("input, textarea, select, [contenteditable=true]")) return;
      if (feedback && event.key === "Enter") { event.preventDefault(); onContinue(); return; }
      const index = Number(event.key) - 1;
      if (!feedback && index >= 0 && index < options.length) { event.preventDefault(); onChoose(options[index]); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedback, onChoose, onContinue, options]);

  useEffect(() => {
    if (!feedback) return undefined;
    const frame = window.requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "nearest",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [feedback]);

  return (
    <div className={`multiple-choice-question${feedback ? " has-feedback" : ""}`}>
      <p className="eyebrow">
        Choose the correct answer
      </p>

      <h2>{prompt}</h2>

      {hint && !feedback ? <details className="study-hint"><summary>Need a hint?</summary><p>{hint}</p></details> : null}

      <div className="choice-grid">
        {options.map((choice, index) => {
          let className = "choice-button";

          if (feedback) {
            if (
              normalizeFlexible(choice) ===
              normalizeFlexible(expectedAnswer)
            ) {
              className += " choice-correct";
            } else if (choice === selectedChoice) {
              className += " choice-wrong";
            }
          }

          return (
            <button
              className={className}
              type="button"
              key={`${choice}-${index}`}
              disabled={Boolean(feedback || selectedChoice !== null)}
              onClick={() => onChoose(choice)}
            >
              <kbd className="choice-key">{index + 1}</kbd>
              {choice}
            </button>
          );
        })}
      </div>

      {feedback ? (
        <div
          ref={feedbackRef}
          className={
            feedback.correct
              ? "answer-feedback correct"
              : "answer-feedback incorrect"
          }
          role="status"
          aria-live="polite"
        >
          <h3>
            {feedback.correct
              ? "Correct"
              : "Incorrect"}
          </h3>

          {!feedback.correct ? (
            <p>
              Correct answer:{" "}
              <strong>{feedback.expected}</strong>
            </p>
          ) : null}

          <button
            className="button primary"
            type="button"
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      ) : null}
    </div>
  );
}
