import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getContextCards, getStudyUnitHub } from "@/lib/db";
import ResourceLinks from "@/components/ResourceLinks";
import StudyContextTools from "@/components/StudyContextTools";

export const dynamic = "force-dynamic";
export default async function StudyUnitPage({ params }) {
  const user = await requireUser(); const { folderId } = await params;
  const [hub, cards] = await Promise.all([getStudyUnitHub(folderId, user.id), getContextCards({ folderId, userId: user.id })]);
  if (!hub) notFound();
  return <main className="workspace-page subject-page"><header className="workspace-header"><div><p className="eyebrow">{hub.unit.subject_name || "Unassigned subject"} · Study unit</p><h1>{hub.unit.name}</h1><p>{cards.filter((card) => card.due).length} cards due · {cards.filter((card) => card.weak).length} weak areas</p></div><Link className="button" href={hub.unit.subject_id ? `/subjects/${hub.unit.subject_id}` : "/library"}>← Back</Link></header><section className="unit-decks"><div className="section-heading"><div><p className="eyebrow">Flashcard sets</p><h2>Study this unit</h2></div></div><div className="compact-deck-grid">{hub.decks.map((deck) => <article className="library-deck-card" key={deck.id}><Link href={`/decks/${deck.id}`}><span className="library-deck-icon">▤</span><div><h2>{deck.title}</h2><p>{deck.description || "Ready to review."}</p></div></Link><div className="library-deck-meta"><span>{deck.card_count} cards</span><span>{deck.due_count} due</span><span>{deck.accuracy}%</span></div><div className="library-card-actions"><Link className="button" href={`/decks/${deck.id}`}>Open</Link><Link className="button primary" href={`/decks/${deck.id}/learn`}>Study now</Link></div></article>)}</div></section><ResourceLinks resources={hub.resources} folderId={hub.unit.id} /><StudyContextTools subject={hub.unit.subject_name || "Unassigned"} unit={hub.unit.name} decks={hub.decks} cards={cards} /></main>;
}
