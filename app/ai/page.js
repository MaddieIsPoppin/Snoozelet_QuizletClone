import StudyLauncher from "@/components/StudyLauncher";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function AiPage() { const user=await requireUser(); const [decks,folders,subjects]=await Promise.all([getDecks(user.id),getDeckFolders(user.id),getSubjects(user.id)]); return <main className="workspace-page"><header className="workspace-header ai-help-header"><div><p className="eyebrow">AI Help</p><h1>Take one deck to your AI tutor</h1><p>Choose a Module, Study Unit, and flashcard set to build a focused prompt.</p></div></header><StudyLauncher decks={decks} folders={folders} subjects={subjects} purpose="ai"/></main>; }
