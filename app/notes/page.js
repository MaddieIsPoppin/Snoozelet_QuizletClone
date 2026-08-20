import ResourceLibrary from "@/components/ResourceLibrary";
import { requireUser } from "@/lib/auth";
import { getDeckFolders, getResourceLinks, getSubjects } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function NotesPage() {
  const user = await requireUser();
  const [resources, subjects, folders] = await Promise.all([getResourceLinks(user.id), getSubjects(user.id), getDeckFolders(user.id)]);
  return <main className="workspace-page notes-page"><header className="workspace-header feature-header"><div><p className="eyebrow">Notes &amp; resources</p><h1>Every study link in one place</h1><p>Keep Google Docs, NotebookLM notebooks, videos, PDFs, and useful websites organised beside your Modules.</p></div><div className="feature-monogram" aria-hidden="true">R</div></header><ResourceLibrary resources={resources} subjects={subjects} folders={folders}/></main>;
}
