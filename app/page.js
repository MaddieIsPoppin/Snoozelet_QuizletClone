import Link from "next/link";
import { logoutAction } from "@/app/actions";
import SnoozeMascot from "@/components/SnoozeMascot";
import KnowledgeObservatory from "@/components/KnowledgeObservatory";
import { requireUser } from "@/lib/auth";
import { getLearningWorld, getReviewTotals, getUserProgress } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function ObservatoryPage() {
  const user = await requireUser();
  const [world, totals, progress] = await Promise.all([getLearningWorld(user.id), getReviewTotals(user.id), getUserProgress(user.id)]);
  const nextDeck = world.recommended;
  const nextGoal = world.goals[0];
  const displayName = user.username.includes("@") ? user.username.split("@")[0] : user.username;
  return <main className="workspace-page dashboard-v3">
    <header className="workspace-header"><div><p className="eyebrow">Your observatory</p><h1>Welcome back, {displayName}</h1><p>Your knowledge world has a clear next step.</p></div><form action={logoutAction}><button className="button" type="submit">Log out</button></form></header>
    <section className="dashboard-focus-card"><div className="dashboard-focus-copy"><span className="focus-kicker">Snoo&apos;s recommended journey</span><h2>{nextDeck?.title || "Create your first constellation"}</h2><p>{nextDeck ? `${nextDeck.score}% ready · ${nextDeck.due_count} due · about ${nextDeck.minutes} focused minutes` : "Build a small deck and Snoo will chart a calm path through it."}</p><div className="row-actions"><Link className="button primary" href={nextDeck ? `/decks/${nextDeck.id}/focus` : "/decks/new"}>{nextDeck ? "Begin Focus Journey" : "Create deck"}</Link><Link className="button" href="/goals">{nextGoal ? `Exam · ${nextGoal.exam_date}` : "Plan an exam"}</Link></div></div><div className="dashboard-snoo-stage"><div className="dashboard-snoo-message"><strong>Snoo&apos;s guidance</strong><span>{nextDeck ? nextDeck.score >= 80 ? `${nextDeck.title} is nearly secure. A confidence check will keep it bright.` : `${nextDeck.title} offers the best progress today.` : "Create your first constellation and I’ll chart the path."}</span></div><SnoozeMascot variant="hero" mood="happy" /></div></section>
    <section className="metric-strip"><article><span>Accuracy</span><strong>{totals.accuracy}%</strong></article><article><span>Total XP</span><strong>{progress.totalXp}</strong></article><article><span>Level</span><strong>{progress.level}</strong></article><article><span>Constellations</span><strong>{world.constellations.length}</strong></article></section>
    <KnowledgeObservatory constellations={world.constellations} />
    <section className="milestone-journal"><div><p className="eyebrow">Learning journal</p><h2>Your story so far</h2></div><div className="milestone-list">{world.constellations.length ? world.constellations.slice(0, 3).map((deck) => <Link href={`/decks/${deck.id}`} key={deck.id}><span>{deck.score >= 85 ? "★" : deck.score >= 35 ? "✦" : "·"}</span><div><strong>{deck.score >= 85 ? `${deck.title} is exam ready` : deck.score >= 35 ? `${deck.title} is taking shape` : `${deck.title} joined your sky`}</strong><small>{deck.mastered} of {deck.card_count} cards mastered</small></div></Link>) : <p>Your first milestone appears when you create a constellation.</p>}</div></section>
    <section className="dashboard-shortcuts"><Link href="/goals"><span>◎</span><div><strong>Exam expeditions</strong><small>Turn deadlines into daily plans</small></div></Link><Link href="/study"><span>◫</span><div><strong>Choose study mode</strong><small>Learn, flashcards, typed, or tests</small></div></Link><Link href="/games"><span>✦</span><div><strong>Enter the arcade</strong><small>Practice that strengthens your world</small></div></Link><Link href="/progress"><span>↗</span><div><strong>Learning journal</strong><small>Mastery, goals, and recent work</small></div></Link></section>
  </main>;
}
