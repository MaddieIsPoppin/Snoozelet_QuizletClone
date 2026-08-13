"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignDeckFolderAction, createSubjectAction } from "@/app/actions";

export default function DeckLibrary({ decks = [], folders = [], subjects = [] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [draggedDeck, setDraggedDeck] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [localFolders, setLocalFolders] = useState(() => Object.fromEntries(decks.map((deck) => [deck.id, deck.folder_id])));
  const [message, setMessage] = useState("");
  const [isMoving, startTransition] = useTransition();
  const visibleDecks = useMemo(() => { const term = query.trim().toLowerCase(); return decks.filter((deck) => !localFolders[deck.id] && (!term || `${deck.title} ${deck.description || ""}`.toLowerCase().includes(term))); }, [decks, localFolders, query]);
  const unitsFor = (subjectId) => folders.filter((folder) => String(folder.subject_id) === String(subjectId));
  const decksIn = (folderId) => decks.filter((deck) => String(localFolders[deck.id] || "") === String(folderId));

  function moveDeck(deckId, folderId) {
    const deck = decks.find((item) => String(item.id) === String(deckId));
    const unit = folders.find((item) => String(item.id) === String(folderId));
    if (!deck || !unit || String(localFolders[deck.id]) === String(unit.id)) return;
    const previous = localFolders[deck.id];
    setLocalFolders((current) => ({ ...current, [deck.id]: unit.id }));
    setMessage(`Moving ${deck.title} to ${unit.subject_name} › ${unit.name}…`);
    const data = new FormData(); data.set("deckId", deck.id); data.set("folderId", unit.id);
    startTransition(async () => { try { await assignDeckFolderAction(data); setMessage(`${deck.title} moved to ${unit.name}.`); router.refresh(); } catch { setLocalFolders((current) => ({ ...current, [deck.id]: previous })); setMessage("That deck could not be moved. Please try again."); } });
  }

  function dropOnUnit(event, folderId) {
    event.preventDefault();
    const deckId = event.dataTransfer.getData("text/plain") || draggedDeck;
    setDraggedDeck(null); setDropTarget(null); moveDeck(deckId, folderId);
  }

  return <div className="modules-workspace">
    <section className="module-create-flow">
      <div className="module-create-copy"><div className="flow-step">1</div><div><p className="eyebrow">Create</p><h2>Add a Module</h2><p>A Module is a course such as CMPG321. Open it afterwards to add Study Units.</p></div></div>
      <form action={createSubjectAction} className="module-inline-form"><label>Module code<input name="name" placeholder="CMPG321" maxLength="100" required /></label><label>Module name<input name="description" placeholder="Database Systems" maxLength="500" /></label><button className="button primary" type="submit">Add Module</button></form>
    </section>
    <section className="deck-organiser">
      <header className="organiser-heading"><div><p className="eyebrow">Organise</p><h2>Put every deck where it belongs</h2><p>Only unorganised decks appear in the tray. Drag one onto a Study Unit, or use Move to on a phone.</p></div><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search unorganised decks" aria-label="Search unorganised decks" /></header>
      {message ? <p className="move-toast" role="status" aria-live="polite">{isMoving ? "◌ " : "✓ "}{message}</p> : null}
      <div className="organiser-layout">
        <aside className="deck-tray"><div className="deck-tray-title"><strong>Decks</strong><span>{visibleDecks.length}</span></div><div className="deck-tray-list">
          {visibleDecks.map((deck) => { const unit = folders.find((folder) => String(folder.id) === String(localFolders[deck.id] || "")); return <article className={`organiser-deck ${draggedDeck === deck.id ? "is-dragging" : ""}`} draggable onDragStart={(event) => { event.dataTransfer.setData("text/plain", String(deck.id)); event.dataTransfer.effectAllowed = "move"; setDraggedDeck(deck.id); }} onDragEnd={() => { setDraggedDeck(null); setDropTarget(null); }} key={deck.id}>
            <div className="deck-drag-handle" aria-hidden="true">⠿</div><div className="organiser-deck-copy"><Link href={`/decks/${deck.id}`}>{deck.title}</Link><small>{unit ? `${unit.subject_name} › ${unit.name}` : "Unorganised"} · {deck.card_count} cards</small></div>
            <label className="mobile-move"><span>Move to</span><select value={localFolders[deck.id] || ""} onChange={(event) => moveDeck(deck.id, event.target.value)} disabled={isMoving || !folders.length}><option value="" disabled>Choose Study Unit</option>{folders.map((folder) => <option value={folder.id} key={folder.id}>{folder.subject_name} › {folder.name}</option>)}</select></label>
          </article>; })}
          {!visibleDecks.length ? <p className="organiser-empty">Every deck is organised.</p> : null}
        </div><Link className="button primary new-deck-shortcut" href="/decks/new">+ Create deck</Link></aside>
        <div className="module-board">
          {subjects.map((subject) => { const units = unitsFor(subject.id); return <section className="board-module" key={subject.id}><header><div><span className="module-symbol">◎</span><div><h3>{subject.name}</h3><p>{subject.description || "Module"}</p></div></div><Link href={`/subjects/${subject.id}`}>Manage Module →</Link></header>
            {units.length ? <div className="unit-drop-grid">{units.map((unit) => { const contained = decksIn(unit.id); const active = String(dropTarget) === String(unit.id); return <div className={`unit-drop-zone ${active ? "is-over" : ""}`} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(unit.id); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropTarget(null); }} onDrop={(event) => dropOnUnit(event, unit.id)} key={unit.id}><div className="unit-drop-heading"><Link href={`/study-units/${unit.id}`}>{unit.name}</Link><span>{contained.length}</span></div>{contained.length ? <div className="unit-deck-chips">{contained.map((deck) => <Link href={`/decks/${deck.id}`} key={deck.id}>{deck.title}</Link>)}</div> : <p>Drop a deck here</p>}</div>; })}</div> : <div className="no-units"><p>This Module needs a Study Unit before decks can be added.</p><Link className="button primary" href={`/subjects/${subject.id}`}>+ Add Study Unit</Link></div>}
          </section>; })}
          {!subjects.length ? <div className="organiser-empty board-empty"><h3>Create your first Module above</h3><p>It will appear here as a place for your Study Units and decks.</p></div> : null}
        </div>
      </div>
    </section>
  </div>;
}
