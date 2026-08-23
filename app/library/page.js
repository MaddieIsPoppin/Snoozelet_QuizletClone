import DeckLibrary from "@/components/DeckLibrary";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser();
  const [decks, folders, subjects] = await Promise.all([getDecks(user.id), getDeckFolders(user.id), getSubjects(user.id)]);
  return <main className="workspace-page library-page"><header className="workspace-header compact-header"><div><p className="eyebrow">Library</p><h1>Your learning library</h1><p>Browse and manage Modules, Study Units, and Decks.</p></div></header><DeckLibrary decks={decks} folders={folders} subjects={subjects} /></main>;
}
