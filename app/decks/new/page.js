import Link from "next/link";
import { createDeckAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getDeckFolders } from "@/lib/db";
import PendingForm from "@/components/PendingForm";
import CardCreationGuide from "@/components/CardCreationGuide";

export default async function NewDeckPage({searchParams}) {
  const user=await requireUser();
  const folders=await getDeckFolders(user.id);
  const query=await searchParams;
  const selected=folders.some(f=>String(f.id)===String(query?.studyUnit||""))?String(query.studyUnit):"";
  return <main className="workspace-page create-deck-page">
    <header className="workspace-header create-deck-header"><div><p className="eyebrow">New deck</p><h1>Create it once. Start studying immediately.</h1><p>Name the deck, choose its folder, and optionally paste cards. Snoozelet opens the finished deck when it is safely saved.</p></div><Link className="button" href="/library">Cancel</Link></header>
    <section className="create-deck-workspace"><div className="create-deck-main"><PendingForm action={createDeckAction} submitLabel="Create deck" pendingLabel="Creating and saving…">
      <label>Deck name<input name="title" placeholder="e.g. Transaction Management" autoFocus required/></label>
      <label>Where should it live?<select name="folderId" defaultValue={selected} required={folders.length>0}><option value="">{folders.length?"Choose a folder":"No folders yet — organise later"}</option>{folders.map(folder=><option value={folder.id} key={folder.id}>{folder.subject_name?`${folder.subject_name} / `:""}{folder.name}</option>)}</select></label>
      <label>Description <span className="optional">Optional</span><input name="description" placeholder="What this deck covers"/></label>
      <label>Paste cards <span className="optional">Optional</span><textarea name="cards" rows="12" placeholder={'Question 1\tAnswer 1\nQuestion 2\tAnswer 2'}/></label>
      <label>Or choose a CSV file<input accept=".csv,text/csv" name="csvFile" type="file"/></label>
    </PendingForm></div><aside className="create-deck-aside"><span className="create-step">1</span><h2>Keep it simple</h2><p>You can create an empty deck and add cards on its next screen, or paste a full set now.</p><CardCreationGuide/><div className="save-promise"><strong>Saved locally</strong><span>The deck and every pasted card are written together. You will only leave this page after the save succeeds.</span></div></aside></section>
  </main>;
}
