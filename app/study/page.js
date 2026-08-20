import StudyLauncher from "@/components/StudyLauncher";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function StudyPage() { const user=await requireUser(); const [decks,folders,subjects]=await Promise.all([getDecks(user.id),getDeckFolders(user.id),getSubjects(user.id)]); return <main className="workspace-page study-hub"><header className="workspace-header study-hero"><div><p className="eyebrow">Study</p><h1>What do you want to remember today?</h1><p>Choose a folder, a deck, and a study mode. Everything else stays out of the way.</p></div></header><StudyLauncher decks={decks} folders={folders} subjects={subjects}/></main>; }
