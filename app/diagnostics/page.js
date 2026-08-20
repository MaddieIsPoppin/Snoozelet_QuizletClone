import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDatabaseInfo, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function DiagnosticsPage() {
  const user = await requireUser();
  const started = performance.now();
  const counts = await queryOne(`SELECT COUNT(DISTINCT d.id) AS decks, COUNT(DISTINCT c.id) AS cards, COUNT(DISTINCT r.id) AS reviews
    FROM decks d LEFT JOIN cards c ON c.deck_id = d.id LEFT JOIN review_logs r ON r.deck_id = d.id WHERE d.user_id = ?`, [user.id]);
  const queryMs = Math.round((performance.now() - started) * 10) / 10;
  const database = getDatabaseInfo();
  return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Diagnostics</p><h1>Your local data is visible</h1><p>One database, one source of truth, with no cloud fallback.</p></div><Link className="button" href="/progress">Back to progress</Link></header><section className="progress-summary"><article><span>Database query</span><strong>{queryMs} ms</strong><small>Lower is better</small></article><article><span>Decks</span><strong>{counts.decks}</strong><small>owned by this account</small></article><article><span>Cards</span><strong>{counts.cards}</strong><small>stored locally</small></article><article><span>Reviews</span><strong>{counts.reviews}</strong><small>learning records</small></article></section><section className="progress-section local-data-panel"><h2>Local database</h2><p><strong>Status:</strong> Connected locally</p><p><strong>File:</strong> <code>{database.path}</code></p><p>Automatic snapshots are stored in <code>data/backups</code>. Snoozelet never switches to Turso or an older cloud copy.</p><div className="row-actions"><a className="button primary" href="/api/backup/local">Download SQLite backup</a><a className="button" href="/api/backup">Download portable JSON</a></div></section></main>;
}
