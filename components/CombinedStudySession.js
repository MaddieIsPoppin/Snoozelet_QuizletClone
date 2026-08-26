"use client";
import Link from "next/link";
import { useState } from "react";
import StudySession from "@/components/StudySession";
import MatchGame from "@/components/MatchGame";
import BlastGame from "@/components/BlastGame";

const modes=[
  ["multiple-choice","Multiple Choice","Choose from related answers."],
  ["flashcards","Flashcards","Flip cards and rate your recall."],
  ["typed","Typed","Type the important concepts in your own words."],
  ["games","Games","Choose Match or Blast."],
];

export default function CombinedStudySession({deck,cards,initialMode=""}){
 const[mode,setMode]=useState(initialMode);const[game,setGame]=useState("");
 if(!mode)return <section className="combined-mode-picker"><p className="eyebrow">Combined session</p><h1>{deck.title}</h1><p>{deck.sourceDecks.length} Decks · {cards.length} unique cards</p><div className="combined-source-list">{deck.sourceDecks.map(item=><span key={item.id}>{item.title}</span>)}</div><h2>Choose one study mode</h2><div className="four-mode-grid">{modes.map(([id,label,note])=><button type="button" onClick={()=>setMode(id)} key={id}><strong>{label}</strong><small>{note}</small></button>)}</div><Link className="button" href="/library">Back to Library</Link></section>;
 if(mode==="games"&&!game)return <section className="combined-mode-picker"><p className="eyebrow">Games</p><h1>Choose a game</h1><div className="four-mode-grid game-grid"><button type="button" onClick={()=>setGame("match")}><strong>Match</strong><small>Pair terms with definitions.</small></button><button type="button" onClick={()=>setGame("blast")}><strong>Blast</strong><small>Answer rapidly with immediate feedback.</small></button></div><button className="button" type="button" onClick={()=>setMode("")}>Change study mode</button></section>;
 return <><div className="combined-session-banner"><Link href="/library">← Library</Link><span><strong>{deck.title}</strong> · {cards.length} cards from {deck.sourceDecks.length} Decks</span><button type="button" onClick={()=>{setMode("");setGame("");}}>Change mode</button></div>{mode==="games"&&game==="match"?<MatchGame deck={deck} cards={cards}/>:mode==="games"&&game==="blast"?<BlastGame deck={deck} cards={cards}/>:<StudySession deck={deck} cards={cards} mode={mode==="multiple-choice"?"multiple":mode}/>}</>;
}
