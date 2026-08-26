import { redirect } from "next/navigation";
export default async function FocusRedirect({params}){const{deckId}=await params;redirect(`/decks/${deckId}/typed`);}
