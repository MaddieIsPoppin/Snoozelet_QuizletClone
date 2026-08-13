import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getContextCards, getStudyUnitHub } from "@/lib/db";
import ResourceLinks from "@/components/ResourceLinks";
import StudyContextTools from "@/components/StudyContextTools";
import Breadcrumbs from "@/components/Breadcrumbs";
import SnoozeMascot from "@/components/SnoozeMascot";

export const dynamic = "force-dynamic";
export default async function StudyUnitPage({ params }) {
  const user = await requireUser(); const { folderId } = await params;
  const [hub, cards] = await Promise.all([getStudyUnitHub(folderId, user.id), getContextCards({ folderId, userId: user.id })]);
  if (!hub) notFound();
  const nextDeck = [...hub.decks].sort((a,b) => Number(b.due_count)+Number(b.weak_count)*2-(Number(a.due_count)+Number(a.weak_count)*2))[0];
  const due = cards.filter((card) => card.due).length, weak = cards.filter((card) => card.weak).length;
  return <main className="workspace-page subject-page"><Breadcrumbs module={hub.unit.subject_name} moduleId={hub.unit.subject_id} unit={hub.unit.name} unitId={hub.unit.id} /><header className="workspace-header"><div><p className="eyebrow">Study Unit</p><h1>{hub.unit.name}</h1><p>{due} cards due · {weak} weak areas · {hub.decks.length} decks</p></div>{nextDeck ? <Link className="button primary" href={`/decks/${nextDeck.id}/learn`}>Continue studying</Link> : null}</header><section className="module-snoo"><SnoozeMascot variant="coach" mood={weak ? "encouraging" : "happy"} /><div><strong>{weak ? `Let’s strengthen ${weak} weak cards.` : "This Study Unit is looking strong."}</strong><span>{nextDeck ? `${nextDeck.title} is the best place to continue.` : "Add a deck or import flashcards to begin."}</span></div></section><section className="unit-decks"><div className="section-heading"><div><p className="eyebrow">Decks</p><h2>Study this unit</h2></div></div>{hub.decks.length ? <div className="compact-deck-grid">{hub.decks.map((deck) => <article className="library-deck-card" key={deck.id}><Link href={`/decks/${deck.id}`}><span className="library-deck-icon">▤</span><div><h2>{deck.title}</h2><p>{deck.description || "Ready to review."}</p></div></Link><div className="library-deck-meta"><span>{deck.card_count} cards</span><span>{deck.due_count} due</span><span>{deck.accuracy}%</span></div><div className="library-card-actions"><Link className="button" href={`/decks/${deck.id}`}>Open deck</Link><Link className="button primary" href={`/decks/${deck.id}/learn`}>Study deck</Link></div></article>)}</div> : <div className="snoo-empty"><SnoozeMascot variant="coach" mood="thinking" /><div><h3>No decks yet</h3><p>Create a deck and assign it to this Study Unit.</p><Link className="button primary" href="/decks/new">Add deck</Link></div></div>}</section><ResourceLinks resources={hub.resources} folderId={hub.unit.id} /><StudyContextTools subject={hub.unit.subject_name || "Unorganised"} unit={hub.unit.name} decks={hub.decks} cards={cards} /></main>;
}
