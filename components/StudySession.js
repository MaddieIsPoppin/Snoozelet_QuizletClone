"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import useReviewSaver from "@/hooks/useReviewSaver";

import XpNotice from "@/components/XpNotice";
import TestResults from "@/components/TestResults";
import LearnQuestion from "@/components/LearnQuestion";
import {
  advanceStudyQueue,
  answerForDirection,
  generateTestQuestions,
  makeMultipleChoiceOptions,
  makeTrueFalseQuestion,
  normalizeFlexibleAnswer,
  promptForDirection,
  questionTypeLabel,
  selectLearnCards,
  shuffle,
} from "@/lib/study";
import { isTypedCorrect } from "@/lib/grading";

import FlashcardQuestion from "@/components/FlashcardQuestion";
import MultipleChoiceQuestion from "@/components/MultipleChoiceQuestion";
import TypedQuestion from "@/components/TypedQuestion";
import TrueFalseQuestion from "@/components/TrueFalseQuestion";
import MascotCoach from "@/components/MascotCoach";


/* =========================================================
   MAIN STUDY SESSION
   ========================================================= */


export default function StudySession({
  deck,
  cards = [],
  mode = "learn",
  studyScope = "targeted",
  testCount = cards.length,
  testTypes = ["multiple", "typed", "truefalse"],
  initialAnswerDirection = "definition",
}) {
  const router =
    useRouter();


  /* ---------------------------------------------------------
     HYDRATION
     --------------------------------------------------------- */

  const [
    mounted,
    setMounted,
  ] = useState(false);

  const questionStartedAt = useRef(Date.now());
  const [answerStreak, setAnswerStreak] = useState(0);


  /* ---------------------------------------------------------
     GENERAL STUDY STATE
     --------------------------------------------------------- */

  const [
    answerDirection,
    setAnswerDirection,
  ] = useState(
    initialAnswerDirection
  );

  const [
    grading,
    setGrading,
  ] = useState(
    "lenient"
  );

  const [
    queue,
    setQueue,
  ] = useState(() =>
    mode === "learn"
      ? selectLearnCards(cards, studyScope)
      : cards
  );

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    typedAnswer,
    setTypedAnswer,
  ] = useState("");

  const [
    feedback,
    setFeedback,
  ] = useState(null);

  const [
    selectedChoice,
    setSelectedChoice,
  ] = useState(null);

  const [
    correct,
    setCorrect,
  ] = useState(0);

  const [
    missed,
    setMissed,
  ] = useState(0);

  const [
    completed,
    setCompleted,
  ] = useState(false);


  const {
    beginAttemptGeneration,
    resetReviewState,
    reviewError,
    reviewStatus,
    saveReview,
    xpNotice,
  } = useReviewSaver({ mode, answerDirection, grading });


  /* ---------------------------------------------------------
     TEST STATE
     --------------------------------------------------------- */

  const [
    testQuestions,
    setTestQuestions,
  ] = useState(() =>
    mode === "test"
      ? generateTestQuestions(cards, testCount, testTypes, initialAnswerDirection)
      : []
  );

  const [
    testIndex,
    setTestIndex,
  ] = useState(0);

  const [
    testResults,
    setTestResults,
  ] = useState([]);

  const [
    testFinished,
    setTestFinished,
  ] = useState(false);


  /* ---------------------------------------------------------
     HYDRATION-SAFE INITIALIZATION
     --------------------------------------------------------- */

  useEffect(() => {
    const scopedCards = mode === "learn"
      ? selectLearnCards(cards, studyScope)
      : cards;

    setQueue(mode === "learn" && studyScope === "targeted"
      ? scopedCards
      : shuffle(scopedCards));

    setMounted(true);
  }, [cards, mode, studyScope]);


  /* ---------------------------------------------------------
     CURRENT QUESTION
     --------------------------------------------------------- */

  const currentCard =
    mode === "test"
      ? testQuestions[
          testIndex
        ]?.card
      : queue[
          currentIndex
        ];

  const testQuestion =
    mode === "test"
      ? testQuestions[
          testIndex
        ]
      : null;


  const prompt = currentCard
    ? promptForDirection(currentCard, answerDirection)
    : "";


  const expectedAnswer = currentCard
    ? answerForDirection(currentCard, answerDirection)
    : "";


  /* ---------------------------------------------------------
     MULTIPLE CHOICE OPTIONS
     --------------------------------------------------------- */

  const multipleChoiceOptions =
    useMemo(() => {
      if (!currentCard) {
        return [];
      }

      if (
        mode === "test" &&
        testQuestion?.type ===
          "multiple"
      ) {
        return (
          testQuestion.options ||
          []
        );
      }

      if (
        mode === "multiple"
      ) {
        return makeMultipleChoiceOptions(
          currentCard,
          cards,
          answerDirection
        );
      }

      return [];
    }, [
      currentCard,
      cards,
      answerDirection,
      mode,
      testQuestion,
    ]);


  /* ---------------------------------------------------------
     HYDRATION GUARD
     --------------------------------------------------------- */

  if (!mounted) {
    return (
      <section className="study-shell">
        <div className="empty-state">
          <p>
            Loading study
            session...
          </p>
        </div>
      </section>
    );
  }


  /* =======================================================
     SHARED SESSION FUNCTIONS
     ======================================================= */


  function resetAnswerState() {
    setTypedAnswer("");
    setFeedback(null);
    setSelectedChoice(null);
    resetReviewState();
    questionStartedAt.current = Date.now();
  }


  function finishNormalSession() {
    setCompleted(true);

    resetAnswerState();

    router.refresh();
  }


  function moveToNextNormalCard(
    wasCorrect
  ) {
    const transition = advanceStudyQueue({
      queue,
      currentIndex,
      wasCorrect,
      requeueMissed: mode === "learn",
    });

    if (!transition) {
      return;
    }

    setCorrect((value) => value + transition.correctDelta);
    setMissed((value) => value + transition.missedDelta);
    setQueue(transition.queue);

    if (transition.complete) {
      finishNormalSession();

      return;
    }

    setCurrentIndex(
      transition.currentIndex
    );

    resetAnswerState();
  }


  /* =======================================================
     NORMAL TYPED MODE
     ======================================================= */


  async function handleTypedSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !currentCard ||
      feedback
    ) {
      return;
    }

    const wasCorrect =
      isTypedCorrect(
        typedAnswer,
        expectedAnswer,
        grading
      );

    if (
      mode === "test"
    ) {
      await submitTestAnswer(
        typedAnswer,
        wasCorrect,
        expectedAnswer
      );

      return;
    }

    const saved = await saveReview(
      currentCard,
      wasCorrect,
      "typed",
      typedAnswer,
      { questionKey: currentIndex }
    );

    if (!saved) {
      return;
    }

    setFeedback({
      correct:
        saved.correct,

      expected:
        saved.expected,
    });
  }


  function continueAfterTyped() {
    if (!feedback) {
      return;
    }

    moveToNextNormalCard(
      feedback.correct
    );
  }


  /* =======================================================
     NORMAL MULTIPLE CHOICE MODE
     ======================================================= */


  async function handleMultipleChoice(
    choice
  ) {
    if (
      !currentCard ||
      feedback
    ) {
      return;
    }

    const wasCorrect =
      normalizeFlexibleAnswer(
        choice
      ) ===
      normalizeFlexibleAnswer(
        expectedAnswer
      );

    setSelectedChoice(
      choice
    );

    if (
      mode === "test"
    ) {
      await submitTestAnswer(
        choice,
        wasCorrect,
        expectedAnswer
      );

      return;
    }

    const saved = await saveReview(
      currentCard,
      wasCorrect,
      "multiple",
      choice,
      { questionKey: currentIndex }
    );

    if (!saved) {
      return;
    }

    setFeedback({
      correct:
        saved.correct,

      expected:
        saved.expected,
    });
  }


  function continueAfterChoice() {
    if (!feedback) {
      return;
    }

    moveToNextNormalCard(
      feedback.correct
    );
  }


  /* =======================================================
     FLASHCARD MODE
     ======================================================= */

     function goToPreviousFlashcard() {
  if (
    mode !== "flashcards" ||
    currentIndex <= 0
  ) {
    return;
  }

  setCurrentIndex(
    (index) =>
      Math.max(
        0,
        index - 1
      )
  );

  resetAnswerState();
}


