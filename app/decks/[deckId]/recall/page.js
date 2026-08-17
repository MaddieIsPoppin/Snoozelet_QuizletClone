import StudySession from "@/components/StudySession";
import { loadStudyRoute } from "@/lib/study-route";
export const dynamic="force-dynamic"; export const runtime="nodejs";
export default async function RecallPage({params,searchParams}) { const query=await searchParams; const {cards,deck}=await loadStudyRoute(params); const selected=query?.scope==="weak"?cards.filter((card)=>card.weak):cards; return <main className="page study-page"><StudySession deck={deck} cards={selected.length?selected:cards} mode="recall"/></main>; }
