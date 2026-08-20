"use client";
import { useEffect } from "react";

export default function StaleCacheCleanup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistrations().then((items) => Promise.all(items.map((item) => item.unregister()))).catch(() => {});
    if ("caches" in window) caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("snoozelet-")).map((key) => caches.delete(key)))).catch(() => {});
  }, []);
  return null;
}
