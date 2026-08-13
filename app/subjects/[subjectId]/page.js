import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDeckFolderAction } from "@/app/actions";
import Breadcrumbs from "@/components/Breadcrumbs";
import ResourceLinks from "@/components/ResourceLinks";
import StudyUnitForm from "@/components/StudyUnitForm";
import { requireUser } from "@/lib/auth";
import { getContextCards, getSubjectHub } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function SubjectPage({ params }) {
  const user = await requireUser(); const { subjectId } = await params;
  const [hub, cards] = await Promise.all([getSubjectHub(subjectId,user.id),getContextCards({subjectId,userId:user.id})]);
  if (!hub) notFound();
  const due=hub.units.reduce((sum,unit)=>sum+Number(unit.due_count),0), weak=hub.units.reduce((sum,unit)=>sum+Number(unit.weak_count),0);
  const nextUnit=[...hub.units].sort((a,b)=>Number(b.due_count)+Number(b.weak_count)*2-(Number(a.due_count)+Number(a.weak_count)*2))[0];
  return <main className="workspace-page subject-page">
    <Breadcrumbs module={hub.subject.name} moduleId={hub.subject.id} />
    <header className="workspace-header"><div><p className="eyebrow">Module</p><h1>{hub.subject.name}</h1><p>{hub.subject.description || "Choose a Study Unit and continue where you left off."}</p></div>{nextUnit ? <Link className="button primary" href={`/study-units/${nextUnit.id}`}>Continue studying</Link> : null}</header>
    <section className="module-status"><div className="flow-step">2</div><div><strong>{due?`${due} cards are due across this Module.`:"This Module is caught up."}</strong><span>{weak?`${weak} weak cards are worth revisiting.`:"Choose a Study Unit to keep building your memory."}</span></div></section>
    <section className="module-unit-manager"><div><p className="eyebrow">Structure</p><h2>Add a Study Unit</h2><p>Study Units divide {hub.subject.name} into the sections you learn in class.</p></div><StudyUnitForm subjectId={hub.subject.id}/></section>
    <section className="subject-metrics"><article><strong>{hub.units.length}</strong><span>Study Units</span></article><article><strong>{hub.decks.length}</strong><span>Decks</span></article><article><strong>{cards.length}</strong><span>Cards</span></article><article><strong>{due}</strong><span>Due</span></article><article><strong>{weak}</strong><span>Weak</span></article></section>
    <section className="unit-shelf"><div className="section-heading"><div><p className="eyebrow">Study Units</p><h2>Inside {hub.subject.name}</h2></div></div>{hub.units.length?<div className="unit-grid">{hub.units.map((unit,index)=><article className="unit-manage-card" key={unit.id}><Link className="unit-card" href={`/study-units/${unit.id}`}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{unit.name}</h3><p>{unit.deck_count} decks · {unit.card_count} cards</p><small>{unit.due_count} due · {unit.weak_count} weak</small></div><b>→</b></Link><form action={deleteDeckFolderAction}><input type="hidden" name="folderId" value={unit.id}/><button type="submit" aria-label={`Delete ${unit.name}`}>Remove</button></form></article>)}</div>:<div className="plain-empty"><div className="flow-step">2</div><div><h3>No Study Units yet</h3><p>Use the form above to add the first section of this Module.</p></div></div>}</section>
    <ResourceLinks resources={hub.resources} subjectId={hub.subject.id}/>
  </main>;
}
