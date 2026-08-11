import Link from "next/link";
import { createLearningGoalAction, deleteLearningGoalAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getLearningWorld } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const world = await getLearningWorld(user.id);
  return <main className="workspace-page">
    <header className="workspace-header"><div><p className="eyebrow">Exam expeditions</p><h1>Turn deadlines into a calm plan</h1><p>Snoo combines the date, deck readiness, and your available time to recommend what comes next.</p></div></header>
    <div className="goals-layout">
      <section className="progress-section"><h2>Create an expedition</h2>{world.constellations.length ? <form action={createLearningGoalAction} className="form-stack"><label>Goal name<input name="title" placeholder="Biology final" required /></label><label>Deck<select name="deckId">{world.constellations.map((deck) => <option value={deck.id} key={deck.id}>{deck.title}</option>)}</select></label><label>Exam date<input name="examDate" type="date" required /></label><label>Minutes available each day<input name="dailyMinutes" type="number" min="5" max="120" defaultValue="15" required /></label><button className="button primary" type="submit">Create expedition</button></form> : <p>Create a deck first.</p>}</section>
      <section className="progress-section"><h2>Upcoming destinations</h2><div className="goal-list">{world.goals.length ? world.goals.map((goal) => <article key={goal.id}><div><strong>{goal.title}</strong><span>{goal.deck_title} · {goal.daysRemaining >= 0 ? `${goal.daysRemaining} days remaining` : "Date passed"}</span><small>{goal.readiness}% ready · Snoo suggests {goal.recommendedMinutes} focused min today</small></div><div className="row-actions"><Link className="button primary" href={`/decks/${goal.deck_id}/focus`}>Start today</Link><form action={deleteLearningGoalAction}><input type="hidden" name="goalId" value={goal.id} /><button className="button" type="submit">Remove</button></form></div></article>) : <p>No expeditions planned yet.</p>}</div></section>
    </div>
  </main>;
}
