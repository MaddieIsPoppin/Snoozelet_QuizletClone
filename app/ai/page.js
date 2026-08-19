import StudyLauncher from "@/components/StudyLauncher";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function AiPage() { const user=await requireUser(); const [decks,folders,subjects]=await Promise.all([getDecks(user.id),getDeckFolders(user.id),getSubjects(user.id)]); return <main className="workspace-page"><header className="workspace-header ai-help-header"><div className="workspace-feature-mark">AI</div><div><p className="eyebrow">AI Help</p><h1>Your study material, ready for a tutor</h1><p>Choose a Module, Study Unit, and deck. Snoozelet prepares the context, then you choose ChatGPT or Google Gemini.</p></div></header><StudyLauncher decks={decks} folders={folders} subjects={subjects} purpose="ai"/></main>; }
