"use client";

export default function TrueFalseQuestion({
  prompt,
  displayedAnswer,
  feedback,
  selectedAnswer,
  onAnswer,
  onContinue,
}) {
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
          True
        </button>

        <button
          className={`button ${feedback ? (feedback.expected === "False" ? "choice-correct" : selectedAnswer === "False" ? "choice-wrong" : "") : ""}`}
          type="button"
          disabled={Boolean(feedback)}
          onClick={() => onAnswer("False")}
        >
          False
        </button>
      </div>
      {feedback ? (
        <div className={`answer-feedback ${feedback.correct ? "correct" : "incorrect"}`} role="status" aria-live="polite">
          <h3>{feedback.correct ? "Correct!" : "Incorrect"}</h3>
          <p>{feedback.correct ? "Nice work — keep the streak going." : `The statement is ${feedback.expected}.`}</p>
          <button className="button primary" type="button" onClick={onContinue}>Continue</button>
        </div>
      ) : null}
    </>
  );
}
