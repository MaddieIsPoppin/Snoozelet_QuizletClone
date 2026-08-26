import { redirect } from "next/navigation";
export default async function LearnRedirect({params}){const{deckId}=await params;redirect(`/decks/${deckId}/multiple-choice`);}
