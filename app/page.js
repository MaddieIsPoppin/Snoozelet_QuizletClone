import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import SnoozeMascot from "@/components/SnoozeMascot";

import {
  getDecks,
  getRecentReviews,
  getReviewTotals,
  getUserProgress,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage() {
  const user = await requireUser();

  const [decks, totals, recent, progress] = await Promise.all([
    getDecks(user.id),
    getReviewTotals(user.id),
    getRecentReviews(user.id),
    getUserProgress(user.id),
  ]);

  const xpProgress =
    progress.xpForNextLevel > 0
      ? Math.min(
          100,
          Math.round(
            (progress.currentLevelXp /
              progress.xpForNextLevel) *
              100
          )
        )
      : 100;

  /*
   * For now the first deck becomes the
   * quick "continue studying" deck.
   *
   * Later we can change this to genuinely use
   * the most recently studied deck.
   */
  const continueDeck =
    decks.length > 0 ? decks[0] : null;

  return (
    <div className="home-dashboard">

      {/* ====================================================
          PAGE HEADER
          ==================================================== */}

      <header className="dashboard-account-bar">
        <div>
          <p className="dashboard-location">
            ☾ Night study
          </p>
        </div>

        <div className="row-actions">
          <span className="user-pill">
            {user.username}
          </span>

          <form action={logoutAction}>
            <button
              className="button"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>
      </header>


      {/* ====================================================
          HERO
          ==================================================== */}

      <section className="night-hero" id="continue">

        <div className="night-hero-copy">
          <p className="eyebrow">
            Good evening
          </p>

          <h1>
            What are we learning
            <span> tonight?</span>
          </h1>

          <p className="night-hero-description">
            Pick up where you left off, explore a
            study mode, or play something when you
            want learning to feel less like work.
          </p>

          <div className="night-hero-actions">

            {continueDeck ? (
              <Link
                className="button primary hero-primary-button"
                href={`/decks/${continueDeck.id}/learn`}
              >
                ▶ Continue studying
              </Link>
            ) : (
              <Link
                className="button primary hero-primary-button"
                href="/decks/new"
              >
                ＋ Create your first deck
              </Link>
            )}

            <a
              className="button"
              href="#decks"
            >
              Browse library
            </a>

          </div>
        </div>


        <div className="night-hero-mascot">

          <div className="hero-moon-glow" />

          <span className="hero-star hero-star-one">
            ✦
          </span>

          <span className="hero-star hero-star-two">
            ✧
          </span>

          <span className="hero-star hero-star-three">
            ·
          </span>

          <SnoozeMascot
  variant="hero"
  mood="happy"
  message={
    continueDeck
      ? `Let's make some progress tonight!`
      : "Let's make something to study!"
  }
/>

        </div>

      </section>


      {/* ====================================================
          QUICK STATS
          ==================================================== */}

      <section className="dashboard-stat-grid">

        <article className="dashboard-stat-card">
          <div className="stat-icon stat-icon-purple">
            ◎
          </div>

          <div>
            <span className="dashboard-stat-value">
              {totals.accuracy}%
            </span>

            <p>Accuracy</p>
          </div>
        </article>


        <article className="dashboard-stat-card">
          <div className="stat-icon stat-icon-yellow">
            ✦
          </div>

          <div>
            <span className="dashboard-stat-value">
              {progress.totalXp}
            </span>

            <p>Total XP</p>
          </div>
        </article>


        <article className="dashboard-stat-card">
          <div className="stat-icon stat-icon-blue">
            ◈
          </div>

          <div>
            <span className="dashboard-stat-value">
              {totals.weak_cards}
            </span>

            <p>Weak cards</p>
          </div>
        </article>


        <article className="dashboard-stat-card">
          <div className="stat-icon stat-icon-green">
            ↑
          </div>

          <div>
            <span className="dashboard-stat-value">
              Level {progress.level}
            </span>

            <p>Current level</p>
          </div>
        </article>

      </section>


      {/* ====================================================
          CONTINUE CARD
          ==================================================== */}

      {continueDeck ? (
        <section className="dashboard-section">

          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">
                Continue
              </p>

              <h2>
                Jump back in
              </h2>
            </div>
          </div>


          <article className="continue-card">

            <div className="continue-card-icon">
              ▶
            </div>

            <div className="continue-card-main">

              <p className="eyebrow">
                {continueDeck.card_count} terms
              </p>

              <h3>
                {continueDeck.title}
              </h3>

              <p>
                {continueDeck.description ||
                  "Continue studying this deck."}
              </p>

              <div className="continue-card-stats">

                <span>
                  {continueDeck.due_count} due
                </span>

                <span>
                  {continueDeck.weak_count} weak
                </span>

                <span>
                  {continueDeck.accuracy}% accuracy
                </span>

              </div>

            </div>


            <div className="continue-card-actions">

              <Link
                className="button primary"
                href={`/decks/${continueDeck.id}/learn`}
              >
                Continue
              </Link>

              <Link
                className="button"
                href={`/decks/${continueDeck.id}`}
              >
                Open deck
              </Link>

            </div>

          </article>

        </section>
      ) : null}


      {/* ====================================================
          LIBRARY
          ==================================================== */}

      <section
        className="dashboard-section"
        id="decks"
      >

        <div className="dashboard-section-heading">

          <div>
            <p className="eyebrow">
              Your library
            </p>

            <h2>
              Study sets
            </h2>
          </div>

          <Link
            className="button"
            href="/decks/new"
          >
            ＋ Create deck
          </Link>

        </div>


        {decks.length === 0 ? (

          <section className="empty-state">

            <SnoozeMascot
              variant="normal"
              message="It's a little empty in here."
            />

            <h2>
              No decks yet
            </h2>

            <p>
              Create your first study set and we'll
              get started.
            </p>

            <Link
              className="button primary"
              href="/decks/new"
            >
              Create your first deck
            </Link>

          </section>

        ) : (

          <div className="library-grid">

            {decks.map((deck, index) => (

              <article
                className="library-card"
                key={deck.id}
              >

                <div className="library-card-top">

                  <div
                    className={`deck-symbol deck-symbol-${
                      (index % 4) + 1
                    }`}
                  >
                    ▤
                  </div>

                  <span className="deck-term-count">
                    {deck.card_count} terms
                  </span>

                </div>


                <div className="library-card-content">

                  <h3>
                    {deck.title}
                  </h3>

                  <p>
                    {deck.description ||
                      "No description yet."}
                  </p>

                </div>


                <div className="library-card-meta">

                  <span>
                    {deck.due_count} due
                  </span>

                  <span>
                    {deck.weak_count} weak
                  </span>

                </div>


                <div className="library-card-actions">

                  <Link
                    className="button primary"
                    href={`/decks/${deck.id}/learn`}
                  >
                    Study
                  </Link>

                  <Link
                    className="button"
                    href={`/decks/${deck.id}`}
                  >
                    Open
                  </Link>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>


      {/* ====================================================
          STUDY MODES
          ==================================================== */}

      {continueDeck ? (
        <section
          className="dashboard-section"
          id="study"
        >

          <div className="dashboard-section-heading">

            <div>
              <p className="eyebrow">
                Study
              </p>

              <h2>
                Choose how you learn
              </h2>
            </div>

          </div>


          <div className="mode-launcher-grid">

            <Link
              href={`/decks/${continueDeck.id}/learn`}
              className="mode-launcher-card"
            >
              <span className="mode-launcher-icon">
                ◇
              </span>

              <div>
                <h3>Learn</h3>

                <p>
                  Mixed adaptive practice.
                </p>
              </div>
            </Link>


            <Link
              href={`/decks/${continueDeck.id}/flashcards`}
              className="mode-launcher-card"
            >
              <span className="mode-launcher-icon">
                ▱
              </span>

              <div>
                <h3>Flashcards</h3>

                <p>
                  Classic card review.
                </p>
              </div>
            </Link>


            <Link
              href={`/decks/${continueDeck.id}/test`}
              className="mode-launcher-card"
            >
              <span className="mode-launcher-icon">
                ✓
              </span>

              <div>
                <h3>Test</h3>

                <p>
                  Build a practice exam.
                </p>
              </div>
            </Link>


            <Link
              href={`/decks/${continueDeck.id}/typed`}
              className="mode-launcher-card"
            >
              <span className="mode-launcher-icon">
                ✎
              </span>

              <div>
                <h3>Typed</h3>

                <p>
                  Recall answers yourself.
                </p>
              </div>
            </Link>

          </div>

        </section>
      ) : null}


      {/* ====================================================
          GAMES
          ==================================================== */}

      {continueDeck ? (
        <section
          className="dashboard-section"
          id="games"
        >

          <div className="dashboard-section-heading">

            <div>
              <p className="eyebrow">
                Games
              </p>

              <h2>
                Make it less boring
              </h2>
            </div>

            <div className="games-snoo">
              <SnoozeMascot
  variant="mini"
  message="Pick one!"
/>
            </div>

          </div>


          <div className="game-launcher-grid">

            <Link
              href={`/decks/${continueDeck.id}/match`}
              className="game-launcher-card match-launcher"
            >

              <div className="game-launcher-symbol">
                ◈
              </div>

              <div className="game-launcher-copy">

                <p className="eyebrow">
                  Speed game
                </p>

                <h3>
                  Match
                </h3>

                <p>
                  Race the clock and pair terms
                  with their definitions.
                </p>

              </div>

              <span className="launcher-arrow">
                →
              </span>

            </Link>


            <Link
              href={`/decks/${continueDeck.id}/blast`}
              className="game-launcher-card blast-launcher"
            >

              <div className="game-launcher-symbol">
                ✦
              </div>

              <div className="game-launcher-copy">

                <p className="eyebrow">
                  Arcade
                </p>

                <h3>
                  Blast
                </h3>

                <p>
                  Answer quickly, build combos
                  and survive the timer.
                </p>

              </div>

              <span className="launcher-arrow">
                →
              </span>

            </Link>


            <Link
              href={`/decks/${continueDeck.id}/blocks`}
              className="game-launcher-card blocks-launcher"
            >

              <div className="game-launcher-symbol">
                ▦
              </div>

              <div className="game-launcher-copy">

                <p className="eyebrow">
                  Puzzle
                </p>

                <h3>
                  Blocks
                </h3>

                <p>
                  Match falling terms before
                  your stacks reach the top.
                </p>

              </div>

              <span className="launcher-arrow">
                →
              </span>

            </Link>

          </div>

        </section>
      ) : null}


      {/* ====================================================
          XP
          ==================================================== */}

      <section className="dashboard-section">

        <div className="xp-panel dashboard-xp-panel">

          <div className="xp-panel-header">

            <div>
              <p className="eyebrow">
                Your progress
              </p>

              <h2>
                Level {progress.level}
              </h2>
            </div>

            <div className="xp-total">
              <strong>
                {progress.totalXp}
              </strong>

              <span>
                Total XP
              </span>
            </div>

          </div>


          <div className="xp-progress-info">

            <span>
              {progress.currentLevelXp} /{" "}
              {progress.xpForNextLevel} XP
            </span>

            <span>
              {progress.xpUntilNextLevel} XP until
              Level {progress.level + 1}
            </span>

          </div>


          <div
            className="xp-progress-track"
            aria-label={`${xpProgress}% progress to next level`}
          >
            <span
              className="xp-progress-fill"
              style={{
                width: `${xpProgress}%`,
              }}
            />
          </div>

        </div>

      </section>


      {/* ====================================================
          RECENT
          ==================================================== */}

      {recent.length > 0 ? (
        <section className="dashboard-section">

          <div className="dashboard-section-heading">

            <div>
              <p className="eyebrow">
                Recent
              </p>

              <h2>
                Latest reviews
              </h2>
            </div>

          </div>


          <div className="recent-dashboard-list">

            {recent
              .slice(0, 6)
              .map((review) => (

                <div
                  className="recent-dashboard-row"
                  key={review.id}
                >

                  <span
                    className={
                      review.correct
                        ? "recent-result correct"
                        : "recent-result wrong"
                    }
                  >
                    {review.correct
                      ? "✓"
                      : "×"}
                  </span>

                  <div className="recent-review-main">

                    <strong>
                      {review.term}
                    </strong>

                    <span>
                      {review.deck_title}
                    </span>

                  </div>

                  <span className="recent-review-mode">
                    {review.mode}
                  </span>

                </div>

              ))}

          </div>

        </section>
      ) : null}

    </div>
  );
}