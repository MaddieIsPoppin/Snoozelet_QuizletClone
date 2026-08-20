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
import Breadcrumbs from "@/components/Breadcrumbs";
import ConfirmActionForm from "@/components/ConfirmActionForm";

import { requireUser } from "@/lib/auth";
import { getCards, getDeck } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DeckPage({ params, searchParams }) {
  const user = await requireUser();

  const { deckId } = await params;
  const query = await searchParams;

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
      {query?.created === "1" ? <div className="success-banner" role="status"><span>✓</span><div><strong>Deck created and saved locally</strong><p>You can add cards below or start studying immediately.</p></div></div> : null}
      {query?.saved ? <div className="success-banner" role="status"><span>✓</span><div><strong>{query.saved === "deleted" ? "Card deleted" : query.saved === "import" ? "Cards imported" : query.saved === "deck" ? "Deck details saved" : "Card saved"}</strong><p>Your local database is up to date.</p></div></div> : null}
      <Breadcrumbs module={deck.subject_name} moduleId={deck.subject_id} unit={deck.folder_name} unitId={deck.folder_id} deck={deck.title} />

      {/* ====================================================
          HEADER
          ==================================================== */}

      <header className="deck-page-header">

        <Link
          href="/library"
          className="deck-back-link"
        >
          ← Library
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

          <Link className="deck-mode-card" href={`/decks/${deck.id}/match`}>
            <div className="deck-mode-icon">◈</div>
            <div><h3>Match</h3><p>Pair terms and definitions in a quick visual round.</p></div>
            <span className="deck-mode-arrow">→</span>
          </Link>

          <Link className="deck-mode-card deck-mode-primary" href={`/decks/${deck.id}/recall`}>
            <div className="deck-mode-icon">R</div>
            <div><h3>Deep Recall</h3><p>Missed cards return until you can retrieve them.</p></div>
            <span className="deck-mode-arrow">→</span>
          </Link>

          <Link className="deck-mode-card" href={`/decks/${deck.id}/blast`}>
            <div className="deck-mode-icon">✦</div>
            <div><h3>Blast</h3><p>Fast, focused rounds when you want study to feel like play.</p></div>
            <span className="deck-mode-arrow">→</span>
          </Link>

        </div>

      </section>


      <section className="deck-section focus-entry-section">
        <div>
          <p className="eyebrow">Focused route</p>
          <h2>Stay in one learning loop</h2>
          <p>Deep recall, confidence check, then a short recognition drill.</p>
        </div>
        <Link className="button primary" href={`/decks/${deck.id}/focus`}>Begin focused session</Link>
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


        <ConfirmActionForm action={deleteDeckAction} fields={{deckId:deck.id}} message={`Delete ${deck.title} and all of its cards?`} label="Delete deck"/>

      </section>

    </main>
  );
}
