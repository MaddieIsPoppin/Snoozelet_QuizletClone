"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { assignDeckFolderAction, createSubjectAction } from "@/app/actions";
import SnoozeMascot from "@/components/SnoozeMascot";

export default function DeckLibrary({ decks = [], folders = [], subjects = [] }) {
  const [query, setQuery] = useState("");
  const unorganised = useMemo(() => decks.filter((deck) => !deck.folder_id && `${deck.title} ${deck.description}`.toLowerCase().includes(query.trim().toLowerCase())), [decks, query]);
  return <div className="modules-workspace">
    <section className="module-create-flow">
      <div className="module-create-copy"><SnoozeMascot variant="coach" mood={subjects.length ? "happy" : "thinking"} /><div><p className="eyebrow">Step 1</p><h2>{subjects.length ? "Open a Module" : "Create your first Module"}</h2><p>A Module is a university course such as CMPG321. Study Units and decks live inside it.</p></div></div>
      <form action={createSubjectAction} className="module-inline-form"><label>Module code<input name="name" placeholder="CMPG321" maxLength="100" required /></label><label>Module name<input name="description" placeholder="Database Systems" maxLength="500" /></label><button className="button primary" type="submit">Create Module</button></form>
    </section>
    <section className="module-list-section"><div className="section-heading"><div><p className="eyebrow">My Modules</p><h2>Choose where you want to study</h2></div><span>{subjects.length}</span></div>{subjects.length ? <div className="module-grid">{subjects.map((module) => <Link className="module-card" href={`/subjects/${module.id}`} key={module.id}><div className="module-card-top"><span>◎</span><small>{module.unit_count} Study Units</small></div><h3>{module.name}</h3><p>{module.description || "Open this Module to add its first Study Unit."}</p><div className="module-card-stats"><span>{module.deck_count} decks</span><span>{module.card_count} cards</span><span>{module.due_count} due</span></div><strong>Open Module →</strong></Link>)}</div> : null}</section>
    <section className="unorganised-section"><div className="section-heading"><div><p className="eyebrow">Unorganised</p><h2>Decks that still need a home</h2><p>Choose a Study Unit once, then the deck will appear in the right Module automatically.</p></div>{decks.some((deck) => !deck.folder_id) ? <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a deck" aria-label="Find an unorganised deck" /> : null}</div>{unorganised.length ? <div className="unorganised-decks">{unorganised.map((deck) => <article key={deck.id}><div><h3>{deck.title}</h3><p>{deck.card_count} cards · {deck.due_count} due</p></div><form action={assignDeckFolderAction}><input type="hidden" name="deckId" value={deck.id} /><label>Move to Study Unit<select name="folderId" defaultValue="" required><option value="" disabled>Choose Module › Study Unit</option>{folders.map((unit) => <option value={unit.id} key={unit.id}>{unit.subject_name ? `${unit.subject_name} › ` : "No Module › "}{unit.name}</option>)}</select></label><button className="button primary" type="submit" disabled={!folders.length}>Move deck</button></form><Link className="button" href={`/decks/${deck.id}`}>Open deck</Link></article>)}</div> : <div className="snoo-empty"><SnoozeMascot variant="coach" mood="happy" /><div><h3>{decks.some((deck) => !deck.folder_id) ? "No matching decks" : "Everything is organised"}</h3><p>{decks.some((deck) => !deck.folder_id) ? "Try a different search." : "Every deck belongs to a Study Unit."}</p></div></div>}</section>
  </div>;
}
