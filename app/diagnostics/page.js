import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function DiagnosticsPage() {
  const user = await requireUser();
  const started = performance.now();
  const counts = await queryOne(`SELECT COUNT(DISTINCT d.id) AS decks, COUNT(DISTINCT c.id) AS cards, COUNT(DISTINCT r.id) AS reviews
    FROM decks d LEFT JOIN cards c ON c.deck_id = d.id LEFT JOIN review_logs r ON r.deck_id = d.id WHERE d.user_id = ?`, [user.id]);
  const queryMs = Math.round((performance.now() - started) * 10) / 10;
  return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Diagnostics</p><h1>Lightweight health check</h1><p>A small, private snapshot to help spot performance problems.</p></div><Link className="button" href="/progress">Back to progress</Link></header><section className="progress-summary"><article><span>Database query</span><strong>{queryMs} ms</strong><small>Lower is better</small></article><article><span>Decks</span><strong>{counts.decks}</strong><small>owned by this account</small></article><article><span>Cards</span><strong>{counts.cards}</strong><small>stored locally</small></article><article><span>Reviews</span><strong>{counts.reviews}</strong><small>learning records</small></article></section><section className="progress-section"><h2>Built-in optimizations</h2><ul><li>Study modes are split into on-demand chunks.</li><li>Large deck editors are paginated.</li><li>Images load lazily and large uploads are compressed before transfer.</li><li>Database ownership and study queries use targeted indexes.</li><li>Static application assets are cached for faster repeat visits.</li></ul></section></main>;
}
