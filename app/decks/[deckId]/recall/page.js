import { redirect } from "next/navigation";
export default async function RecallRedirect({params}){const{deckId}=await params;redirect(`/decks/${deckId}/typed`);}
