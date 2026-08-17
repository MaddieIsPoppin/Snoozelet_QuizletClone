"use client";
import { useEffect } from "react";

export default function TrueFalseQuestion({
  prompt,
  displayedAnswer,
  feedback,
  selectedAnswer,
  onAnswer,
  onContinue,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.target?.matches?.("input, textarea, select, [contenteditable=true]")) return;
      if (feedback && event.key === "Enter") { event.preventDefault(); onContinue(); }
      else if (!feedback && event.key.toLowerCase() === "t") onAnswer("True");
      else if (!feedback && event.key.toLowerCase() === "f") onAnswer("False");
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedback, onAnswer, onContinue]);
  return (
    <>
      <p className="eyebrow">
        Is this correct?
      </p>

      <h2>{prompt}</h2>

      <div className="true-false-definition">
        {displayedAnswer}
      </div>

      <div className="choice-grid">
        <button
          className={`button ${feedback ? (feedback.expected === "True" ? "choice-correct" : selectedAnswer === "True" ? "choice-wrong" : "") : ""}`}
          type="button"
          disabled={Boolean(feedback)}
          onClick={() => onAnswer("True")}
        >
          <kbd className="choice-key">T</kbd>
          True
        </button>

        <button
          className={`button ${feedback ? (feedback.expected === "False" ? "choice-correct" : selectedAnswer === "False" ? "choice-wrong" : "") : ""}`}
          type="button"
          disabled={Boolean(feedback)}
          onClick={() => onAnswer("False")}
        >
          <kbd className="choice-key">F</kbd>
          False
        </button>
      </div>
      {feedback ? (
        <div className={`answer-feedback ${feedback.correct ? "correct" : "incorrect"}`} role="status" aria-live="polite">
          <h3>{feedback.correct ? "Correct!" : "Incorrect"}</h3>
          <p>{feedback.correct ? "Correct — continue when ready." : `The statement is ${feedback.expected}.`}</p>
          <button className="button primary" type="button" onClick={onContinue}>Continue</button>
        </div>
      ) : null}
    </>
  );
}
