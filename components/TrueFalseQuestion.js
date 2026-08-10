"use client";

export default function TrueFalseQuestion({
  prompt,
  displayedAnswer,
  onAnswer,
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
          className="button"
          type="button"
          onClick={() => onAnswer("True")}
        >
          True
        </button>

        <button
          className="button"
          type="button"
          onClick={() => onAnswer("False")}
        >
          False
        </button>
      </div>
    </>
  );
}