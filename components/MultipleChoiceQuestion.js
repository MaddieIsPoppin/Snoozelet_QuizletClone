"use client";

export default function MultipleChoiceQuestion({
  prompt,
  options,
  expectedAnswer,
  feedback,
  selectedChoice,
  normalizeFlexible,
  onChoose,
  onContinue,
}) {
  return (
    <>
      <p className="eyebrow">
        Choose the correct answer
      </p>

      <h2>{prompt}</h2>

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
              disabled={Boolean(feedback)}
              onClick={() => onChoose(choice)}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {feedback ? (
        <div
          className={
            feedback.correct
              ? "answer-feedback correct"
              : "answer-feedback incorrect"
          }
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
    </>
  );
}