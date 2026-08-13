import Link from "next/link";
import { logoutAction } from "@/app/actions";
import SnoozeMascot from "@/components/SnoozeMascot";
import { requireUser } from "@/lib/auth";
import { getLearningWorld, getSubjects } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const user = await requireUser();
  const [world, modules] = await Promise.all([getLearningWorld(user.id), getSubjects(user.id)]);
  const next = world.recommended;
  const dueToday = world.constellations.reduce((sum, deck) => sum + Number(deck.due_count || 0), 0);
  const displayName = user.username.includes("@") ? user.username.split("@")[0] : user.username;
  return <main className="workspace-page home-focused">
    <header className="workspace-header"><div><p className="eyebrow">Home</p><h1>Welcome back, {displayName}</h1><p>One clear next step. Everything else can wait.</p></div><form action={logoutAction}><button className="button" type="submit">Log out</button></form></header>
    <section className="home-continue"><div className="home-continue-copy"><p className="eyebrow">Continue studying</p><span className="home-context">{next?.subject_name || "Unorganised"}{next?.folder_name ? ` › ${next.folder_name}` : ""}</span><h2>{next?.title || "Build your first module"}</h2><p>{next ? `${next.due_count} cards due · ${next.weak_count} weak · about ${next.minutes} focused minutes` : "Create a module, add a study unit, then bring in your first deck."}</p><div className="row-actions"><Link className="button primary" href={next ? `/decks/${next.id}/learn` : "/library"}>{next ? "Continue studying" : "Add first module"}</Link>{next ? <Link className="button" href={`/decks/${next.id}`}>Open deck</Link> : null}</div></div><div className="home-snoo"><SnoozeMascot variant="hero" mood={dueToday ? "encouraging" : "happy"} /><div><strong>Snoo says</strong><span>{dueToday ? `${dueToday} cards are due today. Let’s knock them out.` : modules.length ? "You’re caught up. A short review will keep it that way." : "Start by adding the module you’re studying."}</span></div></div></section>
    <section className="due-strip"><div><span>Due today</span><strong>{dueToday}</strong></div><p>{dueToday ? "Your due cards are already prioritised when you continue." : "Nothing urgent. Study any deck to keep momentum."}</p><Link href="/study">Choose another deck →</Link></section>
    <section className="home-modules"><div className="section-heading"><div><p className="eyebrow">My modules</p><h2>Your university work</h2></div><Link className="button" href="/library">View all modules</Link></div>{modules.length ? <div className="subject-grid">{modules.slice(0,6).map((module) => <Link className="subject-card" href={`/subjects/${module.id}`} key={module.id}><span className="subject-icon">◎</span><div><h3>{module.name}</h3><p>{module.description || `${module.unit_count} study units`}</p><small>{module.due_count} due · {module.accuracy}% accuracy</small></div><b>→</b></Link>)}</div> : <div className="snoo-empty"><SnoozeMascot variant="coach" mood="thinking" /><div><h3>No modules yet</h3><p>Add your first module and Snoo will help organise the rest.</p><Link className="button primary" href="/library">Add module</Link></div></div>}</section>
    <footer className="home-secondary"><Link href="/goals">Plan an exam</Link><span>·</span><Link href="/progress">See progress</Link></footer>
  </main>;
}
