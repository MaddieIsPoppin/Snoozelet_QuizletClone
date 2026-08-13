import StudyLauncher from "@/components/StudyLauncher";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function StudyPage() { const user=await requireUser(); const [decks,folders,subjects]=await Promise.all([getDecks(user.id),getDeckFolders(user.id),getSubjects(user.id)]); return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Study room</p><h1>Find what you want to study</h1><p>Follow your course structure from Module to Study Unit to deck.</p></div></header><StudyLauncher decks={decks} folders={folders} subjects={subjects}/></main>; }
