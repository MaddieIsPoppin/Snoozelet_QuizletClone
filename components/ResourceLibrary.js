"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createResourceLinkAction, deleteResourceLinkAction, updateResourceLinkAction } from "@/app/actions";
import { detectResourceType } from "@/lib/resources";

export const resourceTypes = {
  google_docs: ["Google Docs", "DOC"], google_slides: ["Google Slides", "SLD"], google_sheets: ["Google Sheets", "SHT"],
  google_drive: ["Google Drive", "DRV"], youtube: ["YouTube", "▶"], notebooklm: ["NotebookLM", "AI"], pdf: ["PDF", "PDF"],
  notes: ["Notes", "▤"], video: ["Video", "▶"], textbook: ["Textbook", "▥"], test: ["Previous test", "✓"], website: ["Website", "↗"],
};

export default function ResourceLibrary({ resources, subjects, folders }) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("newest");
  const [editing, setEditing] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const selectedSubject = subjects.find((item) => String(item.id) === subjectId);
  const units = folders.filter((item) => String(item.subject_id) === subjectId);
  const hasUnassigned = resources.some((item) => !item.subject_id);
  const wholeModuleCount = resources.filter((item) => String(item.subject_id) === subjectId && !item.folder_id).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let result = resources.filter((item) => {
      if (subjectId === "unassigned") { if (item.subject_id) return false; }
      else if (subjectId && String(item.subject_id) !== subjectId) return false;
      if (unitId === "whole" && item.folder_id) return false;
      if (unitId && unitId !== "whole" && String(item.folder_id) !== unitId) return false;
      return (type === "all" || item.type === type) && (!needle || [item.title, item.description].some((value) => String(value || "").toLowerCase().includes(needle)));
    });
    result = [...result].sort(sort === "name" ? (a, b) => a.title.localeCompare(b.title) : (a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    return result;
  }, [query, resources, sort, subjectId, type, unitId]);

  function chooseSubject(id) { setSubjectId(String(id)); setUnitId(""); }
  function openCreate() { setEditing(null); setDrawerOpen(true); setNotice(""); }
  function openEdit(resource) { setEditing(resource); setDrawerOpen(true); setNotice(""); }
  function run(action, data, success, close = true) {
    startTransition(async () => {
      try { await action(data); setNotice(success); if (close) setDrawerOpen(false); router.refresh(); }
      catch (error) { setNotice(error?.message || "That resource could not be saved."); }
    });
  }
  function remove(resource) {
    if (!window.confirm(`Remove ${resource.title} from Snoozelet? The original external file will not be deleted.`)) return;
    const data = new FormData(); data.set("resourceId", resource.id); data.set("subjectId", resource.subject_id || ""); data.set("folderId", resource.folder_id || "");
    run(deleteResourceLinkAction, data, `${resource.title} removed.`, false);
  }
  async function copyLink(resource) { await navigator.clipboard.writeText(resource.url); setNotice("Link copied."); }

  return <div className="resource-browser">
    <div className="resource-browser-toolbar">
      <div><strong>{subjectId ? selectedSubject?.name || "Unassigned resources" : "All resources"}</strong><small>{subjectId && unitId ? "Search is scoped to this location" : "Search titles and descriptions"}</small></div>
      <label className="file-search"><span>⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources" aria-label="Search resources" /></label>
      <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter by resource type"><option value="all">All types</option>{Object.entries(resourceTypes).map(([value, [label]]) => <option value={value} key={value}>{label}</option>)}</select>
      <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort resources"><option value="newest">Newest added</option><option value="name">Name A–Z</option></select>
      <button className="button primary" type="button" onClick={openCreate}>＋ Add resource</button>
    </div>
    {notice ? <p className="library-notice" role="status">{pending ? "Saving…" : notice}</p> : null}
    <div className="resource-hierarchy">
      <section className="resource-path-column"><header><span>1</span><div><strong>Modules</strong><small>Choose a course</small></div></header>
        <button className={!subjectId ? "selected" : ""} aria-pressed={!subjectId} type="button" onClick={() => chooseSubject("")}><span><strong>All resources</strong><small>{resources.length} resources</small></span><b>›</b></button>
        {subjects.map((subject) => { const count = resources.filter((item) => String(item.subject_id) === String(subject.id)).length; return <button className={subjectId === String(subject.id) ? "selected" : ""} aria-pressed={subjectId === String(subject.id)} title={subject.name} type="button" onClick={() => chooseSubject(subject.id)} key={subject.id}><span><strong>{subject.name}</strong><small>{count} resources</small></span><b>›</b></button>; })}
        {hasUnassigned ? <button className={subjectId === "unassigned" ? "selected" : ""} aria-pressed={subjectId === "unassigned"} type="button" onClick={() => chooseSubject("unassigned")}><span><strong>Unassigned resources</strong><small>{resources.filter((item) => !item.subject_id).length} need organising</small></span><b>›</b></button> : null}
      </section>
      <section className="resource-path-column"><header><span>2</span><div><strong>Study Units</strong><small>{selectedSubject ? selectedSubject.name : "Select a Module"}</small></div></header>
        {!subjectId ? <div className="resource-column-empty">Select a Module to narrow the list.</div> : subjectId === "unassigned" ? <button className="selected" type="button"><span><strong>Unassigned</strong><small>No saved location</small></span></button> : <><button className={unitId === "whole" ? "selected" : ""} aria-pressed={unitId === "whole"} type="button" onClick={() => setUnitId("whole")}><span><strong>Whole Module</strong><small>{wholeModuleCount} resources</small></span><b>›</b></button>{units.map((unit) => { const count = resources.filter((item) => String(item.folder_id) === String(unit.id)).length; return <button className={unitId === String(unit.id) ? "selected" : ""} aria-pressed={unitId === String(unit.id)} title={unit.name} type="button" onClick={() => setUnitId(String(unit.id))} key={unit.id}><span><strong>{unit.name}</strong><small>{count} resources</small></span><b>›</b></button>; })}</>}
      </section>
      <section className="resource-results"><header><div><strong>Resources</strong><small>{visible.length} shown</small></div></header>
        {visible.length ? <div className="resource-row-list">{visible.map((resource) => <article className="resource-row" key={resource.id}><span className="resource-kind" aria-hidden="true">{resourceTypes[resource.type]?.[1] || "↗"}</span><div><strong title={resource.title}>{resource.title}</strong><small>{resourceTypes[resource.type]?.[0] || resource.type} · {[resource.subject_name, resource.folder_name || (resource.subject_id ? "Whole Module" : "Unassigned")].filter(Boolean).join(" / ")}</small>{resource.description ? <p>{resource.description}</p> : null}</div><a className="button primary" href={resource.url} target="_blank" rel="noopener noreferrer">Open resource ↗</a><details className="file-actions"><summary aria-label={`Actions for ${resource.title}`}>•••</summary><div><button type="button" onClick={() => openEdit(resource)}>Edit / move</button><button type="button" onClick={() => copyLink(resource)}>Copy link</button><button className="danger-text" type="button" onClick={() => remove(resource)}>Remove</button></div></details></article>)}</div> : <div className="workspace-empty"><strong>{subjectId && !unitId && subjectId !== "unassigned" ? "Choose a Study Unit" : "No resources here"}</strong><p>{subjectId && !unitId && subjectId !== "unassigned" ? "Select Whole Module or a Study Unit to see its resources." : "Add a resource here or adjust the search and filters."}</p><button className="button primary" type="button" onClick={openCreate}>Add resource</button></div>}
      </section>
    </div>
    {drawerOpen ? <ResourceEditor resource={editing} resources={resources} subjects={subjects} folders={folders} initialSubjectId={subjectId && subjectId !== "unassigned" ? subjectId : ""} initialUnitId={unitId && unitId !== "whole" ? unitId : ""} pending={pending} onClose={() => setDrawerOpen(false)} onSubmit={(data) => run(editing ? updateResourceLinkAction : createResourceLinkAction, data, editing ? "Resource updated." : "Resource saved.")} /> : null}
  </div>;
}

