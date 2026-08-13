import Link from "next/link";
import StudyContextTools from "@/components/StudyContextTools";
import { loadStudyRoute } from "@/lib/study-route";
export const dynamic="force-dynamic"; export const runtime="nodejs";
export default async function DeckAiPage({params}) { const {cards,deck}=await loadStudyRoute(params); const prepared=cards.map((card)=>({...card,attempts:card.correct_count+card.incorrect_count,accuracy:card.correct_count+card.incorrect_count?Math.round(card.correct_count/(card.correct_count+card.incorrect_count)*100):0,due:card.due_at<=new Date().toISOString()})); return <main className="workspace-page"><div className="ai-route-back"><Link href="/ai">← Choose another deck</Link></div><StudyContextTools subject={deck.subject_name||"Unorganised"} unit={deck.folder_name||""} decks={[deck]} cards={prepared}/></main>; }
