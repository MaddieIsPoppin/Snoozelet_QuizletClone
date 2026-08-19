import NotesWorkspace from "@/components/NotesWorkspace";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getNotes, getSubjects } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function NotesPage() {
  const user = await requireUser();
  const [notes, subjects, folders, decks] = await Promise.all([getNotes(user.id), getSubjects(user.id), getDeckFolders(user.id), getDecks(user.id)]);
  return <main className="workspace-page notes-page"><header className="workspace-header feature-header"><div><p className="eyebrow">Notes</p><h1>Your long-form study notebook</h1><p>Find explanations and lecture notes without digging through individual decks.</p></div><div className="feature-monogram" aria-hidden="true">N</div></header><NotesWorkspace notes={notes} subjects={subjects} folders={folders} decks={decks} /></main>;
}