function ResourceEditor({ resource, resources, subjects, folders, initialSubjectId, initialUnitId, pending, onClose, onSubmit }) {
  const [title, setTitle] = useState(resource?.title || "");
  const [url, setUrl] = useState(resource?.url || "");
  const [subjectId, setSubjectId] = useState(String(resource?.subject_id || initialSubjectId || ""));
  const [folderId, setFolderId] = useState(String(resource?.folder_id || initialUnitId || ""));
  const [type, setType] = useState(resource?.type || "website");
  const [manualType, setManualType] = useState(Boolean(resource));
  const [error, setError] = useState("");
  const availableFolders = folders.filter((item) => String(item.subject_id) === subjectId);
  function changeUrl(value) { setUrl(value); if (!manualType) { const detected = detectResourceType(value); if (detected) setType(detected); } }
  function submit(event) {
    event.preventDefault(); setError("");
    let parsed; try { parsed = new URL(url); } catch { setError("Enter a complete URL beginning with http:// or https://."); return; }
    if (!["http:", "https:"].includes(parsed.protocol)) { setError("Resource links must begin with http:// or https://."); return; }
    if (!title.trim()) { setError("Enter a meaningful resource title."); return; }
    if (!subjectId) { setError("Choose a Module."); return; }
    if (resources.some((item) => String(item.id) !== String(resource?.id) && item.url === parsed.href)) { setError("This exact resource link is already saved."); return; }
    const data = new FormData(event.currentTarget); onSubmit(data);
  }
  return <div className="resource-modal" role="dialog" aria-modal="true" aria-labelledby="resource-editor-title"><button className="resource-modal-backdrop" type="button" onClick={onClose} aria-label="Close resource editor" /><section><header><div><p className="eyebrow">{resource ? "Edit resource" : "New resource"}</p><h2 id="resource-editor-title">{resource ? "Update or move resource" : "Add a study resource"}</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></header><form onSubmit={submit} noValidate>
    {resource ? <input type="hidden" name="resourceId" value={resource.id} /> : null}
    <label>Resource title<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="CPU Scheduling Lecture Notes" maxLength="120" required /></label>
    <label>URL<input name="url" type="url" value={url} onChange={(event) => changeUrl(event.target.value)} placeholder="https://…" required /></label>
    <div className="resource-editor-grid"><label>Module<select name="subjectId" value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setFolderId(""); }} required><option value="">Choose Module</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select></label><label>Study Unit<select name="folderId" value={folderId} onChange={(event) => setFolderId(event.target.value)} disabled={!subjectId}><option value="">Whole Module</option>{availableFolders.map((folder) => <option value={folder.id} key={folder.id}>{folder.name}</option>)}</select></label></div>
    <label>Resource type<select name="type" value={type} onChange={(event) => { setType(event.target.value); setManualType(true); }}>{Object.entries(resourceTypes).map(([value, [label]]) => <option value={value} key={value}>{label}</option>)}</select><small>{detectResourceType(url) ? `Suggested from URL: ${resourceTypes[detectResourceType(url)]?.[0]}` : "Paste a supported URL to detect its provider."}</small></label>
    <label>Description <span className="optional">Optional</span><textarea name="description" defaultValue={resource?.description || ""} rows="4" maxLength="300" /></label>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <footer><button className="button" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Save resource"}</button></footer>
  </form></section></div>;
}