function goToNextFlashcard() {
  if (
    mode !== "flashcards"
  ) {
    return;
  }

  /*
   * Don't move beyond the last card.
   */
  if (
    currentIndex >=
    queue.length - 1
  ) {
    return;
  }

  setCurrentIndex(
    (index) =>
      Math.min(
        queue.length - 1,
        index + 1
      )
  );

  resetAnswerState();
}

  async function handleFlashcardResult(
    wasCorrect
  ) {
    if (!currentCard) {
      return;
    }

    const saved = await saveReview(
      currentCard,
      wasCorrect,
      "flashcard",
      wasCorrect
        ? "Got it"
        : "Missed",
      { questionKey: currentIndex }
    );

    if (!saved) {
      return;
    }

    moveToNextNormalCard(
      saved.correct
    );
  }


  /* =======================================================
     SHUFFLE
     ======================================================= */


  function shuffleRemaining() {
    const completedCards =
      queue.slice(
        0,
        currentIndex
      );

    const remainingCards =
      queue.slice(
        currentIndex
      );

    setQueue([
      ...completedCards,
      ...shuffle(
        remainingCards
      ),
    ]);

    resetAnswerState();
  }


  /* =======================================================
     TEST GENERATION
     ======================================================= */


  /* =======================================================
     TEST ANSWERS
     ======================================================= */


  async function submitTestAnswer(
    userAnswer,
    wasCorrect,
    correctAnswer
  ) {
    const question =
      testQuestions[
        testIndex
      ];

    if (!question) {
      return false;
    }

    const saved = await saveReview(
      question.card,
      wasCorrect,
      `test-${question.type}`,
      String(userAnswer),
      {
        questionKey: question.id,
        presentedAnswer:
          question.type ===
          "truefalse"
            ? question
                .displayedAnswer
            : undefined,
      }
    );

    if (!saved) {
      return false;
    }

    const authoritativeCorrect =
      saved.correct;

    const result = {
      id:
        question.id,

      cardId:
        question.card.id,

      term:
        question.card.term,

      definition:
        question.card
          .definition,

      type:
        question.type,

      prompt:
        answerDirection ===
        "definition"
          ? question.card
              .term
          : question.card
              .definition,

      userAnswer:
        String(
          userAnswer
        ),

      correctAnswer:
        String(
          saved.expected ??
            correctAnswer
        ),

      correct:
        authoritativeCorrect,

      durationMs: Math.max(0, Date.now() - questionStartedAt.current),
    };

    const updatedResults = [
      ...testResults,
      result,
    ];

    setTestResults(
      updatedResults
    );

    if (authoritativeCorrect) {
      setCorrect(
        (value) =>
          value + 1
      );
    } else {
      setMissed(
        (value) =>
          value + 1
      );
    }

    setAnswerStreak((value) => authoritativeCorrect ? value + 1 : 0);
    setFeedback({ correct: authoritativeCorrect, expected: String(saved.expected ?? correctAnswer) });

    return true;
  }

  function continueTestQuestion() {
    if (!feedback) return;
    const nextIndex = testIndex + 1;
    if (nextIndex >= testQuestions.length) {
      setTestFinished(true);
      router.refresh();
      return;
    }
    setTestIndex(nextIndex);
    resetAnswerState();
  }


  function handleTrueFalse(
    answer
  ) {
    if (
      !testQuestion ||
      feedback ||
      testQuestion.type !==
        "truefalse"
    ) {
      return;
    }

    const wasCorrect =
      answer ===
      testQuestion
        .correctValue;

    setSelectedChoice(answer);
    submitTestAnswer(
      answer,
      wasCorrect,
      testQuestion
        .correctValue
    );
  }


  /* =======================================================
     TEST RETAKE / REVIEW
     ======================================================= */


  function retakeTest() {
    const rebuiltQuestions =
      testQuestions.map(
        (
          question,
          index
        ) => {
          if (
            question.type ===
            "multiple"
          ) {
            return {
              ...question,

              id:
                `${question.card.id}-retake-${index}-${Date.now()}`,

              options:
                makeMultipleChoiceOptions(
                  question.card,
                  cards,
                  answerDirection
                ),
            };
          }

          if (
            question.type ===
            "truefalse"
          ) {
            return {
              ...question,

              id:
                `${question.card.id}-retake-${index}-${Date.now()}`,

              ...makeTrueFalseQuestion(
                question.card,
                cards,
                answerDirection
              ),
            };
          }

          return {
            ...question,

            id:
              `${question.card.id}-retake-${index}-${Date.now()}`,
          };
        }
      );

    setTestQuestions(
      shuffle(
        rebuiltQuestions
      )
    );

    setTestIndex(0);

    setTestResults([]);

    setCorrect(0);
    setMissed(0);

    setTestFinished(
      false
    );

    resetAnswerState();
  }


  function createAnotherTest() {
    router.push(`/decks/${deck.id}/test`);
  }


  function reviewMistakes() {
    const missedResults =
      testResults.filter(
        (result) =>
          !result.correct
      );

    if (
      missedResults.length ===
      0
    ) {
      return;
    }

    const missedCards =
      missedResults
        .map(
          (result) =>
            cards.find(
              (card) =>
                card.id ===
                result.cardId
            )
        )
        .filter(Boolean);

    const questions =
      missedCards.map(
        (
          card,
          index
        ) => ({
          id:
            `${card.id}-review-${index}-${Date.now()}`,

          card,

          type:
            "typed",
        })
      );

    setTestQuestions(
      questions
    );

    setTestIndex(0);

    setTestResults([]);

    setCorrect(0);
    setMissed(0);

    setTestFinished(
      false
    );

    resetAnswerState();
  }


  /* =======================================================
     EMPTY DECK
     ======================================================= */


  if (
    cards.length === 0
  ) {
    return (
      <section className="empty-state">
        <h2>
          No cards to study
        </h2>

        <p>
          Add some cards to
          this deck before
          starting a study
          session.
        </p>
      </section>
    );
  }


  /* =======================================================
     TEST RESULTS
     ======================================================= */


  if (
    mode === "test" &&
    testFinished
  ) {
    return (
      <TestResults
        deck={deck}

        testResults={
          testResults
        }

        onReviewMistakes={
          reviewMistakes
        }

        onRetakeTest={
          retakeTest
        }

        onCreateAnotherTest={
          createAnotherTest
        }
      />
    );
  }


  /* =======================================================
     NORMAL SESSION COMPLETE
     ======================================================= */


  if (
    completed &&
    mode !== "test"
  ) {
    const total =
      correct + missed;

    const percentage =
      total > 0
        ? Math.round(
            (
              correct /
              total
            ) * 100
          )
        : 0;

    return (
      <section className="study-shell">
        <div className="empty-state">

          <p className="eyebrow">
            Session complete
          </p>

          <h1>
            {percentage}%
            accuracy
          </h1>

          <p>
            {correct} correct
            {" · "}
            {missed} missed
          </p>

          <button
            className="button primary"
            type="button"

            onClick={() => {
              beginAttemptGeneration();

              setQueue(
                mode === "learn" && studyScope === "targeted"
                  ? selectLearnCards(cards, studyScope)
                  : shuffle(
                      mode === "learn"
                        ? selectLearnCards(cards, studyScope)
                        : cards
                    )
              );

              setCurrentIndex(
                0
              );

              setCorrect(0);

              setMissed(0);

              setCompleted(
                false
              );

              resetAnswerState();
            }}
          >
            Study again
          </button>

        </div>
      </section>
    );
  }


  if (!currentCard) {
    return (
      <section className="empty-state">
        <h2>
          Session complete
        </h2>

        <p>
          You&apos;ve reached
          the end.
        </p>
      </section>
    );
  }


  /* =======================================================
     ACTIVE MODE FLAGS
     ======================================================= */


  const isTypedMode =
    mode === "typed" ||
    (
      mode === "test" &&
      testQuestion?.type ===
        "typed"
    );


  const isMultipleMode =
    mode === "multiple" ||
    (
      mode === "test" &&
      testQuestion?.type ===
        "multiple"
    );


  const isTrueFalseMode =
    mode === "test" &&
    testQuestion?.type ===
      "truefalse";


  const isFlashcardMode =
    mode === "flashcards";


  const isLearnMode =
    mode === "learn";


  /* =======================================================
     PROGRESS
     ======================================================= */


  const normalProgress =
    queue.length > 0
      ? Math.min(
          100,

          Math.round(
            (
              (
                currentIndex +
                1
              ) /
              queue.length
            ) * 100
          )
        )
      : 0;


  const testProgress =
    testQuestions.length > 0
      ? Math.round(
          (
            (
              testIndex +
              1
            ) /
            testQuestions.length
          ) * 100
        )
      : 0;


  /* =======================================================
     ACTIVE STUDY SCREEN
     ======================================================= */


  return (
    <section className="study-shell">

      {/* -----------------------------------------------------
          HEADER
          ----------------------------------------------------- */}

      <div className="study-header">

        <div>
          <p className="eyebrow">
            {mode === "test"
              ? "Test"
              : mode === "learn"
                ? "Learn"
                : questionTypeLabel(
                    mode
                  )}
          </p>

          <h1>
            {deck.title}
          </h1>
        </div>

        <MascotCoach
          compact
          mood={feedback ? (feedback.correct ? "happy" : "sad") : "normal"}
          messages={
            feedback?.correct && answerStreak >= 2
              ? [`${answerStreak} correct in a row!`, "You are building real momentum."]
              : feedback && !feedback.correct
                ? ["That one was tricky. You have the right answer now.", "A mistake is useful when you review it."]
              : mode === "test"
              ? ["Read each question twice.", "Unsure? Rule out what cannot be right."]
              : ["Take your time; recall matters more than speed.", "Say the answer before revealing it."]
          }
        />


        {mode !== "test" ? (
          <div className="study-controls">

            <div className="direction-toggle">

              <button
                type="button"

                className={
                  answerDirection ===
                  "definition"
                    ? "button primary"
                    : "button"
                }

                onClick={() =>
                  setAnswerDirection(
                    "definition"
                  )
                }
              >
                Answer definitions
              </button>


              <button
                type="button"

                className={
                  answerDirection ===
                  "term"
                    ? "button primary"
                    : "button"
                }

                onClick={() =>
                  setAnswerDirection(
                    "term"
                  )
                }
              >
                Answer terms
              </button>

            </div>


            {(
              mode === "typed" ||
              mode === "learn"
            ) ? (
              <label>
                Grading

                <select
                  value={
                    grading
                  }

                  onChange={(
                    event
                  ) =>
                    setGrading(
                      event
                        .target
                        .value
                    )
                  }
                >
                  <option value="strict">
                    Strict
                  </option>

                  <option value="flexible">
                    Flexible
                  </option>

                  <option value="lenient">
                    Lenient
                  </option>
                </select>
              </label>
            ) : null}


            <button
              className="button"
              type="button"

              onClick={
                shuffleRemaining
              }
            >
              Shuffle remaining
            </button>

          </div>
        ) : null}

      </div>


      {/* -----------------------------------------------------
          SESSION SUMMARY
          ----------------------------------------------------- */}

      <div className="study-summary">

        <span>
          {mode === "test"
            ? `${testIndex + 1} of ${testQuestions.length}`
            : `${currentIndex + 1} of ${queue.length}`}
        </span>

        <span>
          {correct} right
        </span>

        <span>
          {missed} missed
        </span>

      </div>


      {/* -----------------------------------------------------
          XP
          ----------------------------------------------------- */}

      <XpNotice
        notice={xpNotice}
      />

      {reviewStatus ===
      "saving" ? (
        <p
          className="helper"
          role="status"
        >
          Saving review...
        </p>
      ) : null}

      {reviewStatus ===
      "error" ? (
        <p
          className="auth-error"
          role="alert"
        >
          {reviewError}. Try again.
        </p>
      ) : null}


      {/* -----------------------------------------------------
          PROGRESS BAR
          ----------------------------------------------------- */}

      <div
        className="study-progress"
        aria-label="Progress"
      >
        <div
          style={{
            width:
              `${
                mode === "test"
                  ? testProgress
                  : normalProgress
              }%`,
          }}
        />
      </div>


      {/* -----------------------------------------------------
          QUESTION AREA
          ----------------------------------------------------- */}

      <section className={`study-card${feedback ? (feedback.correct ? " feedback-flash-correct" : " feedback-flash-wrong") : ""}`}>


        {/* TRUE / FALSE */}

        {isTrueFalseMode ? (

          <TrueFalseQuestion
            prompt={prompt}

            displayedAnswer={
              testQuestion
                .displayedAnswer
            }

            feedback={feedback}
            selectedAnswer={selectedChoice}
            onContinue={continueTestQuestion}

            onAnswer={
              handleTrueFalse
            }
          />


        ) : isFlashcardMode ? (

          /* FLASHCARDS */

          <FlashcardQuestion
  key={currentCard.id}

  prompt={prompt}

  answer={expectedAnswer}

  imageUrl={currentCard.imageUrl}

  imageAlt={currentCard.imageAlt}

  onResult={
    handleFlashcardResult
  }

  onPrevious={
    goToPreviousFlashcard
  }

  onNext={
    goToNextFlashcard
  }

  hasPrevious={
    currentIndex > 0
  }

  hasNext={
    currentIndex <
    queue.length - 1
  }
/>


        ) : isTypedMode ? (

          /* TYPED */

          <TypedQuestion
            prompt={prompt}

            answerDirection={
              answerDirection
            }

            typedAnswer={
              typedAnswer
            }

            setTypedAnswer={
              setTypedAnswer
            }

            feedback={
              feedback
            }

            onSubmit={
              handleTypedSubmit
            }

            onContinue={
              mode === "test" ? continueTestQuestion : continueAfterTyped
            }
          />


        ) : isMultipleMode ? (

          /* MULTIPLE CHOICE */

          <MultipleChoiceQuestion
            prompt={prompt}

            options={
              multipleChoiceOptions
            }

            expectedAnswer={
              expectedAnswer
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
              handleMultipleChoice
            }

            onContinue={
              mode === "test" ? continueTestQuestion : continueAfterChoice
            }
          />


        ) : isLearnMode ? (

          /* LEARN */

          <LearnQuestion
            key={
              `${currentCard.id}-${currentIndex}`
            }

            card={
              currentCard
            }

            cards={
              cards
            }

            answerDirection={
              answerDirection
            }

            grading={
              grading
            }

            onResult={async ({
              wasCorrect,
              reviewMode,
              userAnswer,
            }) => {

              const saved = await saveReview(
                currentCard,
                wasCorrect,
                reviewMode,
                userAnswer,
                { questionKey: currentIndex }
              );

              if (!saved) {
                return false;
              }

              moveToNextNormalCard(
                saved.correct
              );

              return true;
            }}
          />

        ) : null}

      </section>

    </section>
  );
}
