import Link from "next/link";
import StudySession from "@/components/StudySession";
import BrandMark from "@/components/BrandMark";
import { loadStudyRoute } from "@/lib/study-route";
import { normalizeTestTypes } from "@/lib/study";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TestPage({
  params,
  searchParams,
}) {
  const query = await searchParams;
  const { cards, deck } = await loadStudyRoute(params);

  const started =
    query?.start === "1";

  const selectedTypes = normalizeTestTypes(query?.types);

  const requestedCount =
    query?.count === "all"
      ? cards.length
      : Number(query?.count);

  const testCount =
    requestedCount &&
    requestedCount > 0
      ? Math.min(
          requestedCount,
          cards.length
        )
      : cards.length;

  const answerDirection = query?.answer === "term" ? "term" : "definition";

  if (!started) {
    return (
      <main className="page study-page">
        <header className="topbar">
          <Link
            className="brand"
            href={`/decks/${deck.id}`}
          >
            <BrandMark />

            <span>{deck.title}</span>
          </Link>
        </header>

        <section className="editor-panel test-builder">
          <p className="eyebrow">
            Test
          </p>

          <h1>
            Create a new test
          </h1>

          <p>
            Build a focused practice test, answer without distractions,
            then review every result with clear feedback.
          </p>

          <div className="test-builder-benefits"><span>Mixed question order</span><span>Automatic marking</span><span>Mistake review</span></div>

          <form
            method="GET"
            className="form-stack"
          >
            <input
              name="start"
              type="hidden"
              value="1"
            />

            <label>
              Number of questions

              <select
                name="count"
                defaultValue="all"
              >
                {cards.length >= 5 ? (
                  <option value="5">
                    5 questions
                  </option>
                ) : null}

                {cards.length >= 10 ? (
                  <option value="10">
                    10 questions
                  </option>
                ) : null}

                {cards.length >= 20 ? (
                  <option value="20">
                    20 questions
                  </option>
                ) : null}

                <option value="all">
                  All {cards.length} questions
                </option>
              </select>
            </label>

            <fieldset className="test-options">
              <legend>
                Question types
              </legend>

              <label className="test-checkbox">
                <input
                  defaultChecked
                  name="types"
                  type="checkbox"
                  value="multiple"
                />

                <span><strong>Multiple choice</strong><small>Fast recognition with related distractors.</small></span>
              </label>

              <label className="test-checkbox">
                <input
                  defaultChecked
                  name="types"
                  type="checkbox"
                  value="true-false"
                />

                <span><strong>True or false</strong><small>Quickly check whether concepts connect.</small></span>
              </label>
            </fieldset>

            <label>
              Answer with

              <select name="answer" defaultValue="definition">
                <option value="definition">Definitions</option>
                <option value="term">Terms</option>
              </select>
            </label>

            <button
              className="button primary"
              type="submit"
            >
              Build and start test
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page study-page">
      <header className="topbar">
        <Link
          className="brand"
          href={`/decks/${deck.id}`}
        >
          <BrandMark />

          <span>{deck.title}</span>
        </Link>

        <Link
          className="button"
          href={`/decks/${deck.id}/test`}
        >
          New test
        </Link>
      </header>

      <StudySession
        deck={deck}
        cards={cards}
        mode="test"
        testCount={testCount}
        testTypes={selectedTypes.length > 0 ? selectedTypes : ["multiple"]}
        initialAnswerDirection={answerDirection}
      />
    </main>
  );
}
