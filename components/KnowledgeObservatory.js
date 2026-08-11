import Link from "next/link";

export default function KnowledgeObservatory({ constellations }) {
  return <section className="observatory" aria-labelledby="observatory-title"><div className="observatory-heading"><div><p className="eyebrow">Knowledge Observatory</p><h2 id="observatory-title">Your learning universe</h2><p>Every deck becomes brighter as recall turns into mastery.</p></div><Link className="button" href="/goals">Plan an exam</Link></div>
    {constellations.length ? <div className="constellation-grid">{constellations.map((deck, index) => <Link href={`/decks/${deck.id}`} className="constellation" style={{ "--orbit": `${(index % 4) + 1}` }} key={deck.id}><div className="constellation-sky" aria-hidden="true">{Array.from({ length: Math.min(12, Math.max(3, Math.ceil(deck.card_count / 5))) }, (_, star) => <i className={star < Math.ceil(deck.score / 10) ? "lit" : ""} key={star} />)}</div><div><strong>{deck.title}</strong><span>{deck.label}</span></div><b>{deck.score}%</b></Link>)}</div> : <div className="workspace-empty"><strong>Your sky is waiting</strong><p>Create a deck to form your first constellation.</p></div>}
  </section>;
}
