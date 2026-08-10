import Link from "next/link";
import StudySession from "@/components/StudySession";
import BrandMark from "@/components/BrandMark";
import { loadStudyRoute } from "@/lib/study-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LearnPage({ params, searchParams }) {
  const query = await searchParams;
  const { cards, deck } = await loadStudyRoute(params);
  const studyScope = query?.scope === "all" ? "all" : "targeted";

  return (
    <main className="page study-page">
      <header className="topbar">
        <Link className="brand" href={`/decks/${deck.id}`}>
          <BrandMark />
          <span>{deck.title}</span>
        </Link>
        <Link className="button" href={`/decks/${deck.id}`}>
          Manage
        </Link>
      </header>
      <StudySession deck={deck} cards={cards} mode="learn" studyScope={studyScope} />
    </main>
  );
}
