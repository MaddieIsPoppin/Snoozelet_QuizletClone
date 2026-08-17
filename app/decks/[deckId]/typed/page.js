import StudySession from "@/components/StudySession";
import { loadStudyRoute } from "@/lib/study-route";
export const dynamic="force-dynamic"; export const runtime="nodejs";
export default async function TypedPage({params}) { const {cards,deck}=await loadStudyRoute(params); return <main className="page study-page"><StudySession deck={deck} cards={cards} mode="typed"/></main>; }
