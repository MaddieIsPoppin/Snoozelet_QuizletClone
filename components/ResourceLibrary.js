"use client";

import { useMemo, useState } from "react";
import { createResourceLinkAction, deleteResourceLinkAction, updateResourceLinkAction } from "@/app/actions";
import ConfirmActionForm from "@/components/ConfirmActionForm";
import PendingForm from "@/components/PendingForm";

const labels = { notes: "Google Docs / notes", notebooklm: "NotebookLM", video: "Video", textbook: "Textbook / PDF", website: "Website", test: "Previous test" };
const icons = { notes: "▤", notebooklm: "AI", video: "▶", textbook: "▥", website: "↗", test: "✓" };

export default function ResourceLibrary({ resources, subjects, folders }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [subjectId, setSubjectId] = useState("");
  const visibleFolders = folders.filter((folder) => !subjectId || String(folder.subject_id) === subjectId);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return resources.filter((item) => (filter === "all" || item.type === filter) && (!needle || [item.title, item.description, item.subject_name, item.folder_name, item.type].some((value) => String(value || "").toLowerCase().includes(needle))));
  }, [filter, query, resources]);

  return <div className="resource-library">
    <section className="resource-library-toolbar">
      <div><h2>{resources.length} saved {resources.length === 1 ? "resource" : "resources"}</h2><p>Links stay with their Module and Study Unit.</p></div>
      <div className="resource-toolbar-actions">
        <label className="file-search"><span>⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources" aria-label="Search resources" /></label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter resource type"><option value="all">All types</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        <a className="button primary" href="#add-resource">＋ Add resource</a>
      </div>
    </section>
    {filtered.length ? <div className="resource-grid resource-library-grid">{filtered.map((resource) => <article className="resource-card" key={resource.id}>
      <span className="resource-kind" aria-hidden="true">{icons[resource.type] || "↗"}</span>
      <div><small>{[resource.subject_name, resource.folder_name].filter(Boolean).join(" / ") || labels[resource.type]}</small><h3>{resource.title}</h3><p>{resource.description || labels[resource.type] || "External study resource"}</p><a href={resource.url} target="_blank" rel="noreferrer">Open in new tab ↗</a>
        <details className="resource-edit"><summary>Edit</summary><form action={updateResourceLinkAction} className="form-stack"><input type="hidden" name="resourceId" value={resource.id} /><input type="hidden" name="subjectId" value={resource.subject_id || ""} /><input type="hidden" name="folderId" value={resource.folder_id || ""} /><label>Title<input name="title" defaultValue={resource.title} required /></label><label>URL<input name="url" type="url" defaultValue={resource.url} required /></label><label>Type<select name="type" defaultValue={resource.type}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Description<input name="description" defaultValue={resource.description || ""} /></label><button className="button" type="submit">Save changes</button></form></details>
      </div>
      <ConfirmActionForm action={deleteResourceLinkAction} fields={{ resourceId: resource.id, subjectId: resource.subject_id || "", folderId: resource.folder_id || "" }} message={`Remove ${resource.title}?`} label="Remove" className="resource-remove" />
    </article>)}</div> : <div className="workspace-empty"><strong>{query || filter !== "all" ? "No matching resources" : "No resources yet"}</strong><p>{query || filter !== "all" ? "Try a different search or filter." : "Add a Google Doc, video, PDF, or useful website."}</p><a className="button primary" href="#add-resource">Add resource</a></div>}
    <details className="resource-drawer" id="add-resource">
      <summary className="button primary">＋ Add resource</summary>
      <section className="resource-add-panel"><div><p className="eyebrow">New resource</p><h2>Add a study link</h2><p>Snoozelet stores only the link and where it belongs. Your document stays with its original service.</p></div><PendingForm action={createResourceLinkAction} submitLabel="Save resource" pendingLabel="Saving locally…"><label>Title<input name="title" maxLength="120" placeholder="Week 4 lecture notes" required /></label><label>URL<input name="url" type="url" placeholder="https://docs.google.com/…" required /></label><div className="note-context-fields"><label>Module<select name="subjectId" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} required><option value="">Choose Module</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label><label>Study Unit<select name="folderId" defaultValue=""><option value="">Whole Module</option>{visibleFolders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name}</option>)}</select></label><label>Type<select name="type" defaultValue="notes">{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><label>Description<input name="description" maxLength="300" placeholder="Optional reminder" /></label><button className="button primary" type="submit">Save resource</button></PendingForm></section>
    </details>
  </div>;
}
