"use client";

import { useRef, useState } from "react";
import { queueReview } from "@/lib/offline-reviews";

export default function useReviewSaver({ mode, answerDirection, grading }) {
  const [reviewStatus, setReviewStatus] = useState("idle");
  const [reviewError, setReviewError] = useState("");
  const savingAttemptRef = useRef(null);
  const attemptIdsRef = useRef(new Map());
  const attemptGenerationRef = useRef(0);
  const sessionIdRef = useRef(null);

  function resetReviewState() {
    setReviewStatus("idle");
    setReviewError("");
  }

  function beginAttemptGeneration() {
    attemptGenerationRef.current += 1;
    sessionIdRef.current = window.crypto.randomUUID();
    attemptIdsRef.current.clear();
  }

  async function saveReview(
    card,
    wasCorrect,
    reviewMode,
    userAnswer = "",
    options = {}
  ) {
    const { questionKey, presentedAnswer, offlineExpected = "" } = options;
    const attemptKey = [
      attemptGenerationRef.current,
      mode,
      reviewMode,
      card.id,
      questionKey,
      answerDirection,
    ].join(":");

    let attemptId = attemptIdsRef.current.get(attemptKey);
    if (!attemptId) {
      attemptId = window.crypto.randomUUID();
      attemptIdsRef.current.set(attemptKey, attemptId);
    }
    if (!sessionIdRef.current) sessionIdRef.current = window.crypto.randomUUID();
    if (savingAttemptRef.current === attemptId) return null;

    savingAttemptRef.current = attemptId;
    setReviewStatus("saving");
    setReviewError("");
    const payload = {
      attemptId,
      sessionId: sessionIdRef.current,
      cardId: card.id,
      mode: reviewMode,
      answer: userAnswer,
      answerDirection,
      grading,
      selfAssessedCorrect: reviewMode === "flashcard" ? wasCorrect : undefined,
      presentedAnswer,
    };

    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 10000);
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      const data = await response.json();
      if (!response.ok) {
        const requestError = new Error(data.error || "Could not save review");
        requestError.transient = response.status === 408 || response.status === 429 || response.status >= 500;
        throw requestError;
      }

      setReviewStatus("success");
      return data;
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError || error?.name === "AbortError" || error?.transient) {
        try {
          await queueReview(payload);
          setReviewStatus("queued");
          return {
            cardId: card.id,
            correct: Boolean(wasCorrect),
            expected: offlineExpected,
            xpGained: 0,
            queued: true,
          };
        } catch (queueError) {
          console.error("Could not queue offline review:", queueError);
        }
      }
      console.error("Could not save review:", error);
      setReviewStatus("error");
      setReviewError(error.message || "Could not save review");
      return null;
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (savingAttemptRef.current === attemptId) savingAttemptRef.current = null;
    }
  }

  return {
    beginAttemptGeneration,
    resetReviewState,
    reviewError,
    reviewStatus,
    saveReview,
  };
}
