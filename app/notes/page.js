import ResourceLibrary from "@/components/ResourceLibrary";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getResourceLinks, getSubjects } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function NotesPage() {
  const user = await requireUser();
  const [resources, subjects, folders] = await Promise.all([getResourceLinks(user.id), getSubjects(user.id), getDeckFolders(user.id)]);
  return <main className="workspace-page notes-page"><header className="workspace-header compact-header"><div><p className="eyebrow">Resources</p><h1>Study resources</h1><p>Keep useful documents, videos, and websites beside your Modules.</p></div></header><ResourceLibrary resources={resources} subjects={subjects} folders={folders}/></main>;
}
