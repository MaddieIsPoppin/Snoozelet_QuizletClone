"use client";

import MascotCoach from "@/components/MascotCoach";

function questionTypeLabel(type) {
  if (type === "multiple") {
    return "Multiple choice";
  }

  if (type === "typed") {
    return "Written";
  }

  if (
    type === "truefalse" ||
    type === "true-false"
  ) {
    return "True / False";
  }

  return type;
}

export default function TestResults({
  deck,
  testResults,
  onReviewMistakes,
  onRetakeTest,
  onCreateAnotherTest,
}) {
  const total = testResults.length;

  const correctCount = testResults.filter(
    (result) => result.correct
  ).length;

  const incorrectCount =
    total - correctCount;

  const percentage =
    total > 0
      ? Math.round(
          (correctCount / total) * 100
        )
      : 0;

  const mistakes = testResults.filter(
    (result) => !result.correct
  );
  const totalTimeMs = testResults.reduce((sum, result) => sum + (result.durationMs || 0), 0);
  const averageSeconds = total ? Math.round(totalTimeMs / total / 1000) : 0;
  const slowest = [...testResults].sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))[0];

  const typeStats = [
    "multiple",
    "typed",
    "truefalse",
  ]
    .map((type) => {
      const results =
        testResults.filter(
          (result) =>
            result.type === type
        );

      if (results.length === 0) {
        return null;
      }

      const right =
        results.filter(
          (result) =>
            result.correct
        ).length;

      return {
        type,
        right,
        total: results.length,

        percentage: Math.round(
          (right / results.length) *
            100
        ),
        averageSeconds: Math.round(results.reduce((sum, result) => sum + (result.durationMs || 0), 0) / results.length / 1000),
      };
    })
    .filter(Boolean);

  return (
    <section className="study-shell test-results">
      <div className="study-header">
        <div>
          <p className="eyebrow">
            Test complete
          </p>

          <h1>Your results</h1>

          <p>
            Here&apos;s how you did
            on{" "}
            <strong>
              {deck.title}
            </strong>
            .
          </p>
        </div>
        <MascotCoach
          compact
          mood={percentage >= 60 ? "happy" : "normal"}
          messages={
            percentage >= 80
              ? ["That was strong work!", "A quick review now will help it stick."]
              : ["Every miss points to what to practise next.", "Review the mistakes, then try again."]
          }
        />
      </div>

      <section className="test-score-card">
        <div className="test-score-main">
          <span className="test-score-number">
            {percentage}%
          </span>

          <div>
            <h2>
              {percentage === 100
                ? "Perfect score!"
                : percentage >= 80
                  ? "Great work!"
                  : percentage >= 60
                    ? "Getting there"
                    : "Keep practising"}
            </h2>

            <p>
              You got {correctCount}{" "}
              out of {total} questions
              correct.
            </p>
          </div>
        </div>

        <div className="metrics-strip small">
          <div>
            <span>
              {correctCount}
            </span>
            <p>Correct</p>
          </div>

          <div>
            <span>
              {incorrectCount}
            </span>
            <p>Incorrect</p>
          </div>

          <div>
            <span>
              {percentage}%
            </span>
            <p>Score</p>
          </div>
          <div><span>{averageSeconds}s</span><p>Average time</p></div>
        </div>
      </section>

      {slowest ? (
        <p className="test-timing-note">
          Most time spent: <strong>{slowest.prompt}</strong> ({Math.round((slowest.durationMs || 0) / 1000)}s)
        </p>
      ) : null}

      {typeStats.length > 0 ? (
        <section className="test-breakdown">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">
                Question types
              </p>

              <h2>
                Score breakdown
              </h2>
            </div>
          </div>

          <div className="metrics-strip">
            {typeStats.map(
              (stat) => (
                <div key={stat.type}>
                  <span>
                    {stat.percentage}%
                  </span>
                  <span>{stat.averageSeconds}s average</span>

                  <p>
                    {questionTypeLabel(
                      stat.type
                    )}
                    <br />
                    {stat.right}/
                    {stat.total}
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      ) : null}

      <section className="test-answer-review">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">
              Answer review
            </p>

            <h2>
              Every question
            </h2>
          </div>
        </div>

        <div className="review-list">
          {testResults.map(
            (result, index) => (
              <article
                className={`test-result-row ${
                  result.correct
                    ? "result-correct"
                    : "result-wrong"
                }`}
                key={result.id}
              >
                <div className="test-result-heading">
                  <span
                    className={
                      result.correct
                        ? "dot good"
                        : "dot miss"
                    }
                  />

                  <strong>
                    Question{" "}
                    {index + 1}
                  </strong>

                  <span>
                    {questionTypeLabel(
                      result.type
                    )}
                  </span>
                </div>

                <div className="test-result-content">
                  <p className="eyebrow">
                    Question
                  </p>

                  <h3>
                    {result.prompt}
                  </h3>

                  <div className="test-answer-grid">
                    <div>
                      <p className="eyebrow">
                        Your answer
                      </p>

                      <p>
                        {result.userAnswer ||
                          "No answer"}
                      </p>
                    </div>

                    <div>
                      <p className="eyebrow">
                        Correct answer
                      </p>

                      <p>
                        {
                          result.correctAnswer
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      </section>

      {mistakes.length > 0 ? (
        <section className="test-mistakes">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">
                Needs work
              </p>

              <h2>
                {mistakes.length}{" "}
                {mistakes.length === 1
                  ? "mistake"
                  : "mistakes"}{" "}
                to review
              </h2>
            </div>
          </div>

          <div className="deck-grid">
            {mistakes.map(
              (result) => (
                <article
                  className="deck-card modern"
                  key={`mistake-${result.id}`}
                >
                  <div className="deck-card-top">
                    <p className="eyebrow">
                      {questionTypeLabel(
                        result.type
                      )}
                    </p>

                    <h3>
                      {result.prompt}
                    </h3>
                  </div>

                  <div>
                    <p>
                      <strong>
                        Your answer:
                      </strong>{" "}
                      {result.userAnswer ||
                        "No answer"}
                    </p>

                    <p>
                      <strong>
                        Correct answer:
                      </strong>{" "}
                      {
                        result.correctAnswer
                      }
                    </p>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      ) : (
        <section className="empty-state">
          <h2>
            You got everything right!
          </h2>

          <p>
            There are no mistakes to
            review from this test.
          </p>
        </section>
      )}

      <div className="row-actions test-result-actions">
        {mistakes.length > 0 ? (
          <button
            className="button primary"
            type="button"
            onClick={onReviewMistakes}
          >
            Review mistakes
          </button>
        ) : null}

        <button
          className="button"
          type="button"
          onClick={onRetakeTest}
        >
          Retake test
        </button>

        <button
          className="button"
          type="button"
          onClick={
            onCreateAnotherTest
          }
        >
          Create another test
        </button>
      </div>
    </section>
  );
}
