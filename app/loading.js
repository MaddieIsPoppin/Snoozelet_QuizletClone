export default function Loading() {
  return (
    <main className="workspace-page page-loading" aria-busy="true" aria-label="Loading Snoozelet">
      <div className="loading-heading skeleton-block" />
      <div className="loading-hero skeleton-block" />
      <div className="loading-grid">
        <div className="loading-card skeleton-block" />
        <div className="loading-card skeleton-block" />
        <div className="loading-card skeleton-block" />
      </div>
      <span className="sr-only">Loading…</span>
    </main>
  );
}
