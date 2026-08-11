import MascotCoach from "@/components/MascotCoach";
import GameLauncher from "@/components/GameLauncher";
import StudyPet from "@/components/StudyPet";
import { requireUser } from "@/lib/auth";
import { getDecks, getUserProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const user = await requireUser();
  const [decks, progress] = await Promise.all([getDecks(user.id), getUserProgress(user.id)]);
  return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Observatory arcade</p><h1>Play with what you know</h1><p>Repair constellations and charge the telescope; every answer still improves your real study progress.</p></div><MascotCoach compact messages={["Your reviews make our sky brighter!", "Try to beat your last expedition score."]} /></header><StudyPet totalXp={progress.totalXp} /><GameLauncher decks={decks} /></main>;
}
