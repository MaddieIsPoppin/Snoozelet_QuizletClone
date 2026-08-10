"use client";

export default function TestBuilder({
  deck,
  cards,
  testQuestionCount,
  setTestQuestionCount,
  testTypes,
  setTestTypes,
  answerDirection,
  setAnswerDirection,
  onStartTest,
}) {
  const enabledCount =
    Object.values(testTypes).filter(Boolean).length;

  return (
    <section className="study-shell">
      <div className="study-header">
        <div>
          <p className="eyebrow">Test</p>

          <h1>Create a test</h1>

          <p>
            Build a practice test from the cards in{" "}
            <strong>{deck.title}</strong>.
          </p>
        </div>
      </div>

      <div className="test-builder">
        <section className="editor-panel">
          <h2>Number of questions</h2>

          <label className="form-stack">
            Questions

            <input
              type="number"
              min="1"
              max={cards.length}
              value={testQuestionCount}
              onChange={(event) => {
                const value = Number(
                  event.target.value
                );

                setTestQuestionCount(
                  Math.max(
                    1,
                    Math.min(
                      value,
                      cards.length
                    )
                  )
                );
              }}
            />
          </label>

          <p className="helper">
            This deck contains {cards.length} cards.
          </p>
        </section>

        <section className="editor-panel">
          <h2>Question types</h2>

          <div className="test-type-options">
            <label>
              <input
                type="checkbox"
                checked={testTypes.multiple}
                onChange={(event) =>
                  setTestTypes((existing) => ({
                    ...existing,
                    multiple:
                      event.target.checked,
                  }))
                }
              />

              Multiple choice
            </label>

            <label>
              <input
                type="checkbox"
                checked={testTypes.typed}
                onChange={(event) =>
                  setTestTypes((existing) => ({
                    ...existing,
                    typed:
                      event.target.checked,
                  }))
                }
              />

              Written
            </label>

            <label>
              <input
                type="checkbox"
                checked={testTypes.truefalse}
                onChange={(event) =>
                  setTestTypes((existing) => ({
                    ...existing,
                    truefalse:
                      event.target.checked,
                  }))
                }
              />

              True / False
            </label>
          </div>
        </section>

        <section className="editor-panel">
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
        </section>

        <button
          className="button primary"
          type="button"
          disabled={enabledCount === 0}
          onClick={onStartTest}
        >
          Start test
        </button>

        {enabledCount === 0 ? (
          <p className="auth-error">
            Select at least one question type.
          </p>
        ) : null}
      </div>
    </section>
  );
}