import StudyLauncher from "@/components/StudyLauncher";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function AiPage() { const user=await requireUser(); const [decks,folders,subjects]=await Promise.all([getDecks(user.id),getDeckFolders(user.id),getSubjects(user.id)]); return <main className="workspace-page"><header className="workspace-header compact-header"><div><p className="eyebrow">AI help</p><h1>Study with AI</h1><p>Choose the material. Snoozelet prepares a private prompt for ChatGPT or Google Gemini.</p></div></header><StudyLauncher decks={decks} folders={folders} subjects={subjects} purpose="ai"/></main>; }
