import Link from "next/link";
import FocusJourney from "@/components/FocusJourney";
import { loadStudyRoute } from "@/lib/study-route";
import { calculateReadiness } from "@/lib/readiness";
export const dynamic = "force-dynamic";
export default async function FocusPage({ params }) { const { deck, cards } = await loadStudyRoute(params); const readiness = calculateReadiness(cards); return <main className="page"><header className="topbar"><Link className="brand" href="/">Snoozelet Observatory</Link><Link className="button" href="/">Leave journey</Link></header><FocusJourney deck={deck} minutes={readiness.minutes} /></main>; }
