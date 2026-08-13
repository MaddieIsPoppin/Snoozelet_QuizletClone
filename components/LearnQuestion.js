"use client";

import { useMemo, useState } from "react";
import MultipleChoiceQuestion from "@/components/MultipleChoiceQuestion";
import {
  answerForDirection,
  makeMultipleChoiceOptions,
  normalizeFlexibleAnswer,
  promptForDirection,
} from "@/lib/study";

export default function LearnQuestion({
  card,
  cards,
  answerDirection,
  onResult,
}) {

  const [
    feedback,
    setFeedback,
  ] = useState(null);


  const [
    selectedChoice,
    setSelectedChoice,
  ] = useState(null);


  const prompt = promptForDirection(card, answerDirection);


  const expected = answerForDirection(card, answerDirection);


  const options =
    useMemo(
      () =>
        makeMultipleChoiceOptions(
          card,
          cards,
          answerDirection
        ),
      [
        card,
        cards,
        answerDirection,
      ]
    );


  function resetLearnQuestion() {
    setFeedback(null);

    setSelectedChoice(
      null
    );

  }


  async function finishLearnQuestion(
    wasCorrect,
    reviewMode,
    userAnswer
  ) {
    const saved = await onResult({
      wasCorrect,
      reviewMode,
      userAnswer,
      expected,
    });

    if (saved) {
      resetLearnQuestion();
    }
  }


  /* ---------------------------------------------------------
     LEARN MULTIPLE CHOICE
     --------------------------------------------------------- */

  function chooseLearnAnswer(choice) {
    if (feedback) {
      return;
    }

      const wasCorrect =
        normalizeFlexibleAnswer(
          choice
        ) ===
        normalizeFlexibleAnswer(
          expected
        );

    setSelectedChoice(choice);

    setFeedback({ correct: wasCorrect, expected });
  }


  return (
      <MultipleChoiceQuestion
        prompt={
          prompt
        }

        options={
          options
        }

        expectedAnswer={
          expected
        }

        feedback={
          feedback
        }

        selectedChoice={
          selectedChoice
        }

        normalizeFlexible={
          normalizeFlexibleAnswer
        }

        onChoose={
          chooseLearnAnswer
        }

        onContinue={() =>
          finishLearnQuestion(
            feedback.correct,
            "multiple",
            selectedChoice
          )
        }
      />
  );
}
