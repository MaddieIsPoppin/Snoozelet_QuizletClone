"use client";

import { useEffect, useRef, useState } from "react";
import { queueReview } from "@/lib/offline-reviews";

export default function useReviewSaver({ mode, answerDirection, grading }) {
  const [xpNotice, setXpNotice] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("idle");
  const [reviewError, setReviewError] = useState("");
  const xpTimerRef = useRef(null);
  const savingAttemptRef = useRef(null);
  const attemptIdsRef = useRef(new Map());
  const attemptGenerationRef = useRef(0);
  const sessionIdRef = useRef(null);

  useEffect(() => () => {
    if (xpTimerRef.current) window.clearTimeout(xpTimerRef.current);
  }, []);

  function resetReviewState() {
    setReviewStatus("idle");
    setReviewError("");
  }

  function beginAttemptGeneration() {
    attemptGenerationRef.current += 1;
    sessionIdRef.current = window.crypto.randomUUID();
    attemptIdsRef.current.clear();
  }

  function showXpNotice(data) {
    if (!data?.xpGained) return;
    if (xpTimerRef.current) window.clearTimeout(xpTimerRef.current);

    setXpNotice({
      amount: data.xpGained,
      totalXp: data.progress?.totalXp,
      level: data.progress?.level,
      baseXp: data.baseXp,
      bonusXp: data.bonusXp,
      multiplier: data.flowMultiplier,
    });
    xpTimerRef.current = window.setTimeout(() => setXpNotice(null), 2000);
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

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save review");

      showXpNotice(data);
      setReviewStatus("success");
      return data;
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) {
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
      if (savingAttemptRef.current === attemptId) savingAttemptRef.current = null;
    }
  }

  return {
    beginAttemptGeneration,
    resetReviewState,
    reviewError,
    reviewStatus,
    saveReview,
    xpNotice,
  };
}
