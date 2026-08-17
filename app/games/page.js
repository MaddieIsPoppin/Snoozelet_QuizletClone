import GameLauncher from "@/components/GameLauncher";
import { requireUser } from "@/lib/auth";
import { getDecks } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function TrainingPage(){const user=await requireUser();const decks=await getDecks(user.id);return <main className="workspace-page"><header className="workspace-header"><div><p className="eyebrow">Training</p><h1>Recognition and speed drills</h1><p>Short exercises for terminology recognition and recall speed. Your study material remains the focus.</p></div></header><GameLauncher decks={decks}/></main>}
