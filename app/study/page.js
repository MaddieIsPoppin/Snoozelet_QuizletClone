import StudyLauncher from "@/components/StudyLauncher";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function StudyPage() { const user=await requireUser(); const [decks,folders,subjects]=await Promise.all([getDecks(user.id),getDeckFolders(user.id),getSubjects(user.id)]); return <main className="workspace-page study-hub"><header className="workspace-header compact-header"><div><p className="eyebrow">Study</p><h1>Start a study session</h1><p>Choose a Module, Study Unit, Deck, and Study Mode.</p></div></header><StudyLauncher decks={decks} folders={folders} subjects={subjects}/></main>; }
