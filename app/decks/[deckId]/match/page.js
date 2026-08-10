import Link from "next/link";
import MatchGame from "@/components/MatchGame";
import { loadStudyRoute } from "@/lib/study-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function MatchPage({
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

      <MatchGame
        deck={deck}
        cards={cards}
      />
    </main>
  );
}
