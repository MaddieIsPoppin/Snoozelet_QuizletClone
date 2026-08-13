import DeckLibrary from "@/components/DeckLibrary";
import MascotCoach from "@/components/MascotCoach";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser();
  const [decks, folders, subjects] = await Promise.all([getDecks(user.id), getDeckFolders(user.id), getSubjects(user.id)]);
  return <main className="workspace-page library-page"><header className="workspace-header library-hero"><div><p className="eyebrow">Modules</p><h1>My Modules</h1><p>Open a Module, choose a Study Unit, then study its decks.</p></div><MascotCoach messages={subjects.length ? ["Choose a Module and I’ll help you find the next Study Unit.", "Keep every deck connected to the course it belongs to."] : ["Start by adding the Module you’re studying."]} /></header><DeckLibrary decks={decks} folders={folders} subjects={subjects} /></main>;
}
