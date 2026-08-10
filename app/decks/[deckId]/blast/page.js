import Link from "next/link";
import { notFound } from "next/navigation";

import BlastGame from "@/components/BlastGame";
import { requireUser } from "@/lib/auth";
import {
  getDeck,
  getStudySnapshot,
} from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BlastPage({
  params,
}) {
  const user = await requireUser();

  const { deckId } = await params;

  const deck = await getDeck(
    deckId,
    user.id
  );

  if (!deck) {
    notFound();
  }

  const cards =
    await getStudySnapshot(
      deck.id,
      user.id
    );

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