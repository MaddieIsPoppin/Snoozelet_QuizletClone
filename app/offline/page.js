import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <div className="offline-orbit" aria-hidden="true">☾</div>
      <p className="eyebrow">Snoozelet is offline</p>
      <h1>Your momentum is safe.</h1>
      <p>Reconnect to load this page. Study answers completed offline will sync automatically when your connection returns.</p>
      <Link className="button primary" href="/">Try again</Link>
    </main>
  );
}
