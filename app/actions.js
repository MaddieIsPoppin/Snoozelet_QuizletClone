"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addCards,
  assignDeckFolder,
  createDeckFolder,
  createDeckWithCards,
  deleteCard,
  deleteDeck,
  deleteDeckFolder,
  updateCard,
  updateDeck,
  createLearningGoal,
  deleteLearningGoal,
  createSubject,
  assignFolderSubject,
  createResourceLink,
  deleteResourceLink,
  updateResourceLink,
} from "@/lib/db";
import { clearSession, createSession, createUser, requireUser, verifyUser } from "@/lib/auth";
import { parseCards } from "@/lib/import";

function cardImageFromForm(formData) {
  if (String(formData.get("imageUploadPending") || "") === "1") {
    throw new Error("Wait for the image upload to finish before saving");
  }

  return {
    imageUrl: String(formData.get("imageUrl") || ""),
    imagePublicId: String(formData.get("imagePublicId") || ""),
    imageAlt: String(formData.get("imageAlt") || ""),
  };
}

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

export async function recoverLoginAction() {
  await clearSession();
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
  const deckId = await createDeckWithCards({ title, description, cards, folderId: formData.get("folderId"), userId: user.id });

  revalidatePath("/");
  redirect(`/decks/${deckId}`);
}

export async function addCardAction(formData) {
  const user = await requireUser();
  const deckId = String(formData.get("deckId"));
  const term = String(formData.get("term") || "").trim();
  const definition = String(formData.get("definition") || "").trim();

  const hint = String(formData.get("hint") || "").trim();
  await addCards(deckId, [{ term, definition, hint, ...cardImageFromForm(formData) }], user.id);
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
  const hint = String(formData.get("hint") || "").trim();

  await updateCard({
    cardId,
    deckId,
    term,
    definition,
    hint,
    ...cardImageFromForm(formData),
    userId: user.id,
  });
  revalidatePath(`/decks/${deckId}`);
}

export async function updateDeckAction(formData) {
  const user = await requireUser();
  const deckId = String(formData.get("deckId"));
  await updateDeck({
    deckId,
    title: formData.get("title"),
    description: formData.get("description"),
    userId: user.id,
  });
  revalidatePath(`/decks/${deckId}`);
  revalidatePath("/library");
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

export async function createDeckFolderAction(formData) {
  const user = await requireUser();
  await createDeckFolder({ name: formData.get("name"), subjectId: formData.get("subjectId"), userId: user.id });
  revalidatePath("/library");
  if (formData.get("subjectId")) revalidatePath(`/subjects/${formData.get("subjectId")}`);
}

export async function createStudyUnitAction(_previousState, formData) {
  try {
    const user = await requireUser();
    const subjectId = formData.get("subjectId");
    await createDeckFolder({ name: formData.get("name"), subjectId, userId: user.id });
    revalidatePath("/library");
    revalidatePath(`/subjects/${subjectId}`);
    return { ok: true, error: "" };
  } catch (error) {
    const message = String(error?.message || "");
    const duplicate = message.toLowerCase().includes("already exists") || message.toLowerCase().includes("unique");
    return { ok: false, error: duplicate ? message : "Snoozelet could not add that Study Unit. Please try again." };
  }
}

export async function createSubjectAction(formData) {
  const user = await requireUser();
  await createSubject({ name: formData.get("name"), description: formData.get("description"), userId: user.id });
  revalidatePath("/library");
}

export async function assignFolderSubjectAction(formData) {
  const user = await requireUser();
  await assignFolderSubject({ folderId: formData.get("folderId"), subjectId: formData.get("subjectId"), userId: user.id });
  revalidatePath("/library");
  revalidatePath(`/subjects/${formData.get("subjectId")}`);
}

export async function createResourceLinkAction(formData) {
  const user = await requireUser();
  await createResourceLink({ userId: user.id, subjectId: formData.get("subjectId"), folderId: formData.get("folderId"), title: formData.get("title"), url: formData.get("url"), type: formData.get("type"), description: formData.get("description") });
  if (formData.get("folderId")) revalidatePath(`/study-units/${formData.get("folderId")}`);
  if (formData.get("subjectId")) revalidatePath(`/subjects/${formData.get("subjectId")}`);
}

export async function deleteResourceLinkAction(formData) {
  const user = await requireUser();
  await deleteResourceLink({ resourceId: formData.get("resourceId"), userId: user.id });
  revalidatePath("/library");
  if (formData.get("folderId")) revalidatePath(`/study-units/${formData.get("folderId")}`);
  if (formData.get("subjectId")) revalidatePath(`/subjects/${formData.get("subjectId")}`);
}

export async function updateResourceLinkAction(formData) {
  const user = await requireUser();
  await updateResourceLink({ resourceId: formData.get("resourceId"), userId: user.id, title: formData.get("title"), url: formData.get("url"), type: formData.get("type"), description: formData.get("description") });
  if (formData.get("folderId")) revalidatePath(`/study-units/${formData.get("folderId")}`);
  if (formData.get("subjectId")) revalidatePath(`/subjects/${formData.get("subjectId")}`);
}

export async function assignDeckFolderAction(formData) {
  const user = await requireUser();
  await assignDeckFolder({
    deckId: formData.get("deckId"),
    folderId: formData.get("folderId"),
    userId: user.id,
  });
  revalidatePath("/library");
}

export async function deleteDeckFolderAction(formData) {
  const user = await requireUser();
  await deleteDeckFolder({ folderId: formData.get("folderId"), userId: user.id });
  revalidatePath("/library");
  if (formData.get("subjectId")) revalidatePath(`/subjects/${formData.get("subjectId")}`);
}

export async function createLearningGoalAction(formData) {
  const user = await requireUser();
  await createLearningGoal({ userId: user.id, deckId: formData.get("deckId"), title: formData.get("title"), examDate: formData.get("examDate"), dailyMinutes: formData.get("dailyMinutes") });
  revalidatePath("/"); revalidatePath("/goals");
}

export async function deleteLearningGoalAction(formData) {
  const user = await requireUser();
  await deleteLearningGoal({ userId: user.id, goalId: formData.get("goalId") });
  revalidatePath("/"); revalidatePath("/goals");
}
