"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  assignDeckFolderAction, createDeckFolderAction, createSubjectAction,
  deleteDeckFolderAction, deleteDeckFromLibraryAction, deleteSubjectAction,
  updateDeckFolderAction, updateSubjectAction,
} from "@/app/actions";

export default function DeckLibrary({ decks = [], folders = [], subjects = [] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openModules, setOpenModules] = useState(() => new Set());
  const [openUnits, setOpenUnits] = useState(() => new Set());
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const term = query.trim().toLowerCase();
  const matches = (...values) => !term || values.some((value) => String(value || "").toLowerCase().includes(term));
  const unitsFor = (id) => folders.filter((item) => String(item.subject_id) === String(id));
  const decksFor = (id) => decks.filter((item) => String(item.folder_id) === String(id));
  const looseDecks = decks.filter((item) => !item.folder_id && matches(item.title, item.description));
  const looseUnits = folders.filter((item) => !item.subject_id && (matches(item.name) || decksFor(item.id).some((deck) => matches(deck.title, deck.description))));
  const visibleSubjects = subjects.filter((subject) => matches(subject.name, subject.description) || unitsFor(subject.id).some((unit) => matches(unit.name) || decksFor(unit.id).some((deck) => matches(deck.title, deck.description))));

  const toggle = (setter, id) => setter((current) => {
    const next = new Set(current);
    next.has(String(id)) ? next.delete(String(id)) : next.add(String(id));
    return next;
  });
  const run = (action, data, success) => startTransition(async () => {
    try { await action(data); setNotice(success); router.refresh(); }
    catch (error) { setNotice(error?.message || "That change could not be saved."); }
  });
  const submitCreate = (event, action, success) => {
    event.preventDefault(); const form = event.currentTarget;
    run(action, new FormData(form), success); form.reset();
  };
  const moveDeck = (deck, folderId) => {
    const data = new FormData(); data.set("deckId", deck.id); data.set("folderId", folderId);
    run(assignDeckFolderAction, data, `${deck.title} moved.`);
  };
  const remove = (action, field, id, label) => {
    if (!window.confirm(`Delete ${label}? Items inside will be moved back to the library, not erased.`)) return;
    const data = new FormData(); data.set(field, id); run(action, data, `${label} removed.`);
  };
  const removeDeck = (deck) => {
    if (!window.confirm(`Delete ${deck.title} and all of its cards? This cannot be undone.`)) return;
    const data = new FormData(); data.set("deckId", deck.id);
    run(deleteDeckFromLibraryAction, data, `${deck.title} deleted.`);
  };

  const DeckActions = ({ deck, unfiled = false }) => <details className="file-actions">
    <summary>•••</summary><div>
      <Link href={`/decks/${deck.id}/learn`}>Study now</Link>
      <Link href={`/decks/${deck.id}`}>Edit cards</Link>
      <label>Move to<select value={unfiled ? "" : (deck.folder_id || "")} onChange={(event) => moveDeck(deck, event.target.value)}>
        {unfiled ? <option value="" disabled>Choose folder</option> : null}
        {folders.map((folder) => <option value={folder.id} key={folder.id}>{folder.subject_name} / {folder.name}</option>)}
      </select></label>
      <button className="danger-text" type="button" onClick={() => removeDeck(deck)}>Delete deck</button>
    </div>
  </details>;
  const DeckRow = ({ deck, unfiled = false }) => <div className="file-row deck-file">
    <Link className="file-open" href={`/decks/${deck.id}`}><span className="deck-file-icon">▤</span><span><strong>{deck.title}</strong><small>{deck.description || "Flashcard deck"}</small></span></Link>
    <span>{deck.card_count} cards</span><span>{new Date(deck.updated_at).toLocaleDateString()}</span>
    <DeckActions deck={deck} unfiled={unfiled} />
  </div>;

  return <section className="file-library">
    <header className="file-toolbar">
      <div className="file-breadcrumb"><span className="file-home-icon">S</span><div><strong>My Library</strong><small>{subjects.length} folders · {folders.length} subfolders · {decks.length} decks</small></div></div>
      <div className="file-toolbar-actions"><label className="file-search"><span>⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search everything" /></label><details className="new-menu"><summary className="button primary">＋ New</summary><div><form onSubmit={(event) => submitCreate(event, createSubjectAction, "Folder created.")}><strong>New folder</strong><input name="name" placeholder="Module or course name" required /><input name="description" placeholder="Optional description" /><button className="button primary" disabled={pending}>Create folder</button></form><Link className="button" href="/decks/new">New deck</Link></div></details></div>
    </header>
    {notice ? <p className="library-notice" role="status">{pending ? "Saving…" : notice}</p> : null}
    <div className="file-column-head"><span>Name</span><span>Contents</span><span>Updated</span><span>Actions</span></div>
    <div className="file-tree">
      {visibleSubjects.map((subject) => {
        const moduleOpen = Boolean(term) || openModules.has(String(subject.id));
        const units = unitsFor(subject.id);
        return <section className="file-folder" key={subject.id}>
          <div className="file-row module-row"><button className="file-open" type="button" onClick={() => toggle(setOpenModules, subject.id)}><span className="chevron">{moduleOpen ? "⌄" : "›"}</span><span className="folder-icon">▰</span><span><strong>{subject.name}</strong><small>{subject.description || "Folder"}</small></span></button><span>{units.length} folders</span><span>{new Date(subject.updated_at).toLocaleDateString()}</span><details className="file-actions"><summary>•••</summary><div><Link href={`/subjects/${subject.id}`}>Open overview</Link><form action={updateSubjectAction}><input type="hidden" name="subjectId" value={subject.id} /><input name="name" defaultValue={subject.name} required /><input name="description" defaultValue={subject.description || ""} /><button>Rename / save</button></form><button className="danger-text" type="button" onClick={() => remove(deleteSubjectAction, "subjectId", subject.id, subject.name)}>Delete folder</button></div></details></div>
          {moduleOpen ? <div className="file-children">
            {units.filter((unit) => matches(unit.name) || decksFor(unit.id).some((deck) => matches(deck.title, deck.description))).map((unit) => {
              const unitOpen = Boolean(term) || openUnits.has(String(unit.id));
              const contained = decksFor(unit.id).filter((deck) => matches(deck.title, deck.description));
              return <div className="unit-folder" key={unit.id}>
                <div className="file-row unit-row"><button className="file-open" type="button" onClick={() => toggle(setOpenUnits, unit.id)}><span className="chevron">{unitOpen ? "⌄" : "›"}</span><span className="folder-icon secondary">▰</span><span><strong>{unit.name}</strong><small>Study Unit</small></span></button><span>{decksFor(unit.id).length} decks</span><span>{new Date(unit.updated_at).toLocaleDateString()}</span><details className="file-actions"><summary>•••</summary><div><Link href={`/study-units/${unit.id}`}>Open folder</Link><Link href={`/decks/new?studyUnit=${unit.id}`}>New deck here</Link><form action={updateDeckFolderAction}><input type="hidden" name="folderId" value={unit.id} /><input name="name" defaultValue={unit.name} required /><button>Rename</button></form><button className="danger-text" type="button" onClick={() => remove(deleteDeckFolderAction, "folderId", unit.id, unit.name)}>Delete folder</button></div></details></div>
                {unitOpen ? <div className="file-decks">{contained.map((deck) => <DeckRow deck={deck} key={deck.id} />)}{!contained.length ? <div className="empty-folder"><span>Empty folder</span><Link href={`/decks/new?studyUnit=${unit.id}`}>＋ Add a deck</Link></div> : null}</div> : null}
              </div>;
            })}
            <form className="inline-folder-create" onSubmit={(event) => submitCreate(event, createDeckFolderAction, "Subfolder created.")}><input type="hidden" name="subjectId" value={subject.id} /><input name="name" placeholder="＋ New Study Unit" required /><button disabled={pending}>Create</button></form>
          </div> : null}
        </section>;
      })}
      {looseDecks.length ? <section className="loose-files"><div className="file-section-label">Unfiled decks</div>{looseDecks.map((deck) => <DeckRow deck={deck} unfiled key={deck.id} />)}</section> : null}
      {looseUnits.length ? <section className="loose-files"><div className="file-section-label">Folders without a Module</div>{looseUnits.map((unit) => <div key={unit.id}><div className="file-row unit-row"><Link className="file-open" href={`/study-units/${unit.id}`}><span className="folder-icon secondary">▰</span><span><strong>{unit.name}</strong><small>Unfiled Study Unit</small></span></Link><span>{decksFor(unit.id).length} decks</span><span>{new Date(unit.updated_at).toLocaleDateString()}</span><details className="file-actions"><summary>•••</summary><div><Link href={`/decks/new?studyUnit=${unit.id}`}>New deck here</Link><button className="danger-text" type="button" onClick={() => remove(deleteDeckFolderAction, "folderId", unit.id, unit.name)}>Delete folder</button></div></details></div>{decksFor(unit.id).map((deck) => <DeckRow deck={deck} key={deck.id} />)}</div>)}</section> : null}
      {!visibleSubjects.length && !looseDecks.length && !looseUnits.length ? <div className="workspace-empty"><strong>{term ? "Nothing matches your search" : "Your library is empty"}</strong><p>{term ? "Try a different name." : "Create a folder or deck to get started."}</p></div> : null}
    </div>
  </section>;
}
