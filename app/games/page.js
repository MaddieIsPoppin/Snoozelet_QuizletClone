import MascotCoach from "@/components/MascotCoach";
import GameLauncher from "@/components/GameLauncher";
import { requireUser } from "@/lib/auth";
import { getDecks } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const user = await requireUser();
  const decks = await getDecks(user.id);
  return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Games arcade</p><h1>Choose a game to play</h1><p>First pick the experience you want, then select its deck.</p></div><MascotCoach compact messages={["Match is a simple place to start.", "Games are practice too—try to beat your last round."]} /></header><GameLauncher decks={decks} /></main>;
}
