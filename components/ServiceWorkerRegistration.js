"use client";
import { useEffect } from "react";
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then((registration) => registration.update()).catch(() => {});
      return;
    }
    navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister()))).catch(() => {});
    if ("caches" in window) caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("snoozelet-")).map((key) => caches.delete(key)))).catch(() => {});
  }, []);
  return null;
}
