import { redirect } from "next/navigation";
export default async function TestRedirect({params}){const{deckId}=await params;redirect(`/decks/${deckId}/multiple-choice`);}
