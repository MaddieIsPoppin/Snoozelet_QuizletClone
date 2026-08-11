"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import CardImage from "@/components/CardImage";
import { horizontalSwipe } from "@/lib/gestures";

export default function FlashcardQuestion({
  prompt,
  answer,
  imageUrl,
  imageAlt,
  hint,
  onResult,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) {
  const [revealed, setRevealed] =
    useState(false);
  const gestureStart = useRef(null);
  const [gesture, setGesture] = useState("");

  function flipCard() {
    setRevealed(
      (current) => !current
    );
  }

  const markMissed = useCallback(() => {
    if (!revealed) {
      return;
    }

    setRevealed(false);
    onResult(false);
  }, [onResult, revealed]);

  const markCorrect = useCallback(() => {
    if (!revealed) {
      return;
    }

    setRevealed(false);
    onResult(true);
  }, [onResult, revealed]);

  /*
   * Keyboard controls
   */
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return undefined;
    function handleKeyDown(event) {
      const target =
        event.target;

      const tagName =
        target?.tagName
          ?.toLowerCase();

      /*
       * Never steal keyboard input
       * from a text field.
       */
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      const key =
        event.key.toLowerCase();

      /*
       * SPACE / ENTER
       * Flip card
       */
      if (
        event.code === "Space" ||
        event.key === "Enter" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();

        flipCard();
        return;
      }

      /*
       * LEFT
       * Previous flashcard
       */
      if (
        event.key === "ArrowLeft"
      ) {
        event.preventDefault();

        if (
          hasPrevious &&
          onPrevious
        ) {
          setRevealed(false);
          onPrevious();
        }

        return;
      }

      /*
       * RIGHT
       * Next flashcard
       */
      if (
        event.key === "ArrowRight"
      ) {
        event.preventDefault();

        if (
          hasNext &&
          onNext
        ) {
          setRevealed(false);
          onNext();
        }

        return;
      }

      /*
       * 1 / M
       * Missed
       */
      if (
        revealed &&
        (
          key === "1" ||
          key === "m"
        )
      ) {
        event.preventDefault();

        markMissed();
        return;
      }

      /*
       * 2 / G
       * Got it
       */
      if (
        revealed &&
        (
          key === "2" ||
          key === "g"
        )
      ) {
        event.preventDefault();

        markCorrect();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    revealed,
    hasPrevious,
    hasNext,
    onPrevious,
    onNext,
    onResult,
    markCorrect,
    markMissed,
  ]);

  function beginGesture(event) {
    if (event.pointerType === "mouse") return;
    gestureStart.current = { x: event.clientX, y: event.clientY };
    setGesture("");
  }

  function finishGesture(event) {
    const start = gestureStart.current;
    gestureStart.current = null;
    if (!start) return;
    const direction = horizontalSwipe({ startX: start.x, startY: start.y, endX: event.clientX, endY: event.clientY });
    if (!direction) return;

    if (revealed) {
      if (direction === "right") { setGesture("got-it"); markCorrect(); }
      else { setGesture("missed"); markMissed(); }
      return;
    }
    if (direction === "left" && hasNext && onNext) { setGesture("next"); setRevealed(false); onNext(); }
    if (direction === "right" && hasPrevious && onPrevious) { setGesture("previous"); setRevealed(false); onPrevious(); }
  }

  return (
    <div className={`flashcard-session gesture-${gesture}`} onPointerDown={beginGesture} onPointerUp={finishGesture} onPointerCancel={() => { gestureStart.current = null; }}>

      <p className="prompt-label">
        Flashcard
      </p>

      <h2>
        {prompt}
      </h2>

      {hint && !revealed ? <details className="study-hint"><summary>Show hint</summary><p>{hint}</p></details> : null}


      {!revealed ? (
        <button
          className="button primary"
          type="button"
          onClick={(event) => {
            event.currentTarget.blur();
            flipCard();
          }}
        >
          Show answer
        </button>
      ) : (
        <>

          <div className="flashcard-answer">
            {answer}
          </div>

          <CardImage
            src={imageUrl}
            alt={imageAlt || ""}
            className="flashcard-answer-image"
          />

          <p>
            Did you know it?
          </p>

          <div className="row-actions centered">

            <button
              className="button danger"
              type="button"
              onClick={(event) => {
                event.currentTarget.blur();
                markMissed();
              }}
            >
              <span className="shortcut-key">
                1
              </span>

              Missed
            </button>


            <button
              className="button primary"
              type="button"
              onClick={(event) => {
                event.currentTarget.blur();
                markCorrect();
              }}
            >
              <span className="shortcut-key">
                2
              </span>

              Got it
            </button>

          </div>

        </>
      )}


      {/* KEYBOARD HELP */}

      <div className="flashcard-shortcuts">

        <span>
          <kbd>Space</kbd>
          Flip
        </span>

        <span>
          <kbd>↑</kbd><kbd>↓</kbd>
          Flip
        </span>

        <span>
          <kbd>←</kbd>
          Previous
        </span>

        <span>
          <kbd>→</kbd>
          Next
        </span>

        {revealed ? (
          <>
            <span>
              <kbd>1</kbd>
              Missed
            </span>

            <span>
              <kbd>2</kbd>
              Got it
            </span>
          </>
        ) : null}

      </div>

      <p className="flashcard-swipe-help">{revealed ? "Swipe left: Missed · Swipe right: Got it" : "Swipe to move between cards"}</p>

    </div>
  );
}
