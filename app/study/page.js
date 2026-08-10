import MascotCoach from "@/components/MascotCoach";
import StudyLauncher from "@/components/StudyLauncher";
import { requireUser } from "@/lib/auth";
import { getDecks } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  const user = await requireUser();
  const decks = await getDecks(user.id);
  return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Study room</p><h1>Start a study session</h1><p>Choose what to study, then choose how you want to practise it.</p></div><MascotCoach compact messages={["Learn mode is the easiest place to begin.", "Typed recall builds stronger memory than rereading."]} /></header><StudyLauncher decks={decks} /></main>;
}
