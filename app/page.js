import Link from "next/link";
import { logoutAction } from "@/app/actions";
import SnoozeMascot from "@/components/SnoozeMascot";
import { requireUser } from "@/lib/auth";
import { getDecks, getReviewTotals, getUserProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const [decks, totals, progress] = await Promise.all([
    getDecks(user.id), getReviewTotals(user.id), getUserProgress(user.id),
  ]);
  const nextDeck = decks[0];
  const displayName = user.username.includes("@") ? user.username.split("@")[0] : user.username;

  return (
    <main className="workspace-page dashboard-v3">
      <header className="workspace-header">
        <div><p className="eyebrow">Your dashboard</p><h1>Ready to grow, {displayName}?</h1><p>Snoo has your next study step ready.</p></div>
        <form action={logoutAction}><button className="button" type="submit">Log out</button></form>
      </header>

      <section className="dashboard-focus-card">
        <div className="dashboard-focus-copy">
          <span className="focus-kicker">Tonight&apos;s focus</span>
          <h2>{nextDeck ? nextDeck.title : "Create your first deck"}</h2>
          <p>{nextDeck ? `${nextDeck.due_count} cards due · ${nextDeck.weak_count} weak cards` : "Build a small deck and Snoo will help you practise it."}</p>
          <div className="row-actions">
            <Link className="button primary" href={nextDeck ? `/decks/${nextDeck.id}/learn` : "/decks/new"}>{nextDeck ? "Continue learning" : "Create deck"}</Link>
            <Link className="button" href="/library">Open library</Link>
          </div>
        </div>
        <div className="dashboard-snoo-stage">
          <div className="dashboard-snoo-message"><strong>Snoo&apos;s study plan</strong><span>{nextDeck ? `${nextDeck.due_count} cards are waiting. Let’s make a little progress together!` : "Let’s build your first deck together!"}</span></div>
          <SnoozeMascot variant="hero" mood="happy" />
        </div>
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
