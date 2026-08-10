import DeckLibrary from "@/components/DeckLibrary";
import MascotCoach from "@/components/MascotCoach";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser();
  const [decks, folders] = await Promise.all([getDecks(user.id), getDeckFolders(user.id)]);
  return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Library</p><h1>Your decks</h1><p>Keep related decks together and find what you need quickly.</p></div><MascotCoach compact messages={["Folders make big subjects feel smaller.", "Keep one folder per class or topic."]} /></header><DeckLibrary decks={decks} folders={folders} /></main>;
}
