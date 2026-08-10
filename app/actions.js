"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addCards, createDeckWithCards, deleteCard, deleteDeck, updateCard } from "@/lib/db";
import { clearSession, createSession, createUser, requireUser, verifyUser } from "@/lib/auth";
import { parseCards } from "@/lib/import";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_CARDS = 5000;

function assertImportSize(value, label = "Import") {
  if (Buffer.byteLength(value, "utf8") > MAX_IMPORT_BYTES) {
    throw new Error(`${label} must be 2 MB or smaller`);
  }
}

function assertCardCount(cards) {
  if (cards.length > MAX_IMPORT_CARDS) {
    throw new Error(`Imports are limited to ${MAX_IMPORT_CARDS} cards`);
  }
  return cards;
}

async function parseUploadedCards(file) {
  if (!file || file.size === 0) return [];
  if (file.size > MAX_IMPORT_BYTES) throw new Error("CSV file must be 2 MB or smaller");
  return parseCards(await file.text(), "csv");
}

export async function signUpAction(formData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const userId = await createUser({ username, password });

  await createSession(userId);
  revalidatePath("/");
  redirect("/");
}

export async function loginAction(formData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const user = await verifyUser({ username, password });

  if (!user) {
    redirect("/login?error=1");
  }

  await createSession(user.id);
  revalidatePath("/");
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/login");
}

export async function createDeckAction(formData) {
  const user = await requireUser();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title) {
    throw new Error("Deck title is required");
  }

  const pasted = String(formData.get("cards") || "").trim();
  const csvFile = formData.get("csvFile");
  assertImportSize(pasted, "Pasted cards");
  const cards = assertCardCount([
    ...(pasted ? parseCards(pasted) : []),
    ...(await parseUploadedCards(csvFile))
  ]);
  const deckId = await createDeckWithCards({ title, description, cards, userId: user.id });

  revalidatePath("/");
  redirect(`/decks/${deckId}`);
}

export async function addCardAction(formData) {
  const user = await requireUser();
  const deckId = String(formData.get("deckId"));
  const term = String(formData.get("term") || "").trim();
  const definition = String(formData.get("definition") || "").trim();

  await addCards(deckId, [{ term, definition }], user.id);
  revalidatePath(`/decks/${deckId}`);
}

export async function importCardsAction(formData) {
  const user = await requireUser();
  const deckId = String(formData.get("deckId"));
  const raw = String(formData.get("cards") || "");
  const format = String(formData.get("format") || "auto");
  const csvFile = formData.get("csvFile");
  assertImportSize(raw, "Pasted cards");
  const cards = assertCardCount([
    ...parseCards(raw, format),
    ...(await parseUploadedCards(csvFile))
  ]);

  await addCards(deckId, cards, user.id);
  revalidatePath(`/decks/${deckId}`);
}

export async function updateCardAction(formData) {
  const user = await requireUser();
  const deckId = String(formData.get("deckId"));
  const cardId = String(formData.get("cardId"));
  const term = String(formData.get("term") || "").trim();
  const definition = String(formData.get("definition") || "").trim();

  await updateCard({ cardId, deckId, term, definition, userId: user.id });
  revalidatePath(`/decks/${deckId}`);
}

export async function deleteCardAction(formData) {
  const user = await requireUser();
  const deckId = String(formData.get("deckId"));
  const cardId = String(formData.get("cardId"));

  await deleteCard({ cardId, deckId, userId: user.id });
  revalidatePath(`/decks/${deckId}`);
}

export async function deleteDeckAction(formData) {
  const user = await requireUser();
  const deckId = String(formData.get("deckId"));
  await deleteDeck(deckId, user.id);
  revalidatePath("/");
  redirect("/");
}
