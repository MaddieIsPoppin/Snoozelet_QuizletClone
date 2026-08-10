import Link from "next/link";
import BlastGame from "@/components/BlastGame";
import { loadStudyRoute } from "@/lib/study-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BlastPage({
  params,
}) {
  const { cards, deck } = await loadStudyRoute(params);

  return (
    <main className="page">
      <header className="topbar">
        <Link
          className="brand"
          href={`/decks/${deck.id}`}
        >
          Snoozelet
        </Link>

        <Link
          className="button"
          href={`/decks/${deck.id}`}
        >
          Back to deck
        </Link>
      </header>

      <BlastGame
        deck={deck}
        cards={cards}
      />
    </main>
  );
}
