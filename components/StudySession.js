"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useReviewSaver from "@/hooks/useReviewSaver";

import XpNotice from "@/components/XpNotice";
import Breadcrumbs from "@/components/Breadcrumbs";
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

import MascotCoach from "@/components/MascotCoach";

const questionLoader = () => <div className="study-question-loader" aria-label="Loading question" />;
const FlashcardQuestion = dynamic(() => import("@/components/FlashcardQuestion"), { loading: questionLoader });
const MultipleChoiceQuestion = dynamic(() => import("@/components/MultipleChoiceQuestion"), { loading: questionLoader });
const TypedQuestion = dynamic(() => import("@/components/TypedQuestion"), { loading: questionLoader });
const TrueFalseQuestion = dynamic(() => import("@/components/TrueFalseQuestion"), { loading: questionLoader });
const LearnQuestion = dynamic(() => import("@/components/LearnQuestion"), { loading: questionLoader });
const TestResults = dynamic(() => import("@/components/TestResults"), { loading: questionLoader });


/* =========================================================
   MAIN STUDY SESSION
   ========================================================= */


export default function StudySession({
  deck,
  cards = [],
  mode = "learn",
  studyScope = "targeted",
  testCount = cards.length,
  testTypes = ["multiple", "truefalse"],
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
  const [bestCombo, setBestCombo] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [masteredCards, setMasteredCards] = useState(() => new Set());
  const [revengeCards, setRevengeCards] = useState(() => new Map());
  const [moment, setMoment] = useState(null);
  const [latestProgress, setLatestProgress] = useState(null);
  const [audioCue, setAudioCue] = useState(null);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);


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

  useEffect(() => {
    if (!audioCue) return;
    const soundsEnabled = document.documentElement.dataset.sounds !== "false";
    if (!soundsEnabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const gain = context.createGain();
    const notes = audioCue.correct
      ? (audioCue.type === "mastered" || audioCue.type === "revenge-complete" ? [523, 659, 784] : [540, 680])
      : [230, 185];
    gain.gain.setValueAtTime(.025, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .34);
    gain.connect(context.destination);
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency * (audioCue.multiplier > 1 ? 1.08 : 1);
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * .075);
      oscillator.stop(context.currentTime + .16 + index * .075);
    });
    window.setTimeout(() => context.close(), 500);
  }, [audioCue]);


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
    setMoment(null);
    resetReviewState();
    questionStartedAt.current = Date.now();
  }

  function registerResult(card, saved, userAnswer = "") {
    const wasRevenge = revengeCards.has(card.id);
    const nextStreak = Number(saved.combo ?? (saved.correct ? answerStreak + 1 : 0));

    setAnswerStreak(nextStreak);
    setBestCombo((value) => Math.max(value, nextStreak));
    setSessionXp((value) => value + Number(saved.xpGained || 0));
    if (saved.progress) setLatestProgress(saved.progress);
    setAudioCue({ correct: saved.correct, type: saved.moment, multiplier: saved.flowMultiplier, nonce: Date.now() });

    if (saved.moment === "revenge-added" || !saved.correct) {
      setRevengeCards((current) => new Map(current).set(card.id, {
        answer: userAnswer || "Your answer",
        expected: saved.expected,
      }));
      setMoment({ type: "revenge-added", answer: userAnswer || "Your answer", expected: saved.expected });
      return;
    }

    if (saved.moment === "revenge-complete" || (saved.queued && wasRevenge)) {
      setRevengeCards((current) => {
        const next = new Map(current);
        next.delete(card.id);
        return next;
      });
      setMoment({ type: "revenge-complete", xp: saved.bonusXp || 25 });
      return;
    }

    if (saved.moment === "mastered") {
      setMasteredCards((current) => new Set(current).add(card.id));
      setMoment({ type: "mastered", xp: saved.bonusXp || 40 });
      return;
    }

    setMoment({ type: "correct" });
  }


  function finishNormalSession() {
    setCompleted(true);

    resetAnswerState();

    router.refresh();
  }

  function restartSession(limit = null) {
    beginAttemptGeneration();
    const source = mode === "learn" ? selectLearnCards(cards, studyScope) : cards;
    const prepared = mode === "learn" && studyScope === "targeted" ? source : shuffle(source);
    setQueue(limit ? prepared.slice(0, limit) : prepared);
    setCurrentIndex(0);
    setCorrect(0);
    setMissed(0);
    setAnswerStreak(0);
    setBestCombo(0);
    setSessionXp(0);
    setMasteredCards(new Set());
    setRevengeCards(new Map());
    setLatestProgress(null);
    setCompleted(false);
    resetAnswerState();
  }


  function moveToNextNormalCard(
    wasCorrect
  ) {
    const transition = advanceStudyQueue({
      queue,
      currentIndex,
      wasCorrect,
      requeueMissed: mode !== "test",
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
      { questionKey: currentIndex, offlineExpected: expectedAnswer }
    );

    if (!saved) {
      return;
    }

    registerResult(currentCard, saved, typedAnswer);

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
      feedback ||
      selectedChoice !== null
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
      const submitted = await submitTestAnswer(
        choice,
        wasCorrect,
        expectedAnswer
      );

      if (!submitted) setSelectedChoice(null);

      return;
    }

    const saved = await saveReview(
      currentCard,
      wasCorrect,
      "multiple",
      choice,
      { questionKey: currentIndex, offlineExpected: expectedAnswer }
    );

    if (!saved) {
      setSelectedChoice(null);
      return;
    }

    registerResult(currentCard, saved, choice);

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

  function handleFlashcardResult(
    wasCorrect
  ) {
    if (!currentCard) {
      return false;
    }

    const reviewedCard = currentCard;
    const reviewedAnswer = expectedAnswer;
    const reviewedIndex = currentIndex;

    // Flashcards are self-assessed, so the next card can appear immediately.
    // Persistence, XP, and offline queuing continue outside the gesture path.
    moveToNextNormalCard(wasCorrect);

    void saveReview(
      reviewedCard,
      wasCorrect,
      "flashcard",
      wasCorrect
        ? "Got it"
        : "Missed",
      { questionKey: reviewedIndex, offlineExpected: reviewedAnswer }
    ).then((saved) => {
      if (saved) registerResult(reviewedCard, saved, wasCorrect ? "Got it" : "Missed");
    });

    return true;
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
        offlineExpected: correctAnswer,
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

    registerResult(question.card, saved, String(userAnswer));
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


  function reviewMistakes(limit = null) {
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
      (limit ? missedResults.slice(0, limit) : missedResults)
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
          () => reviewMistakes()
        }

        onRetakeTest={
          retakeTest
        }

        onCreateAnotherTest={
          createAnotherTest
        }
        onQuickContinue={() => testResults.some((result) => !result.correct) ? reviewMistakes(7) : retakeTest()}
        bestCombo={bestCombo}
        sessionXp={sessionXp}
        masteredCount={masteredCards.size}
        progress={latestProgress}
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

          <h1>{total} questions. Momentum built.</h1>

          <div className="session-stat-grid">
            <div><strong>{correct}</strong><span>Correct</span></div>
            <div><strong>{percentage}%</strong><span>Accuracy</span></div>
            <div><strong>{bestCombo}</strong><span>Best combo</span></div>
            <div><strong>{masteredCards.size}</strong><span>Cards mastered</span></div>
          </div>

          <div className="session-xp-total"><span>⭐</span><strong>+{sessionXp} XP</strong><small>earned this session</small></div>

          {latestProgress ? <div className="session-level">
            <div><strong>Level {latestProgress.level}</strong><span>{latestProgress.xpUntilNextLevel} XP until Level {latestProgress.level + 1}</span></div>
            <div className="session-level-track"><span style={{ width: `${Math.min(100, (latestProgress.currentLevelXp / Math.max(1, latestProgress.xpForNextLevel)) * 100)}%` }} /></div>
          </div> : null}

          <p>
            {correct} correct
            {" · "}
            {missed} missed
          </p>

          <button
            className="button primary"
            type="button"

            onClick={() => restartSession(7)}
          >
            Continue — only ~7 questions
          </button>

          <button className="button" type="button" onClick={() => restartSession()}>Start a full session</button>

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

  const flowMultiplier = answerStreak >= 12 ? 2 : answerStreak >= 8 ? 1.5 : answerStreak >= 5 ? 1.2 : 1;
  const flowActive = answerStreak >= 5;
  const isRevengeCard = revengeCards.has(currentCard.id);
  const isClutchCard = !isRevengeCard && (Boolean(currentCard.weak) || Number(currentCard.incorrect_count || 0) >= 2);


  /* =======================================================
     ACTIVE STUDY SCREEN
     ======================================================= */


  return (
    <section className={`study-shell${flowActive ? " flow-mode" : ""}`}>

      {flowActive ? <div className="flow-banner" role="status"><strong>🔥 FLOW MODE</strong><span>{flowMultiplier.toFixed(1)}× momentum</span><small>Stay locked in.</small></div> : null}

      {/* -----------------------------------------------------
          HEADER
          ----------------------------------------------------- */}

      <div className="study-header">

        <div>
          <Breadcrumbs module={deck.subject_name} moduleId={deck.subject_id} unit={deck.folder_name} unitId={deck.folder_id} deck={deck.title} />
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
          <div className="study-options-wrap">
            <button className="study-options-trigger" type="button" aria-expanded={mobileOptionsOpen} onClick={() => setMobileOptionsOpen((value) => !value)}>Session settings</button>
          <div className={`study-controls${mobileOptionsOpen ? " mobile-open" : ""}`}>

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


            {mode === "typed" ? (
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

        <span>🔥 {answerStreak} combo</span>

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

      {reviewStatus === "queued" ? <p className="offline-save-note" role="status">Saved on this device · XP and progress will sync when you reconnect.</p> : null}


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

      <section className={`study-card${isFlashcardMode ? " flashcard-study-card" : ""}${feedback ? (feedback.correct ? " feedback-flash-correct" : " feedback-flash-wrong") : ""}`}>

        {!feedback && !isFlashcardMode && isRevengeCard ? <div className="challenge-banner revenge"><strong>⚡ REVENGE CARD</strong><span>You&apos;ve seen this one before. Take it back.</span></div> : null}
        {!feedback && !isFlashcardMode && isClutchCard ? <div className="challenge-banner clutch"><strong>⚠️ CLUTCH CARD</strong><span>Get this right to Master it.</span></div> : null}
        {feedback && moment?.type === "revenge-added" ? <div className="story-moment broken"><strong>COMBO BROKEN 💔</strong><span>You answered: {moment.answer}</span><span>Correct answer: {moment.expected}</span><b>⚡ REVENGE CARD ADDED</b></div> : null}
        {feedback && moment?.type === "revenge-complete" ? <div className="story-moment complete"><strong>⚡ REVENGE COMPLETE</strong><span>You fixed a previous mistake.</span><b>+{moment.xp} XP</b></div> : null}
        {feedback && moment?.type === "mastered" ? <div className="story-moment complete"><strong>💥 MASTERED</strong><span>{currentCard.term}</span><b>+{moment.xp} XP · Difficult victory.</b></div> : null}


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

  hint={currentCard.hint}

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
            key={currentCard.id}
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
            hint={currentCard.hint}
            draftKey={`${deck.id}-${mode}-${currentCard.id}-${answerDirection}`}
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
            hint={currentCard.hint}
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
                { questionKey: currentIndex, offlineExpected: answerForDirection(currentCard, answerDirection) }
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
