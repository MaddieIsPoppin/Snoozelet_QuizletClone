import DeckLibrary from "@/components/DeckLibrary";
import MascotCoach from "@/components/MascotCoach";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser();
  const [decks, folders, subjects] = await Promise.all([getDecks(user.id), getDeckFolders(user.id), getSubjects(user.id)]);
  return <main className="workspace-page library-page"><header className="workspace-header library-hero"><div><p className="eyebrow">Your study library</p><h1>Everything you&apos;re learning</h1><p>Organize subjects, jump back in, and watch your knowledge grow.</p></div><MascotCoach messages={["Pick one deck and give it ten focused minutes.", "Study units make big subjects feel smaller."]} /></header><DeckLibrary decks={decks} folders={folders} subjects={subjects} /></main>;
}
