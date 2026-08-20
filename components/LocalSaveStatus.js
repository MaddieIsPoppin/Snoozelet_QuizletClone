"use client";
import { useEffect, useState } from "react";

export default function LocalSaveStatus() {
  const [state, setState] = useState("checking");
  useEffect(() => { fetch("/api/health", { cache: "no-store" }).then((response) => response.json()).then((data) => setState(data.ok && data.databaseMode === "local" ? "ready" : "error")).catch(() => setState("error")); }, []);
  return <span className={`local-save-status ${state}`} title={state === "ready" ? "All study data is stored in data/study.sqlite on this laptop." : "Snoozelet could not confirm the local database."}><i aria-hidden="true"/>{state === "ready" ? "Saved locally" : state === "error" ? "Database check" : "Checking storage"}</span>;
}
