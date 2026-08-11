"use client";

import { useEffect, useState } from "react";
import { flushReviewQueue, queuedReviewCount } from "@/lib/offline-reviews";

export default function PwaControls() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);
  const [installed, setInstalled] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    setInstalled(Boolean(standalone));
    setOnline(navigator.onLine);
    queuedReviewCount().then(setQueued).catch(() => {});

    const captureInstall = (event) => { event.preventDefault(); setInstallPrompt(event); };
    const updateQueue = (event) => setQueued(Number(event.detail?.count || 0));
    const goOffline = () => setOnline(false);
    const goOnline = async () => {
      setOnline(true);
      setSyncing(true);
      try { const result = await flushReviewQueue(); setQueued(result.remaining); }
      catch { /* The next online event or manual retry will continue the queue. */ }
      finally { setSyncing(false); }
    };
    window.addEventListener("beforeinstallprompt", captureInstall);
    window.addEventListener("appinstalled", () => { setInstalled(true); setInstallPrompt(null); });
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    window.addEventListener("snoozelet:offline-queue", updateQueue);
    if (navigator.onLine) goOnline();
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstall);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("snoozelet:offline-queue", updateQueue);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  async function retrySync() {
    setSyncing(true);
    try { const result = await flushReviewQueue(); setQueued(result.remaining); }
    finally { setSyncing(false); }
  }

  if (installed && online && queued === 0) return null;
  return (
    <div className={`pwa-controls${online ? "" : " offline"}`} role="status">
      {!installed && installPrompt ? <button type="button" onClick={install}>Install app</button> : null}
      {!online ? <span>Offline · answers stay on this device</span> : null}
      {queued > 0 ? <button type="button" onClick={retrySync} disabled={!online || syncing}>{syncing ? "Syncing…" : `${queued} ${queued === 1 ? "answer" : "answers"} to sync`}</button> : null}
    </div>
  );
}
