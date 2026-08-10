export default function CardCreationGuide() {
  return (
    <details className="card-creation-guide">
      <summary>How should I write cards for better tests?</summary>
      <div className="card-guide-content">
        <section><h3>Write focused cards</h3><ul><li>Put one fact or idea on each card.</li><li>Use a clear question or key term on the front.</li><li>Keep the answer short enough to recall, but complete enough to understand.</li><li>Include distinguishing words such as dates, processes, causes, or locations.</li></ul></section>
        <section><h3>How Snoozelet builds questions</h3><ul><li><strong>Written:</strong> you type the definition or term.</li><li><strong>Multiple choice:</strong> the correct answer is mixed with related answers from other cards.</li><li><strong>True / False:</strong> your prompt is paired with either its answer or a related answer.</li></ul></section>
        <p className="card-guide-example"><strong>Better:</strong> “What enzyme unwinds DNA during replication?” → “Helicase”<br /><strong>Avoid:</strong> “DNA” → a full paragraph containing several facts.</p>
      </div>
    </details>
  );
}
