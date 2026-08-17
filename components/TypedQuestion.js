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
  onAccept,
  hint,
  draftKey,
}) {
  useEffect(() => {
    if (!draftKey) return;
    const saved = localStorage.getItem(`snoozelet-draft-${draftKey}`);
    if (saved) setTypedAnswer(saved);
  }, [draftKey, setTypedAnswer]);

  useEffect(() => {
    if (!feedback) return;
    const continueWithKeyboard = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (draftKey) localStorage.removeItem(`snoozelet-draft-${draftKey}`);
      onContinue();
    };
    window.addEventListener("keydown", continueWithKeyboard);
    return () => window.removeEventListener("keydown", continueWithKeyboard);
  }, [draftKey, feedback, onContinue]);

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
        autoComplete="off"
      >
        <TextField
          value={typedAnswer}
          onChange={(event) =>
            updateAnswer(event.target.value)
          }
          placeholder="Your answer"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
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
            <div className="answer-comparison"><p><span>Your answer</span><strong>{typedAnswer}</strong></p><p><span>Expected answer</span><strong>{feedback.expected}</strong></p></div>
          ) : null}
          <div className="row-actions">{!feedback.correct && onAccept ? <button className="button" type="button" onClick={() => { if (draftKey) localStorage.removeItem(`snoozelet-draft-${draftKey}`); onAccept(); }}>Accept anyway</button> : null}<button className="button primary" type="button" onClick={continueAndClear}>Continue</button></div>
        </div>
      ) : null}
    </>
  );
}
