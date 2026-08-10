import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDeck, getStudySnapshot } from "@/lib/db";

export async function loadStudyRoute(params) {
  const user = await requireUser();
  const { deckId } = await params;
  const [deck, cards] = await Promise.all([
    getDeck(deckId, user.id),
    getStudySnapshot(deckId, user.id),
  ]);

  if (!deck) notFound();
  return { cards, deck };
}
