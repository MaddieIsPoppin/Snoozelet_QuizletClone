import StudyDashboard from "@/components/StudyDashboard";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getDecks, getRecentReviews, getSubjects } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function StudyPage() { const user=await requireUser(); const [decks,folders,subjects,reviews]=await Promise.all([getDecks(user.id),getDeckFolders(user.id),getSubjects(user.id),getRecentReviews(user.id,100)]); return <main className="workspace-page study-hub"><header className="workspace-header compact-header"><div><p className="eyebrow">Study</p><h1>Ready to study?</h1><p>Continue where you left off, review cards that are due, or choose a Module.</p></div></header><StudyDashboard decks={decks} folders={folders} subjects={subjects} reviews={reviews}/></main>; }
