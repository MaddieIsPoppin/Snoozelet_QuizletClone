import MascotCoach from "@/components/MascotCoach";
import { requireUser } from "@/lib/auth";
import { getRecentReviews, getReviewTotals, getUserProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await requireUser();
  const [totals, progress, recent] = await Promise.all([getReviewTotals(user.id), getUserProgress(user.id), getRecentReviews(user.id, 8)]);
  return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Progress</p><h1>Your learning at a glance</h1><p>Use the patterns here to decide what needs another pass.</p></div><MascotCoach compact messages={["Consistency beats one enormous session.", "Weak cards are useful directions, not failures."]} /></header><section className="progress-summary"><article><span>Level</span><strong>{progress.level}</strong><small>{progress.currentLevelXp} / {progress.xpForNextLevel} XP</small></article><article><span>Accuracy</span><strong>{totals.accuracy}%</strong><small>{totals.total} answers</small></article><article><span>Best streak</span><strong>{totals.best_streak}</strong><small>correct in a row</small></article><article><span>Weak cards</span><strong>{totals.weak_cards}</strong><small>ready to revisit</small></article></section><section className="recent-panel"><h2>Recent answers</h2>{recent.length ? <div>{recent.map((review) => <article key={review.id}><span className={review.correct ? "review-dot correct" : "review-dot"} /><div><strong>{review.term}</strong><small>{review.deck_title} · {review.mode}</small></div><b>{review.correct ? "Correct" : "Review"}</b></article>)}</div> : <p>No answers recorded yet.</p>}</section></main>;
}
