"use client";

import { useMemo, useState } from "react";
import MultipleChoiceQuestion from "@/components/MultipleChoiceQuestion";
import TypedQuestion from "@/components/TypedQuestion";
import {
  answerForDirection,
  isStudyAnswerCorrect,
  makeMultipleChoiceOptions,
  normalizeFlexibleAnswer,
  promptForDirection,
} from "@/lib/study";

export default function LearnQuestion({
  card,
  cards,
  answerDirection,
  grading,
  onResult,
}) {

  const [
    questionType,
    setQuestionType,
  ] = useState(
    () =>
      Math.random() >= 0.5
        ? "multiple"
        : "typed"
  );


  const [
    answer,
    setAnswer,
  ] = useState("");


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
    setAnswer("");

    setFeedback(null);

    setSelectedChoice(
      null
    );

    setQuestionType(
      Math.random() >= 0.5
        ? "multiple"
        : "typed"
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

  if (
    questionType ===
    "multiple"
  ) {

    function chooseLearnAnswer(
      choice
    ) {
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

      setSelectedChoice(
        choice
      );

      setFeedback({
        correct:
          wasCorrect,

        expected,
      });
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


  /* ---------------------------------------------------------
     LEARN TYPED
     --------------------------------------------------------- */


  function submitLearnTyped(
    event
  ) {
    event.preventDefault();

    if (feedback) {
      return;
    }

    const wasCorrect =
      isStudyAnswerCorrect(
        answer,
        expected,
        grading
      );

    setFeedback({
      correct:
        wasCorrect,

      expected,
    });
  }


  return (
    <TypedQuestion
      prompt={
        prompt
      }

      answerDirection={
        answerDirection
      }

      typedAnswer={
        answer
      }

      setTypedAnswer={
        setAnswer
      }

      feedback={
        feedback
      }

      onSubmit={
        submitLearnTyped
      }

      onContinue={() =>
        finishLearnQuestion(
          feedback.correct,
          "typed",
          answer
        )
      }
    />
  );
}

