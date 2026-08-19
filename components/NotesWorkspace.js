"use client";

import { useMemo, useState } from "react";
import { createNoteAction, deleteNoteAction, updateNoteAction } from "@/app/actions";

function ContextFields({ note = {}, subjects, folders, decks }) {
  return <div className="note-context-fields">
    <label>Module<select name="subjectId" defaultValue={note.subject_id || ""}><option value="">No Module</option>{subjects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label>Study Unit<select name="folderId" defaultValue={note.folder_id || ""}><option value="">No Study Unit</option>{folders.map((item) => <option value={item.id} key={item.id}>{item.subject_name ? `${item.subject_name} › ` : ""}{item.name}</option>)}</select></label>
    <label>Deck<select name="deckId" defaultValue={note.deck_id || ""}><option value="">No Deck</option>{decks.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
  </div>;
}

export default function NotesWorkspace({ notes, subjects, folders, decks }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return notes;
    return notes.filter((note) => [note.title, note.content, note.subject_name, note.folder_name, note.deck_title].some((value) => String(value || "").toLowerCase().includes(needle)));
  }, [notes, query]);

  return <div className="notes-workspace">
    <section className="note-compose-panel">
      <div><p className="eyebrow">New note</p><h2>Capture the explanation</h2><p>Keep lecture summaries, worked examples, and longer explanations beside your study material.</p></div>
      <form action={createNoteAction} className="note-form">
        <label>Title<input name="title" maxLength="160" placeholder="Transaction isolation summary" required /></label>
        <ContextFields subjects={subjects} folders={folders} decks={decks} />
        <label>Note<textarea name="content" rows="12" placeholder="Write freely here…" /></label>
        <button className="button primary" type="submit">Save note</button>
      </form>
    </section>
    <section className="notes-library">
      <div className="notes-toolbar"><div><p className="eyebrow">Notebook</p><h2>{notes.length} {notes.length === 1 ? "note" : "notes"}</h2></div><label><span>Search notes</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles and text" /></label></div>
      {filtered.length ? <div className="note-list">{filtered.map((note) => <article className="note-card" key={note.id}>
        <div className="note-card-heading"><div><div className="note-context-line">{[note.subject_name, note.folder_name, note.deck_title].filter(Boolean).join(" / ") || "General note"}</div><h3>{note.title}</h3></div><time>{new Date(note.updated_at).toLocaleDateString()}</time></div>
        <p className="note-preview">{note.content || "This note is empty."}</p>
        <details><summary>Open and edit</summary><form action={updateNoteAction} className="note-form"><input type="hidden" name="noteId" value={note.id} /><label>Title<input name="title" defaultValue={note.title} maxLength="160" required /></label><ContextFields note={note} subjects={subjects} folders={folders} decks={decks} /><label>Note<textarea name="content" defaultValue={note.content} rows="16" /></label><button className="button primary" type="submit">Save changes</button></form></details>
        <form action={deleteNoteAction}><input type="hidden" name="noteId" value={note.id} /><button className="note-delete" type="submit">Delete note</button></form>
      </article>)}</div> : <div className="workspace-empty"><strong>No matching notes</strong><p>Try another search, or create a note above.</p></div>}
    </section>
  </div>;
}
