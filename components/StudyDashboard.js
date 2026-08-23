import Link from "next/link";
import { dueDecks, recentDeckActivity } from "@/lib/study-dashboard";

const context = (deck) => [deck.subject_name, deck.folder_name].filter(Boolean).join(" / ") || "Unfiled deck";
const formatDate = (value) => value ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)) : "";

export default function StudyDashboard({ decks, folders, subjects, reviews }) {
  const recent = recentDeckActivity(reviews, decks);
  const latest = recent[0];
  const due = dueDecks(decks);
  const totalDue = decks.reduce((sum, deck) => sum + Number(deck.due_count || 0), 0);
  if (!subjects.length && !folders.length && !decks.length) return <section className="study-first-time"><p className="eyebrow">Your first study set</p><h2>Create your first study set</h2><p><strong>Module</strong> is your subject. <strong>Study Unit</strong> is a topic. <strong>Deck</strong> contains the flashcards you study.</p><div className="hierarchy-hint" aria-label="Module then Study Unit then Deck"><span>Module</span><b>→</b><span>Study Unit</span><b>→</b><span>Deck</span></div><Link className="button primary" href="/decks/new">Create or import a Deck</Link></section>;
  return <div className="study-dashboard">
    {latest ? <section className="continue-study-card"><div><p className="eyebrow">Continue studying</p><h2>{latest.title}</h2><p>{context(latest)}</p><div className="study-card-meta"><span>{latest.card_count} cards</span><span>{latest.due_count} due</span><span>Last mode: {latest.last_mode.replaceAll("-", " ")}</span></div></div><Link className="button primary" href={`/decks/${latest.id}/${latest.last_mode}`}>Continue studying</Link></section> : <section className="study-welcome-card"><div><p className="eyebrow">Start here</p><h2>Choose a Deck and begin with Learn</h2><p>Your recent Deck will appear here after your first session.</p></div><Link className="button primary" href="/study/custom">Choose a Deck</Link></section>}
    <div className="study-dashboard-columns">
      <section className="study-dashboard-panel"><header><div><p className="eyebrow">Today</p><h2>Due for review</h2></div><strong className="dashboard-count">{totalDue}</strong></header>{due.length ? <div className="dashboard-row-list">{due.map((deck) => <div className="dashboard-deck-row" key={deck.id}><div><strong>{deck.title}</strong><small>{context(deck)} · {deck.due_count} due</small></div><Link className="button" href={`/decks/${deck.id}/learn`}>Review due cards</Link></div>)}</div> : <div className="dashboard-empty"><strong>Nothing is due right now.</strong><p>Continue a recent Deck or browse your Modules.</p></div>}</section>
      <section className="study-dashboard-panel"><header><div><p className="eyebrow">History</p><h2>Recent Decks</h2></div></header>{recent.length ? <div className="dashboard-row-list">{recent.map((deck) => <div className="dashboard-deck-row" key={deck.id}><div><strong>{deck.title}</strong><small>{context(deck)} · {deck.card_count} cards · {deck.due_count} due<br/>Last studied {formatDate(deck.last_studied)}</small></div><Link className="button" href={`/decks/${deck.id}/${deck.last_mode}`}>Study</Link></div>)}</div> : <div className="dashboard-empty"><strong>No study history yet.</strong><p>Complete a few cards and your recent Decks will appear here.</p></div>}</section>
    </div>
    <section className="study-dashboard-panel module-browser"><header><div><p className="eyebrow">Library</p><h2>Browse Modules</h2></div><Link href="/library">View full Library →</Link></header>{subjects.length ? <div className="module-dashboard-grid">{subjects.map((subject) => <Link href={`/subjects/${subject.id}`} key={subject.id}><span className="folder-icon">▰</span><strong>{subject.name}</strong><small>{subject.unit_count} Study Units · {subject.deck_count} Decks · {subject.due_count} due</small></Link>)}</div> : <div className="dashboard-empty"><strong>No Modules yet.</strong><p>Create one in the Library, or organise an existing Deck.</p></div>}</section>
    <section className="custom-session-callout"><div><h2>Build a custom session</h2><p>Choose a Module, Study Unit, Deck, and any learning mode.</p></div><Link className="button" href="/study/custom">Build a custom session</Link></section>
  </div>;
}
