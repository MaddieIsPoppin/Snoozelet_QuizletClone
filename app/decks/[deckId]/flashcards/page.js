import Link from "next/link";
import StudySession from "@/components/StudySession";
import BrandMark from "@/components/BrandMark";
import { loadStudyRoute } from "@/lib/study-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function FlashcardsPage({ params }) {
  const { cards, deck } = await loadStudyRoute(params);

  return (
    <main className="page study-page">
      <header className="topbar">
        <Link className="brand" href={`/decks/${deck.id}`}>
          <BrandMark />
          <span>{deck.title}</span>
        </Link>
      </header>
      <StudySession deck={deck} cards={cards} mode="flashcards" />
    </main>
  );
}
