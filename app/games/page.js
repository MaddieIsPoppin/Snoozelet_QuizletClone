import MascotCoach from "@/components/MascotCoach";
import GameLauncher from "@/components/GameLauncher";
import StudyPet from "@/components/StudyPet";
import { requireUser } from "@/lib/auth";
import { getDecks, getUserProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const user = await requireUser();
  const [decks, progress] = await Promise.all([getDecks(user.id), getUserProgress(user.id)]);
  return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Games arcade</p><h1>Choose a game to play</h1><p>Every answer still counts as real study progress.</p></div><MascotCoach compact messages={["Your reviews help me grow!", "Games are practice too—try to beat your last round."]} /></header><StudyPet totalXp={progress.totalXp} /><GameLauncher decks={decks} /></main>;
}
