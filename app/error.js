"use client";

export default function ErrorPage({ reset }) {
  return (
    <section className="empty-state" role="alert">
      <h1>Something went wrong</h1>
      <p>Snoozelet could not load this page. Your saved study data was not changed.</p>
      <button className="button primary" type="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
