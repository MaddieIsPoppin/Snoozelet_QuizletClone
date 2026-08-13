import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addCardAction,
  deleteDeckAction,
  updateDeckAction,
} from "@/app/actions";

import TextField from "@/components/TextField";
import DeckCardList from "@/components/DeckCardList";
import ImageUploadField from "@/components/ImageUploadField";
import CardCreationGuide from "@/components/CardCreationGuide";
import PendingForm from "@/components/PendingForm";
import SmartPasteImporter from "@/components/SmartPasteImporter";
import StudyContextTools from "@/components/StudyContextTools";
import Breadcrumbs from "@/components/Breadcrumbs";

import { requireUser } from "@/lib/auth";
import { getCards, getDeck } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DeckPage({ params }) {
  const user = await requireUser();

  const { deckId } = await params;

  const deck = await getDeck(
    deckId,
    user.id
  );

  if (!deck) {
    notFound();
  }

  const cards = await getCards(
    deck.id,
    user.id
  );

  return (
    <main className="deck-page-v2">
      <Breadcrumbs module={deck.subject_name} moduleId={deck.subject_id} unit={deck.folder_name} unitId={deck.folder_id} deck={deck.title} />

      {/* ====================================================
          HEADER
          ==================================================== */}

      <header className="deck-page-header">

        <Link
          href="/"
          className="deck-back-link"
        >
          ← My decks
        </Link>

        <div className="deck-header-actions">

          <Link
            className="button primary"
            href={`/decks/${deck.id}/learn`}
          >
            ▶ Start studying
          </Link>

        </div>

      </header>


      {/* ====================================================
          DECK OVERVIEW
          ==================================================== */}

      <section className="deck-overview-card">

        <div className="deck-overview-copy">

          <p className="eyebrow">
            Study set
          </p>

          <h1>
            {deck.title}
          </h1>

          <p className="deck-overview-description">
            {deck.description ||
              "Add cards, choose a study mode, and start learning."}
          </p>

        </div>


        <div
          className="deck-overview-stats"
          aria-label="Deck summary"
        >

          <article>
            <strong>
              {deck.card_count}
            </strong>

            <span>
              Cards
            </span>
          </article>


          <article>
            <strong>
              {deck.due_count}
            </strong>

            <span>
              Due
            </span>
          </article>


          <article>
            <strong>
              {deck.weak_count}
            </strong>

            <span>
              Weak
            </span>
          </article>


          <article>
            <strong>
              {deck.accuracy}%
            </strong>

            <span>
              Accuracy
            </span>
          </article>

        </div>

      </section>

      <details className="deck-settings-editor">
        <summary>Edit deck name and description</summary>
        <form action={updateDeckAction} className="deck-settings-form">
          <input name="deckId" type="hidden" value={deck.id} />
          <label>Deck name<TextField name="title" defaultValue={deck.title} maxLength="120" required /></label>
          <label>Description<TextField textarea name="description" defaultValue={deck.description || ""} rows="2" /></label>
          <button className="button primary" type="submit">Save deck details</button>
        </form>
      </details>

      <aside className="mobile-companion-note">
        <span>☾</span>
        <div><strong>Ready for review</strong><p>Study this deck or play a game here. Add and edit cards from Snoozelet on Windows.</p></div>
      </aside>


      {/* ====================================================
          STUDY
          ==================================================== */}

      <section className="deck-section">

        <div className="deck-section-heading">

          <div>
            <p className="eyebrow">
              Study
            </p>

            <h2>
              Choose how you want to learn
            </h2>
          </div>

        </div>


        <div className="deck-study-grid">

          <Link
            className="deck-mode-card deck-mode-primary"
            href={`/decks/${deck.id}/learn`}
          >

            <div className="deck-mode-icon">
              ◇
            </div>

            <div>
              <h3>
                Learn
              </h3>

              <p>
                Mixed practice that adapts to
                what you get right and wrong.
              </p>
            </div>

            <span className="deck-mode-arrow">
              →
            </span>

          </Link>


          <Link
            className="deck-mode-card"
            href={`/decks/${deck.id}/flashcards`}
          >

            <div className="deck-mode-icon">
              ▱
            </div>

            <div>
              <h3>
                Flashcards
              </h3>

              <p>
                Review terms one card at a time.
              </p>
            </div>

            <span className="deck-mode-arrow">
              →
            </span>

          </Link>


          <Link
            className="deck-mode-card"
            href={`/decks/${deck.id}/test`}
          >

            <div className="deck-mode-icon">
              ✓
            </div>

            <div>
              <h3>
                Test
              </h3>

              <p>
                Build a practice exam from
                this deck.
              </p>
            </div>

            <span className="deck-mode-arrow">
              →
            </span>

          </Link>


          <Link className="deck-mode-card" href={`/decks/${deck.id}/multiple-choice`}>
            <div className="deck-mode-icon">A</div>
            <div><h3>Multiple choice</h3><p>Choose the right answer from related cards.</p></div>
            <span className="deck-mode-arrow">→</span>
          </Link>

          <Link
            className="deck-mode-card"
            href={`/decks/${deck.id}/typed`}
          >

            <div className="deck-mode-icon">
              ✎
            </div>

            <div>
              <h3>
                Typed
              </h3>

              <p>
                Type the answer yourself for
                stronger recall.
              </p>
            </div>

            <span className="deck-mode-arrow">
              →
            </span>

          </Link>

        </div>

      </section>


      <section className="deck-section focus-entry-section">
        <div>
          <p className="eyebrow">Snoo&apos;s guided route</p>
          <h2>Stay in one learning loop</h2>
          <p>Recall, check your confidence, then cool down with a short constellation repair.</p>
        </div>
        <Link className="button primary" href={`/decks/${deck.id}/focus`}>Begin Focus Journey</Link>
      </section>

      {/* ====================================================
          GAMES
          ==================================================== */}

      <section className="deck-section">

        <div className="deck-section-heading">

          <div>
            <p className="eyebrow">
              Games
            </p>

            <h2>
              Practice without it feeling like a test
            </h2>
          </div>

        </div>


        <div className="deck-game-grid">

          <Link
            className="deck-game-card deck-game-match"
            href={`/decks/${deck.id}/match`}
          >

            <div className="deck-game-icon">
              ◈
            </div>

            <div>
              <p className="eyebrow">
                Speed
              </p>

              <h3>
                Match
              </h3>

              <p>
                Pair terms with their definitions
                as fast as you can.
              </p>
            </div>

            <span className="deck-game-arrow">
              →
            </span>

          </Link>


          <Link
            className="deck-game-card deck-game-blast"
            href={`/decks/${deck.id}/blast`}
          >

            <div className="deck-game-icon">
              ✦
            </div>

            <div>
              <p className="eyebrow">
                Arcade
              </p>

              <h3>
                Blast
              </h3>

              <p>
                Build combos and answer before
                the timer runs out.
              </p>
            </div>

            <span className="deck-game-arrow">
              →
            </span>

          </Link>


        </div>

      </section>


      {/* ====================================================
          CARDS
          ==================================================== */}

      <section className="deck-section deck-content-section">

        <div className="deck-section-heading">

          <div>
            <p className="eyebrow">
              Deck content
            </p>

            <h2>
              {cards.length} cards
            </h2>
          </div>

          <a
            className="button"
            href="#manage-deck"
          >
            ＋ Add cards
          </a>

        </div>


        {cards.length === 0 ? (

          <section className="empty-state">

            <h2>
              No cards yet
            </h2>

            <p>
              Add a card manually or import a set
              below.
            </p>

            <a
              className="button primary"
              href="#manage-deck"
            >
              Add your first card
            </a>

          </section>

        ) : (

          <DeckCardList
            cards={cards}
            deckId={deck.id}
          />

        )}

      </section>


      {/* ====================================================
          MANAGE DECK
          ==================================================== */}

      <section
        className="deck-section deck-manage-section"
        id="manage-deck"
      >

        <div className="deck-section-heading">

          <div>
            <p className="eyebrow">
              Manage
            </p>

            <h2>
              Add or import cards
            </h2>
          </div>

        </div>


        <CardCreationGuide />

        <div className="deck-manage-grid">

          {/* ADD CARD */}

          <article className="deck-tool-card">

            <div className="deck-tool-heading">

              <div className="deck-tool-icon">
                ＋
              </div>

              <div>
                <h3>
                  Add a card with an image
                </h3>

                <p>
                  Add an illustrated card or a longer answer.
                </p>
              </div>

            </div>


            <PendingForm
              action={addCardAction}
              className="form-stack"
              submitLabel="Add card"
              pendingLabel="Saving card…"
            >

              <input
                name="deckId"
                type="hidden"
                value={deck.id}
              />


              <label>
                Term

                <TextField
                  name="term"
                  placeholder="Enter a term"
                  required
                />
              </label>


              <label>
                Definition

                <TextField
                  textarea
                  name="definition"
                  rows="4"
                  placeholder="Enter the definition"
                  required
                />
              </label>

              <ImageUploadField />

              <label>
                Hint (optional)
                <TextField name="hint" placeholder="A small clue without giving away the answer" />
              </label>


            </PendingForm>

          </article>


          {/* IMPORT */}

          <article className="deck-tool-card">

            <div className="deck-tool-heading">

              <div className="deck-tool-icon">
                ⇧
              </div>

              <div>
                <h3>
                  Import cards
                </h3>

                <p>
                  Paste a full set or upload a CSV.
                </p>
              </div>

            </div>


            <SmartPasteImporter deckId={deck.id} existingCards={cards} />

          </article>

        </div>

      </section>

      <StudyContextTools subject={deck.title} decks={[deck]} cards={cards.map((card) => ({ ...card, attempts: card.correct_count + card.incorrect_count, accuracy: card.correct_count + card.incorrect_count ? Math.round(card.correct_count / (card.correct_count + card.incorrect_count) * 100) : 0, due: card.due_at <= new Date().toISOString() }))} />


      {/* ====================================================
          DANGER ZONE
          ==================================================== */}

      <section className="deck-danger-zone">

        <div>

          <p className="eyebrow">
            Deck settings
          </p>

          <h2>
            Danger zone
          </h2>

          <p>
            Deleting a deck removes the deck and
            all of its cards.
          </p>

        </div>


        <form action={deleteDeckAction}>

          <input
            name="deckId"
            type="hidden"
            value={deck.id}
          />

          <button
            className="button danger"
            type="submit"
          >
            Delete deck
          </button>

        </form>

      </section>

    </main>
  );
}
