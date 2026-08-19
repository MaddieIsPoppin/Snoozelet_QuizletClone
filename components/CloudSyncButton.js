"use client";

import { useEffect, useState } from "react";

export default function CloudSyncButton() {
  const [local, setLocal] = useState(false);
  const [state, setState] = useState("idle");
  useEffect(() => { fetch("/api/health", { cache: "no-store" }).then((response) => response.json()).then((data) => setLocal(data.databaseMode === "local")).catch(() => {}); }, []);
  if (!local) return null;
  async function sync() {
    if (!window.confirm("Replace your phone/cloud copy with the current data from this laptop?")) return;
    setState("syncing");
    try {
      const response = await fetch("/api/sync/cloud", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sync failed.");
      setState("done");
      window.alert(`Synced ${data.decks} decks and ${data.cards} cards to your phone.${data.phoneReviewsMerged ? ` Merged ${data.phoneReviewsMerged} phone reviews first.` : ""}`);
    } catch (error) {
      setState("error");
      window.alert(error instanceof Error ? error.message : "Sync failed.");
    }
  }
  return <button className="button cloud-sync-button" type="button" onClick={sync} disabled={state === "syncing"}>{state === "syncing" ? "Syncing…" : state === "done" ? "Synced ✓" : state === "error" ? "Retry sync" : "Sync to phone"}</button>;
}
