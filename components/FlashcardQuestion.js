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
  const [dragX, setDragX] = useState(0);
  const [transition, setTransition] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const flipCard = useCallback(() => {
    if (submitting) return;
    setRevealed(
      (current) => !current
    );
  }, [submitting]);

  const assessCard = useCallback(async (correct) => {
    if (!revealed || submitting) return;
    setSubmitting(true);
    setDragX(0);
    setTransition(correct ? "exit-right" : "exit-left");
    await new Promise((resolve) => window.setTimeout(resolve, 240));
    const advanced = await onResult(correct);
    if (advanced === false) {
      setTransition("");
      setSubmitting(false);
    }
  }, [onResult, revealed, submitting]);

  const markMissed = useCallback(() => assessCard(false), [assessCard]);
  const markCorrect = useCallback(() => assessCard(true), [assessCard]);

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
    flipCard,
    markCorrect,
    markMissed,
  ]);

  function beginGesture(event) {
    if (event.pointerType === "mouse") return;
    if (submitting) return;
    gestureStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setTransition("dragging");
  }

  function moveGesture(event) {
    const start = gestureStart.current;
    if (!start || submitting) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.25) return;
    setDragX(Math.max(-150, Math.min(150, deltaX)));
  }

  function finishGesture(event) {
    const start = gestureStart.current;
    gestureStart.current = null;
    if (!start || submitting) return;
    const direction = horizontalSwipe({ startX: start.x, startY: start.y, endX: event.clientX, endY: event.clientY });
    if (!direction) {
      setDragX(0);
      setTransition("");
      return;
    }

    if (revealed) {
      if (direction === "right") markCorrect();
      else markMissed();
      return;
    }
    setDragX(0);
    setTransition(direction === "left" ? "exit-left" : "exit-right");
    window.setTimeout(() => {
      if (direction === "left" && hasNext && onNext) onNext();
      else if (direction === "right" && hasPrevious && onPrevious) onPrevious();
      else setTransition("");
    }, 220);
  }

  return (
    <div
      className={`flashcard-session ${revealed ? "is-revealed" : ""} ${transition}`}
      style={{ "--flashcard-drag-x": `${dragX}px`, "--flashcard-drag-rotate": `${dragX / 24}deg` }}
      onPointerDown={beginGesture}
      onPointerMove={moveGesture}
      onPointerUp={finishGesture}
      onPointerCancel={() => { gestureStart.current = null; setDragX(0); setTransition(""); }}
    >

      <div className="flashcard-swipe-stamp missed" style={{ opacity: transition === "dragging" && revealed ? Math.min(1, Math.max(0, -dragX / 90)) : undefined }} aria-hidden="true">MISSED</div>
      <div className="flashcard-swipe-stamp got-it" style={{ opacity: transition === "dragging" && revealed ? Math.min(1, Math.max(0, dragX / 90)) : undefined }} aria-hidden="true">GOT IT</div>

      <div className="flashcard-flip-scene">
        <div className="flashcard-flip-card">
          <section className="flashcard-face flashcard-front">

            <p className="prompt-label">Flashcard</p>

            <h2>{prompt}</h2>

            {hint ? <details className="study-hint"><summary>Show hint</summary><p>{hint}</p></details> : null}

            <button className="button primary" type="button" onClick={(event) => { event.currentTarget.blur(); flipCard(); }}>
              Show answer
            </button>
          </section>

          <section className="flashcard-face flashcard-back" aria-hidden={!revealed}>
            <p className="prompt-label">Answer</p>
            <div className="flashcard-answer">{answer}</div>

            <CardImage src={imageUrl} alt={imageAlt || ""} className="flashcard-answer-image" />

            <p>Did you know it?</p>

            <div className="row-actions centered">

              <button className="button danger" type="button" disabled={submitting} onClick={(event) => { event.currentTarget.blur(); markMissed(); }}>
              <span className="shortcut-key">
                1
              </span>

              Missed
              </button>

              <button className="button primary" type="button" disabled={submitting} onClick={(event) => { event.currentTarget.blur(); markCorrect(); }}>
              <span className="shortcut-key">
                2
              </span>

              Got it
              </button>
            </div>
          </section>
        </div>
      </div>


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
