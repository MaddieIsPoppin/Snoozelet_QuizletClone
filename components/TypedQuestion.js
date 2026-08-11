"use client";

import { useEffect } from "react";
import TextField from "@/components/TextField";

export default function TypedQuestion({
  prompt,
  answerDirection,
  typedAnswer,
  setTypedAnswer,
  feedback,
  onSubmit,
  onContinue,
  hint,
  draftKey,
}) {
  useEffect(() => {
    if (!draftKey) return;
    const saved = localStorage.getItem(`snoozelet-draft-${draftKey}`);
    if (saved) setTypedAnswer(saved);
  }, [draftKey, setTypedAnswer]);

  function updateAnswer(value) {
    setTypedAnswer(value);
    if (draftKey) localStorage.setItem(`snoozelet-draft-${draftKey}`, value);
  }

  function continueAndClear() {
    if (draftKey) localStorage.removeItem(`snoozelet-draft-${draftKey}`);
    onContinue();
  }
  return (
    <>
      <p className="eyebrow">
        {answerDirection === "definition"
          ? "Type the definition"
          : "Type the term"}
      </p>

      <h2>{prompt}</h2>

      {hint && !feedback ? <details className="study-hint"><summary>Need a hint?</summary><p>{hint}</p></details> : null}

      <form
        className="typed-answer-form"
        onSubmit={onSubmit}
      >
        <TextField
          name="answer"
          value={typedAnswer}
          onChange={(event) =>
            updateAnswer(event.target.value)
          }
          placeholder="Your answer"
          autoFocus
          required
        />

        {!feedback ? (
          <button
            className="button primary"
            type="submit"
          >
            Check
          </button>
        ) : null}
      </form>

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
              : "Not quite"}
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
            onClick={continueAndClear}
          >
            Continue
          </button>
        </div>
      ) : null}
    </>
  );
}
