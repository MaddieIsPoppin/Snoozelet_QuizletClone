import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getContextCards, getSubjectHub } from "@/lib/db";
import ResourceLinks from "@/components/ResourceLinks";
import StudyContextTools from "@/components/StudyContextTools";
import Breadcrumbs from "@/components/Breadcrumbs";
import SnoozeMascot from "@/components/SnoozeMascot";

export const dynamic = "force-dynamic";
export default async function SubjectPage({ params }) {
  const user = await requireUser(); const { subjectId } = await params;
  const [hub, cards] = await Promise.all([getSubjectHub(subjectId, user.id), getContextCards({ subjectId, userId: user.id })]);
  if (!hub) notFound();
  const due = hub.units.reduce((sum, unit) => sum + Number(unit.due_count), 0); const weak = hub.units.reduce((sum, unit) => sum + Number(unit.weak_count), 0);
  const nextUnit = [...hub.units].sort((a,b) => Number(b.due_count)+Number(b.weak_count)*2-(Number(a.due_count)+Number(a.weak_count)*2))[0];
  return <main className="workspace-page subject-page"><Breadcrumbs module={hub.subject.name} moduleId={hub.subject.id} /><header className="workspace-header"><div><p className="eyebrow">Module</p><h1>{hub.subject.name}</h1><p>{hub.subject.description || "Choose a Study Unit and continue where you left off."}</p></div>{nextUnit ? <Link className="button primary" href={`/study-units/${nextUnit.id}`}>Continue studying</Link> : null}</header><section className="module-snoo"><SnoozeMascot variant="coach" mood={due ? "encouraging" : "happy"} /><div><strong>{due ? `${due} cards are due across this module.` : "This module is caught up."}</strong><span>{weak ? `Snoo found ${weak} weak cards worth revisiting.` : "Choose a Study Unit to keep building your memory."}</span></div></section><section className="subject-metrics"><article><strong>{hub.units.length}</strong><span>Study units</span></article><article><strong>{hub.decks.length}</strong><span>Decks</span></article><article><strong>{cards.length}</strong><span>Cards</span></article><article><strong>{due}</strong><span>Due</span></article><article><strong>{weak}</strong><span>Weak</span></article></section><section className="unit-shelf"><div className="section-heading"><div><p className="eyebrow">Study Units</p><h2>Inside {hub.subject.name}</h2></div></div>{hub.units.length ? <div className="unit-grid">{hub.units.map((unit,index) => <Link className="unit-card" href={`/study-units/${unit.id}`} key={unit.id}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{unit.name}</h3><p>{unit.deck_count} decks · {unit.card_count} cards</p><small>{unit.due_count} due · {unit.weak_count} weak</small></div><b>→</b></Link>)}</div> : <div className="snoo-empty"><SnoozeMascot variant="coach" mood="thinking" /><div><h3>No Study Units yet</h3><p>Create the first Study Unit from Modules to organise this module.</p><Link className="button" href="/library">Manage modules</Link></div></div>}</section><ResourceLinks resources={hub.resources} subjectId={hub.subject.id} /><StudyContextTools subject={hub.subject.name} decks={hub.decks} cards={cards} /></main>;
}
