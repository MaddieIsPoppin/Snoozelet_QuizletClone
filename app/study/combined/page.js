import { notFound } from "next/navigation";
import CombinedStudySession from "@/components/CombinedStudySession";
import { requireUser } from "@/lib/auth";
import { getCombinedStudySnapshot, getDeckGroups } from "@/lib/db";
export const dynamic="force-dynamic";export const runtime="nodejs";
const allowed=new Set(["multiple-choice","flashcards","typed","games"]);
export default async function CombinedPage({searchParams}){const user=await requireUser();const query=await searchParams;let ids=String(query?.decks||"").split(",").filter(Boolean),name="Combined study session";if(query?.group){const groups=await getDeckGroups(user.id),group=groups.find(item=>String(item.id)===String(query.group));if(!group)notFound();ids=group.decks.map(deck=>deck.id);name=group.name;}const{decks,cards}=await getCombinedStudySnapshot(ids,user.id);if(decks.length<2)notFound();const deck={id:`combined-${decks.map(item=>item.id).join("-")}`,title:name,subject_name:"Multiple Modules",folder_name:"Combined Decks",sourceDecks:decks};const initialMode=allowed.has(String(query?.mode))?String(query.mode):"";return <main className="page combined-study-page"><CombinedStudySession deck={deck} cards={cards} initialMode={initialMode}/></main>;}
