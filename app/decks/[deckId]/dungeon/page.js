import Link from "next/link";
import AdventureGame from "@/components/AdventureGame";
import { loadStudyRoute } from "@/lib/study-route";
export const dynamic = "force-dynamic";
export default async function DungeonPage({ params }) { const { cards, deck } = await loadStudyRoute(params); return <main className="page"><header className="topbar"><Link className="brand" href="/games">Snoozelet Arcade</Link><Link className="button" href="/games">Exit game</Link></header><AdventureGame deck={deck} cards={cards} /></main>; }
