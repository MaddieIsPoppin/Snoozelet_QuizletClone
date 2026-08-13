import DeckLibrary from "@/components/DeckLibrary";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser();
  const [decks, folders, subjects] = await Promise.all([getDecks(user.id), getDeckFolders(user.id), getSubjects(user.id)]);
  return <main className="workspace-page library-page"><header className="workspace-header library-hero"><div><p className="eyebrow">Modules</p><h1>My Modules</h1><p>Create your course structure, then drag each deck into the right Study Unit.</p></div></header><DeckLibrary decks={decks} folders={folders} subjects={subjects} /></main>;
}
