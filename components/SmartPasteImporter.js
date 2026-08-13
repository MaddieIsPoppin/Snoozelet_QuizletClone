"use client";

import { useMemo, useState } from "react";
import { parseSmartPaste } from "@/lib/import";
import { importCardsAction } from "@/app/actions";

export default function SmartPasteImporter({ deckId, existingCards = [] }) {
  const [raw, setRaw] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const parsed = useMemo(() => parseSmartPaste(raw), [raw]);
  const existing = useMemo(() => new Set(existingCards.map((card) => `${card.term.trim().toLowerCase()}\0${card.definition.trim().toLowerCase()}`)), [existingCards]);
  const duplicates = drafts.filter((card) => existing.has(`${card.term.toLowerCase()}\0${card.definition.toLowerCase()}`));
  const serialized = drafts.filter((card) => card.term.trim() && card.definition.trim() && !existing.has(`${card.term.toLowerCase()}\0${card.definition.toLowerCase()}`)).map((card) => `${card.term}\t${card.definition.replace(/\n/g, " ")}`).join("\n");

  function updateDraft(index, field, value) { setDrafts((current) => current.map((card, cardIndex) => cardIndex === index ? { ...card, [field]: value } : card)); }
  return <div className="smart-paste"><label>Paste cards<textarea value={raw} onChange={(event) => { setRaw(event.target.value); setPreviewing(false); }} rows="10" placeholder={'# SNOOZELET\nModule: CMPG321\nStudy Unit: Study Unit 3\nDeck: Distributed Databases\n\nQ: What is a DDBMS?\nA: A DBMS managing one logical distributed database.'} /></label>{!previewing ? <button className="button primary" type="button" disabled={!raw.trim()} onClick={() => { setDrafts(parsed.cards); setPreviewing(true); }}>Preview import</button> : <div className="smart-preview"><div className="smart-preview-summary"><strong>{drafts.length} detected</strong><span>{duplicates.length} duplicates</span><span>{parsed.invalid.length} unrecognised</span></div>{Object.values(parsed.metadata).some(Boolean) ? <p className="smart-metadata">Detected: {[parsed.metadata.subject, parsed.metadata.folder, parsed.metadata.set].filter(Boolean).join(" Â· ")}</p> : null}<div className="smart-card-list">{drafts.slice(0, 50).map((card, index) => <article className={existing.has(`${card.term.toLowerCase()}\0${card.definition.toLowerCase()}`) ? "duplicate" : ""} key={index}><label>Front<input value={card.term} onChange={(event) => updateDraft(index, "term", event.target.value)} /></label><label>Back<textarea value={card.definition} onChange={(event) => updateDraft(index, "definition", event.target.value)} rows="2" /></label>{existing.has(`${card.term.toLowerCase()}\0${card.definition.toLowerCase()}`) ? <small>Already in this set</small> : null}</article>)}</div>{parsed.invalid.length ? <details><summary>{parsed.invalid.length} lines need attention</summary>{parsed.invalid.map((item, index) => <p key={index}>{item.term || "Missing question"} â€” {item.reason}</p>)}</details> : null}<form action={importCardsAction}><input type="hidden" name="deckId" value={deckId} /><input type="hidden" name="format" value="smart" /><textarea name="cards" value={serialized} readOnly hidden /><div className="row-actions"><button className="button primary" type="submit" disabled={!serialized}>Import {drafts.length - duplicates.length} cards</button><button className="button" type="button" onClick={() => setPreviewing(false)}>Back to paste</button></div></form></div>}</div>;
}
