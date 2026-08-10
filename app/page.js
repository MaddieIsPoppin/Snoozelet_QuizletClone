import Link from "next/link";
import { logoutAction } from "@/app/actions";
import MascotCoach from "@/components/MascotCoach";
import { requireUser } from "@/lib/auth";
import { getDecks, getReviewTotals, getUserProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [decks, totals, progress] = await Promise.all([
    getDecks(user.id), getReviewTotals(user.id), getUserProgress(user.id),
  ]);
  const nextDeck = decks[0];

  return (
    <main className="workspace-page dashboard-v3">
      <header className="workspace-header">
        <div><p className="eyebrow">Your dashboard</p><h1>Good evening, {user.username}</h1><p>Choose one useful thing to do next.</p></div>
        <form action={logoutAction}><button className="button" type="submit">Log out</button></form>
      </header>

      <section className="dashboard-focus-card">
        <div>
          <span className="focus-kicker">Tonight&apos;s focus</span>
          <h2>{nextDeck ? nextDeck.title : "Create your first deck"}</h2>
          <p>{nextDeck ? `${nextDeck.due_count} cards due · ${nextDeck.weak_count} weak cards` : "Build a small deck and Snoo will help you practise it."}</p>
          <div className="row-actions">
            <Link className="button primary" href={nextDeck ? `/decks/${nextDeck.id}/learn` : "/decks/new"}>{nextDeck ? "Continue learning" : "Create deck"}</Link>
            <Link className="button" href="/library">Open library</Link>
          </div>
        </div>
        <MascotCoach messages={["Short sessions still count.", "Start with the cards that are due.", "A mistake is a card asking for another turn."]} />
      </section>

      <section className="metric-strip">
        <article><span>Accuracy</span><strong>{totals.accuracy}%</strong></article>
        <article><span>Total XP</span><strong>{progress.totalXp}</strong></article>
        <article><span>Level</span><strong>{progress.level}</strong></article>
        <article><span>Decks</span><strong>{decks.length}</strong></article>
      </section>

      <section className="dashboard-shortcuts">
        <Link href="/library"><span>▤</span><div><strong>Organize decks</strong><small>Folders, search, and card management</small></div></Link>
        <Link href="/study"><span>◫</span><div><strong>Choose study mode</strong><small>Learn, flashcards, typed, or tests</small></div></Link>
        <Link href="/games"><span>✦</span><div><strong>Play a study game</strong><small>Match, Blast, and Blocks</small></div></Link>
        <Link href="/progress"><span>↗</span><div><strong>Review progress</strong><small>Accuracy, XP, and recent work</small></div></Link>
      </section>
    </main>
  );
}
