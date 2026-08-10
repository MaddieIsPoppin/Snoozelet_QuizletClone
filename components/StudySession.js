"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import XpNotice from "@/components/XpNotice";
import TestResults from "@/components/TestResults";
import TestBuilder from "@/components/TestBuilder";

import FlashcardQuestion from "@/components/FlashcardQuestion";
import MultipleChoiceQuestion from "@/components/MultipleChoiceQuestion";
import TypedQuestion from "@/components/TypedQuestion";
import TrueFalseQuestion from "@/components/TrueFalseQuestion";


/* =========================================================
   GENERAL HELPERS
   ========================================================= */


function shuffle(items) {
  const copy = [...items];

  for (
    let i = copy.length - 1;
    i > 0;
    i -= 1
  ) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [copy[i], copy[j]] = [
      copy[j],
      copy[i],
    ];
  }

  return copy;
}


function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


function normalizeFlexible(value) {
  return normalize(value)
    .replace(/&/g, "and")
    .replace(
      /[.,/#!$%^*;:{}=\-_`~()?'"[\]\\]/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}


function levenshtein(a, b) {
  const first =
    normalizeFlexible(a);

  const second =
    normalizeFlexible(b);

  const matrix =
    Array.from(
      {
        length:
          first.length + 1,
      },
      () =>
        Array(
          second.length + 1
        ).fill(0)
    );

  for (
    let i = 0;
    i <= first.length;
    i += 1
  ) {
    matrix[i][0] = i;
  }

  for (
    let j = 0;
    j <= second.length;
    j += 1
  ) {
    matrix[0][j] = j;
  }

  for (
    let i = 1;
    i <= first.length;
    i += 1
  ) {
    for (
      let j = 1;
      j <= second.length;
      j += 1
    ) {
      const cost =
        first[i - 1] ===
        second[j - 1]
          ? 0
          : 1;

      matrix[i][j] =
        Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] +
            cost
        );
    }
  }

  return matrix[
    first.length
  ][second.length];
}


function isAnswerCorrect(
  answer,
  expected,
  grading = "lenient"
) {
  if (grading === "strict") {
    return (
      normalize(answer) ===
      normalize(expected)
    );
  }

  if (
    grading === "flexible"
  ) {
    return (
      normalizeFlexible(
        answer
      ) ===
      normalizeFlexible(
        expected
      )
    );
  }

  const first =
    normalizeFlexible(answer);

  const second =
    normalizeFlexible(expected);

  if (first === second) {
    return true;
  }

  if (!first || !second) {
    return false;
  }

  const distance =
    levenshtein(
      first,
      second
    );

  const longest =
    Math.max(
      first.length,
      second.length
    );

  if (longest <= 4) {
    return distance <= 1;
  }

  if (longest <= 10) {
    return distance <= 2;
  }

  return (
    distance <=
    Math.max(
      2,
      Math.floor(
        longest * 0.15
      )
    )
  );
}


function makeMultipleChoiceOptions(
  card,
  cards,
  answerDirection
) {
  const correct =
    answerDirection ===
    "definition"
      ? card.definition
      : card.term;

  const alternatives =
    cards
      .filter(
        (item) =>
          item.id !== card.id
      )
      .map((item) =>
        answerDirection ===
        "definition"
          ? item.definition
          : item.term
      )
      .filter(
        (value) =>
          normalize(value) !==
          normalize(correct)
      );

  return shuffle([
    correct,
    ...shuffle(
      alternatives
    ).slice(0, 3),
  ]);
}


function makeTrueFalseQuestion(
  card,
  cards,
  answerDirection
) {
  const shouldBeTrue =
    Math.random() >= 0.5;

  const correctAnswer =
    answerDirection ===
    "definition"
      ? card.definition
      : card.term;

  if (
    shouldBeTrue ||
    cards.length < 2
  ) {
    return {
      displayedAnswer:
        correctAnswer,

      correctValue:
        "True",
    };
  }

  const alternatives =
    cards.filter(
      (item) =>
        item.id !== card.id
    );

  const randomCard =
    alternatives[
      Math.floor(
        Math.random() *
          alternatives.length
      )
    ];

  return {
    displayedAnswer:
      answerDirection ===
      "definition"
        ? randomCard.definition
        : randomCard.term,

    correctValue:
      "False",
  };
}


function questionTypeLabel(
  type
) {
  if (type === "multiple") {
    return "Multiple choice";
  }

  if (type === "typed") {
    return "Written";
  }

  if (
    type === "truefalse" ||
    type === "true-false"
  ) {
    return "True / False";
  }

  if (type === "flashcard") {
    return "Flashcard";
  }

  return type;
}


/* =========================================================
   MAIN STUDY SESSION
   ========================================================= */


export default function StudySession({
  deck,
  cards = [],
  mode = "learn",
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


  /* ---------------------------------------------------------
     GENERAL STUDY STATE
     --------------------------------------------------------- */

  const [
    answerDirection,
    setAnswerDirection,
  ] = useState(
    "definition"
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
  ] = useState(cards);

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


  /* ---------------------------------------------------------
     XP
     --------------------------------------------------------- */

  const [
    xpNotice,
    setXpNotice,
  ] = useState(null);

  const xpTimerRef =
    useRef(null);

  const [
    reviewStatus,
    setReviewStatus,
  ] = useState("idle");

  const [
    reviewError,
    setReviewError,
  ] = useState("");

  const savingAttemptRef =
    useRef(null);

  const attemptIdsRef =
    useRef(new Map());

  const attemptGenerationRef =
    useRef(0);


  /* ---------------------------------------------------------
     TEST STATE
     --------------------------------------------------------- */

  const [
    testStarted,
    setTestStarted,
  ] = useState(
    mode !== "test"
  );

  const [
    testQuestionCount,
    setTestQuestionCount,
  ] = useState(
    Math.min(
      cards.length,
      20
    )
  );

  const [
    testTypes,
    setTestTypes,
  ] = useState({
    multiple: true,
    typed: true,
    truefalse: true,
  });

  const [
    testQuestions,
    setTestQuestions,
  ] = useState([]);

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
    setQueue(
      shuffle(cards)
    );

    setMounted(true);
  }, [cards]);


  /* ---------------------------------------------------------
     XP TIMER CLEANUP
     --------------------------------------------------------- */

  useEffect(() => {
    return () => {
      if (
        xpTimerRef.current
      ) {
        window.clearTimeout(
          xpTimerRef.current
        );
      }
    };
  }, []);


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


  const prompt =
    currentCard
      ? answerDirection ===
        "definition"
        ? currentCard.term
        : currentCard.definition
      : "";


  const expectedAnswer =
    currentCard
      ? answerDirection ===
        "definition"
        ? currentCard.definition
        : currentCard.term
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
    setReviewStatus("idle");
    setReviewError("");
  }


  function showXpNotice(
    data
  ) {
    if (!data?.xpGained) {
      return;
    }

    if (
      xpTimerRef.current
    ) {
      window.clearTimeout(
        xpTimerRef.current
      );
    }

    setXpNotice({
      amount:
        data.xpGained,

      totalXp:
        data.progress
          ?.totalXp,

      level:
        data.progress
          ?.level,
    });

    xpTimerRef.current =
      window.setTimeout(
        () => {
          setXpNotice(null);
        },
        2000
      );
  }


  async function saveReview(
    card,
    wasCorrect,
    reviewMode,
    userAnswer = "",
    options = {}
  ) {
    const questionKey =
      mode === "test"
        ? testQuestion?.id
        : currentIndex;

    const attemptKey = [
      attemptGenerationRef.current,
      mode,
      reviewMode,
      card.id,
      questionKey,
      answerDirection,
    ].join(":");

    let attemptId =
      attemptIdsRef.current.get(
        attemptKey
      );

    if (!attemptId) {
      attemptId =
        window.crypto.randomUUID();

      attemptIdsRef.current.set(
        attemptKey,
        attemptId
      );
    }

    if (
      savingAttemptRef.current ===
      attemptId
    ) {
      return null;
    }

    savingAttemptRef.current =
      attemptId;

    setReviewStatus("saving");
    setReviewError("");

    try {
      const response =
        await fetch(
          "/api/review",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                attemptId,

                cardId:
                  card.id,

                mode:
                  reviewMode,

                answer:
                  userAnswer,

                answerDirection,

                grading,

                selfAssessedCorrect:
                  reviewMode ===
                  "flashcard"
                    ? wasCorrect
                    : undefined,

                presentedAnswer:
                  options
                    .presentedAnswer,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Could not save review"
        );
      }

      showXpNotice(
        data
      );

      setReviewStatus("success");

      return data;
    } catch (error) {
      console.error(
        "Could not save review:",
        error
      );

      setReviewStatus("error");
      setReviewError(
        error.message ||
          "Could not save review"
      );

      return null;
    } finally {
      if (
        savingAttemptRef.current ===
        attemptId
      ) {
        savingAttemptRef.current =
          null;
      }
    }
  }


  function finishNormalSession() {
    setCompleted(true);

    resetAnswerState();

    router.refresh();
  }


  function moveToNextNormalCard(
    wasCorrect
  ) {
    const card =
      queue[
        currentIndex
      ];

    if (!card) {
      return;
    }

    if (wasCorrect) {
      setCorrect(
        (value) =>
          value + 1
      );
    } else {
      setMissed(
        (value) =>
          value + 1
      );

      if (
        mode === "learn"
      ) {
        setQueue(
          (existing) => [
            ...existing,
            card,
          ]
        );
      }
    }

    const nextIndex =
      currentIndex + 1;

    if (
      nextIndex >=
        queue.length &&
      (
        wasCorrect ||
        mode !== "learn"
      )
    ) {
      finishNormalSession();

      return;
    }

    setCurrentIndex(
      nextIndex
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
      isAnswerCorrect(
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
      typedAnswer
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
      normalizeFlexible(
        choice
      ) ===
      normalizeFlexible(
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
      choice
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
        : "Missed"
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


  function buildTest() {
    attemptGenerationRef.current += 1;

    const enabledTypes =
      Object.entries(
        testTypes
      )
        .filter(
          ([, enabled]) =>
            enabled
        )
        .map(
          ([type]) =>
            type
        );

    if (
      enabledTypes.length ===
      0
    ) {
      return;
    }

    const selectedCards =
      shuffle(cards).slice(
        0,
        Math.min(
          testQuestionCount,
          cards.length
        )
      );

    const questions =
      selectedCards.map(
        (
          card,
          index
        ) => {
          const type =
            enabledTypes[
              index %
                enabledTypes.length
            ];

          if (
            type ===
            "multiple"
          ) {
            return {
              id:
                `${card.id}-${index}`,

              card,

              type,

              options:
                makeMultipleChoiceOptions(
                  card,
                  cards,
                  answerDirection
                ),
            };
          }

          if (
            type ===
            "truefalse"
          ) {
            const generated =
              makeTrueFalseQuestion(
                card,
                cards,
                answerDirection
              );

            return {
              id:
                `${card.id}-${index}`,

              card,

              type,

              ...generated,
            };
          }

          return {
            id:
              `${card.id}-${index}`,

            card,

            type:
              "typed",
          };
        }
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

    setTestStarted(
      true
    );

    resetAnswerState();
  }


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

    const nextIndex =
      testIndex + 1;

    if (
      nextIndex >=
      testQuestions.length
    ) {
      setTestFinished(
        true
      );

      setTestResults(
        updatedResults
      );

      router.refresh();

      return true;
    }

    setTestIndex(
      nextIndex
    );

    resetAnswerState();

    return true;
  }


  function handleTrueFalse(
    answer
  ) {
    if (
      !testQuestion ||
      testQuestion.type !==
        "truefalse"
    ) {
      return;
    }

    const wasCorrect =
      answer ===
      testQuestion
        .correctValue;

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
    setTestStarted(
      false
    );

    setTestFinished(
      false
    );

    setTestQuestions([]);

    setTestResults([]);

    setTestIndex(0);

    setCorrect(0);
    setMissed(0);

    resetAnswerState();
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

    setTestStarted(
      true
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
     TEST BUILDER
     ======================================================= */


  if (
    mode === "test" &&
    !testStarted
  ) {
    return (
      <TestBuilder
        deck={deck}
        cards={cards}

        testQuestionCount={
          testQuestionCount
        }

        setTestQuestionCount={
          setTestQuestionCount
        }

        testTypes={
          testTypes
        }

        setTestTypes={
          setTestTypes
        }

        answerDirection={
          answerDirection
        }

        setAnswerDirection={
          setAnswerDirection
        }

        onStartTest={
          buildTest
        }
      />
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
              attemptGenerationRef.current += 1;

              setQueue(
                shuffle(cards)
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

      <section className="study-card">


        {/* TRUE / FALSE */}

        {isTrueFalseMode ? (

          <TrueFalseQuestion
            prompt={prompt}

            displayedAnswer={
              testQuestion
                .displayedAnswer
            }

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
              continueAfterTyped
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
              normalizeFlexible
            }

            onChoose={
              handleMultipleChoice
            }

            onContinue={
              continueAfterChoice
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
                userAnswer
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


/* =========================================================
   LEARN MODE
   ========================================================= */


function LearnQuestion({
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


  const prompt =
    answerDirection ===
    "definition"
      ? card.term
      : card.definition;


  const expected =
    answerDirection ===
    "definition"
      ? card.definition
      : card.term;


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
        normalizeFlexible(
          choice
        ) ===
        normalizeFlexible(
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
          normalizeFlexible
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
      isAnswerCorrect(
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
