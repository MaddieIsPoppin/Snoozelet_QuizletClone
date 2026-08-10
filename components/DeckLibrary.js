"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  assignDeckFolderAction,
  createDeckFolderAction,
  deleteDeckFolderAction,
} from "@/app/actions";

export default function DeckLibrary({ decks, folders }) {
  const [folder, setFolder] = useState("all");
  const [query, setQuery] = useState("");
  const [draggedDeckId, setDraggedDeckId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [isMoving, startTransition] = useTransition();
  function moveDeck(deckId, folderId) {
    const formData = new FormData();
    formData.set("deckId", deckId);
    formData.set("folderId", folderId);
    startTransition(async () => {
      await assignDeckFolderAction(formData);
      setDraggedDeckId(null);
      setDropTarget(null);
    });
  }
  function folderDropProps(folderId) {
    return {
      onDragOver: (event) => { event.preventDefault(); setDropTarget(folderId); },
      onDragLeave: () => setDropTarget(null),
      onDrop: (event) => { event.preventDefault(); if (draggedDeckId) moveDeck(draggedDeckId, folderId); },
    };
  }
  const visibleDecks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return decks.filter((deck) => {
      const folderMatch =
        folder === "all" ||
        (folder === "unfiled" && !deck.folder_id) ||
        String(deck.folder_id) === folder;
      const queryMatch = !normalized || `${deck.title} ${deck.description}`.toLowerCase().includes(normalized);
      return folderMatch && queryMatch;
    });
  }, [decks, folder, query]);

  return (
    <div className="library-workspace">
      <aside className="folder-panel">
        <div className="folder-panel-heading">
          <strong>Folders</strong>
          <span>{folders.length}</span>
        </div>
        <button className={folder === "all" ? "active" : ""} onClick={() => setFolder("all")} type="button">
          <span>All decks</span><small>{decks.length}</small>
        </button>
        <button {...folderDropProps("")} className={`${folder === "unfiled" ? "active " : ""}${dropTarget === "" ? "drop-target" : ""}`} onClick={() => setFolder("unfiled")} type="button">
          <span>No folder</span><small>{decks.filter((deck) => !deck.folder_id).length}</small>
        </button>
        {folders.map((item) => (
          <div className="folder-row" key={item.id}>
            <button {...folderDropProps(String(item.id))} className={`${folder === String(item.id) ? "active " : ""}${dropTarget === String(item.id) ? "drop-target" : ""}`} onClick={() => setFolder(String(item.id))} type="button">
              <span>{item.name}</span><small>{item.deck_count}</small>
            </button>
            <form action={deleteDeckFolderAction}>
              <input name="folderId" type="hidden" value={item.id} />
              <button className="folder-delete" type="submit" aria-label={`Delete ${item.name} folder`}>×</button>
            </form>
          </div>
        ))}
        <form action={createDeckFolderAction} className="new-folder-form">
          <strong>Create a folder</strong>
          <input name="name" maxLength="80" placeholder="New folder name" required />
          <button type="submit">Create folder</button>
        </form>
      </aside>

      <section className="library-decks">
        <div className="library-toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your decks" aria-label="Search decks" />
          <Link className="button primary" href="/decks/new">+ New deck</Link>
        </div>
        <p className="library-guidance">Open a deck to edit its cards, or start studying it immediately.</p>
        {visibleDecks.length ? (
          <div className="compact-deck-grid">
            {visibleDecks.map((deck) => (
              <article className={`library-deck-card${String(draggedDeckId) === String(deck.id) ? " is-dragging" : ""}`} key={deck.id} draggable onDragStart={() => setDraggedDeckId(String(deck.id))} onDragEnd={() => { setDraggedDeckId(null); setDropTarget(null); }}>
                <Link href={`/decks/${deck.id}`}>
                  <span className="library-deck-icon">▤</span>
                  <div><h2>{deck.title}</h2><p>{deck.description || "Ready when you are."}</p></div>
                </Link>
                <div className="library-deck-meta">
                  <span>{deck.card_count} cards</span><span>{deck.due_count} due</span><span>{deck.accuracy}%</span>
                </div>
                <div className="library-card-actions"><Link className="button" href={`/decks/${deck.id}`}>Open & edit</Link><Link className="button primary" href={`/decks/${deck.id}/learn`}>Study now</Link></div>
                <details className="library-organize"><summary>Move to a folder</summary><form action={assignDeckFolderAction}><input name="deckId" type="hidden" value={deck.id} /><label>Folder<select name="folderId" defaultValue={deck.folder_id || ""} onChange={(event) => event.currentTarget.form.requestSubmit()} aria-label={`Folder for ${deck.title}`}><option value="">No folder</option>{folders.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></form></details>
              </article>
            ))}
          </div>
        ) : <div className="workspace-empty"><strong>No decks found</strong><p>Create a deck or choose another folder.</p></div>}
        {isMoving ? <p className="library-move-status" role="status">Moving deck…</p> : null}
      </section>
    </div>
  );
}
