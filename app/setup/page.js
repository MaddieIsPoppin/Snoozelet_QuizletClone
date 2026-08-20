import BrandMark from "@/components/BrandMark";
import { recoverLoginAction } from "@/app/actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function SetupPage() {
  return (
    <main className="page narrow">
      <section className="auth-panel">
        <BrandMark />
        <p className="eyebrow">Deployment setup</p>
        <h1>Local storage is ready</h1>
        <p>Snoozelet now uses only the database stored on this laptop. Cloud credentials are ignored and cannot replace your local study history.</p>
        <form action={recoverLoginAction}>
          <button className="button primary" type="submit">
            Clear session and go to login
          </button>
        </form>
      </section>
    </main>
  );
}
