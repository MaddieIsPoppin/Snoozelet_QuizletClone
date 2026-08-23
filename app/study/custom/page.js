import Link from "next/link";
import StudyLauncher from "@/components/StudyLauncher";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getSubjects } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function CustomStudyPage() { const user = await requireUser(); const [decks, folders, subjects] = await Promise.all([getDecks(user.id), getDeckFolders(user.id), getSubjects(user.id)]); return <main className="workspace-page study-hub"><Link className="back-link" href="/study">← Study dashboard</Link><header className="workspace-header compact-header"><div><p className="eyebrow">Custom session</p><h1>Build a custom session</h1><p>Choose exactly what and how you want to study.</p></div></header><StudyLauncher decks={decks} folders={folders} subjects={subjects}/></main>; }
