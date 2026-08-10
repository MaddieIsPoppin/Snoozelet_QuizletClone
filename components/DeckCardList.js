"use client";

import { useMemo, useState } from "react";

import {
  deleteCardAction,
  updateCardAction,
} from "@/app/actions";

import TextField from "@/components/TextField";

export default function DeckCardList({
  cards = [],
  deckId,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredCards = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return cards.filter((card) => {
      const attempts =
        card.correct_count +
        card.incorrect_count;

      /*
       * SEARCH
       */
      const matchesSearch =
        !query ||
        card.term
          .toLowerCase()
          .includes(query) ||
        card.definition
          .toLowerCase()
          .includes(query);

      if (!matchesSearch) {
        return false;
      }

      /*
       * FILTER
       */
      if (filter === "weak") {
        return Boolean(card.weak);
      }

      if (filter === "unstudied") {
        return attempts === 0;
      }

      if (filter === "studied") {
        return attempts > 0;
      }

      return true;
    });
  }, [
    cards,
    search,
    filter,
  ]);

  function clearFilters() {
    setSearch("");
    setFilter("all");
  }

  return (
    <div className="deck-card-browser">

      {/* SEARCH + FILTERS */}

      <div className="deck-card-browser-toolbar">

        <div className="deck-card-search">

          <span className="deck-search-icon">
            ⌕
          </span>

          <input
            type="search"
            value={search}
            placeholder="Search terms or definitions..."
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search ? (
            <button
              type="button"
              className="deck-search-clear"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              ×
            </button>
          ) : null}

        </div>


        <div
          className="deck-card-filters"
          aria-label="Filter cards"
        >

          <button
            type="button"
            className={
              filter === "all"
                ? "deck-filter active"
                : "deck-filter"
            }
            onClick={() =>
              setFilter("all")
            }
          >
            All
          </button>


          <button
            type="button"
            className={
              filter === "weak"
                ? "deck-filter active"
                : "deck-filter"
            }
            onClick={() =>
              setFilter("weak")
            }
          >
            Weak
          </button>


          <button
            type="button"
            className={
              filter === "studied"
                ? "deck-filter active"
                : "deck-filter"
            }
            onClick={() =>
              setFilter("studied")
            }
          >
            Studied
          </button>


          <button
            type="button"
            className={
              filter === "unstudied"
                ? "deck-filter active"
                : "deck-filter"
            }
            onClick={() =>
              setFilter("unstudied")
            }
          >
            Unstudied
          </button>

        </div>

      </div>


      {/* RESULTS INFO */}

      <div className="deck-browser-summary">

        <span>
          Showing{" "}
          <strong>
            {filteredCards.length}
          </strong>{" "}
          of {cards.length} cards
        </span>

        {(search ||
          filter !== "all") ? (
          <button
            type="button"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        ) : null}

      </div>


      {/* NO MATCHES */}

      {filteredCards.length === 0 ? (

        <div className="deck-browser-empty">

          <div className="deck-browser-empty-icon">
            ⌕
          </div>

          <h3>
            No cards found
          </h3>

          <p>
            Try another search or remove the
            current filter.
          </p>

          <button
            className="button"
            type="button"
            onClick={clearFilters}
          >
            Show all cards
          </button>

        </div>

      ) : (

        <div className="deck-card-list">

          {filteredCards.map(
            (card, index) => {

              const attempts =
                card.correct_count +
                card.incorrect_count;

              const accuracy =
                attempts > 0
                  ? Math.round(
                      (
                        card.correct_count /
                        attempts
                      ) *
                        100
                    )
                  : 0;

              return (
                <article
                  className="deck-term-card"
                  key={card.id}
                >

                  <div className="deck-term-number">
                    {index + 1}
                  </div>


                  <div className="deck-term-main">

                    <div className="deck-term-text">

                      <div>
                        <span className="deck-term-label">
                          Term
                        </span>

                        <strong>
                          {card.term}
                        </strong>
                      </div>


                      <div>
                        <span className="deck-term-label">
                          Definition
                        </span>

                        <p>
                          {card.definition}
                        </p>
                      </div>

                    </div>


                    <div className="deck-term-stats">

                      {attempts === 0 ? (
                        <span className="card-status-unseen">
                          Not studied
                        </span>
                      ) : (
                        <>
                          <span>
                            {accuracy}% accuracy
                          </span>

                          <span>
                            {attempts} attempt
                            {attempts === 1
                              ? ""
                              : "s"}
                          </span>

                          <span>
                            {card.streak} streak
                          </span>
                        </>
                      )}

                      {card.weak ? (
                        <span className="weak-tag">
                          Weak
                        </span>
                      ) : null}

                    </div>


                    <details className="deck-card-editor">

                      <summary>
                        Edit card
                      </summary>


                      <form
                        action={updateCardAction}
                        className="deck-card-edit-form"
                      >

                        <input
                          name="deckId"
                          type="hidden"
                          value={deckId}
                        />

                        <input
                          name="cardId"
                          type="hidden"
                          value={card.id}
                        />


                        <label>
                          Term

                          <TextField
                            name="term"
                            defaultValue={card.term}
                            required
                          />
                        </label>


                        <label>
                          Definition

                          <TextField
                            textarea
                            name="definition"
                            defaultValue={
                              card.definition
                            }
                            rows="3"
                            required
                          />
                        </label>


                        <button
                          className="button primary"
                          type="submit"
                        >
                          Save changes
                        </button>

                      </form>


                      <form
                        action={deleteCardAction}
                        className="deck-delete-card-form"
                      >

                        <input
                          name="deckId"
                          type="hidden"
                          value={deckId}
                        />

                        <input
                          name="cardId"
                          type="hidden"
                          value={card.id}
                        />

                        <button
                          className="button danger"
                          type="submit"
                        >
                          Delete card
                        </button>

                      </form>

                    </details>

                  </div>

                </article>
              );
            }
          )}

        </div>

      )}

    </div>
  );
}