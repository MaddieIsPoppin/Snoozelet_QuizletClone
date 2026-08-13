import Link from "next/link";
import { createDeckAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import TextField from "@/components/TextField";
import BrandMark from "@/components/BrandMark";
import CardCreationGuide from "@/components/CardCreationGuide";
import { getDeckFolders } from "@/lib/db";

export default async function NewDeckPage() {
  const user = await requireUser();
  const folders = await getDeckFolders(user.id);

  return (
    <main className="page narrow">
      <header className="topbar">
        <Link className="brand" href="/">
          <BrandMark />
          <span>Snoozelet</span>
        </Link>
      </header>

      <section className="mobile-review-only">
        <span>☾</span>
        <p className="eyebrow">Snoozelet on the go</p>
        <h1>Create decks on Windows</h1>
        <p>The mobile app is streamlined for reviewing and games. Use the Windows app when you want to create or import study content.</p>
        <Link className="button primary" href="/study">Start reviewing</Link>
      </section>

      <section className="editor-panel desktop-authoring-only">
        <p className="eyebrow">New deck</p>
        <h1>Create a study set</h1>
        <form action={createDeckAction} className="form-stack">
          <label>
            Deck title
            <input name="title" placeholder="Spanish travel phrases" required />
          </label>
          <label>
            Description
            <input name="description" placeholder="Optional context" />
          </label>
          <label>Study unit<select name="folderId" defaultValue=""><option value="">Organize later</option>{folders.map((folder) => <option value={folder.id} key={folder.id}>{folder.subject_name ? `${folder.subject_name} · ` : ""}{folder.name}</option>)}</select></label>
          <label>
            Add cards now
            <TextField
              textarea
              name="cards"
              rows="10"
              placeholder={'hola,hello\nla estacion,the station\ncomida - food'}
            />
          </label>
          <label>
            Or upload CSV
            <input accept=".csv,text/csv" name="csvFile" type="file" />
          </label>
          <p className="helper">
            Paste CSV, tab-separated text, or one term-definition pair per line.
          </p>
          <CardCreationGuide />
          <div className="row-actions">
            <button className="button primary" type="submit">
              Create deck
            </button>
            <Link className="button" href="/">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
