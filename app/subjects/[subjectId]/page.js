import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getContextCards, getSubjectHub } from "@/lib/db";
import ResourceLinks from "@/components/ResourceLinks";
import StudyContextTools from "@/components/StudyContextTools";

export const dynamic = "force-dynamic";
export default async function SubjectPage({ params }) {
  const user = await requireUser(); const { subjectId } = await params;
  const [hub, cards] = await Promise.all([getSubjectHub(subjectId, user.id), getContextCards({ subjectId, userId: user.id })]);
  if (!hub) notFound();
  const due = hub.units.reduce((sum, unit) => sum + Number(unit.due_count), 0); const weak = hub.units.reduce((sum, unit) => sum + Number(unit.weak_count), 0);
  return <main className="workspace-page subject-page"><header className="workspace-header"><div><p className="eyebrow">Subject</p><h1>{hub.subject.name}</h1><p>{hub.subject.description || "Your study units, sets, and resources in one calm place."}</p></div><Link className="button" href="/library">← Library</Link></header><section className="subject-metrics"><article><strong>{hub.units.length}</strong><span>Study units</span></article><article><strong>{hub.decks.length}</strong><span>Sets</span></article><article><strong>{cards.length}</strong><span>Cards</span></article><article><strong>{due}</strong><span>Due</span></article><article><strong>{weak}</strong><span>Weak</span></article></section><section className="unit-shelf"><div className="section-heading"><div><p className="eyebrow">Study units</p><h2>Choose a unit</h2></div></div><div className="unit-grid">{hub.units.map((unit) => <Link className="unit-card" href={`/study-units/${unit.id}`} key={unit.id}><span>▤</span><div><h3>{unit.name}</h3><p>{unit.deck_count} sets · {unit.card_count} cards</p><small>{unit.due_count} due · {unit.weak_count} weak</small></div><b>→</b></Link>)}</div></section><ResourceLinks resources={hub.resources} subjectId={hub.subject.id} /><StudyContextTools subject={hub.subject.name} decks={hub.decks} cards={cards} /></main>;
}
