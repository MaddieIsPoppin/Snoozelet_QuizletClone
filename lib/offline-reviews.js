const DATABASE = "snoozelet-offline";
const VERSION = 1;
const STORE = "review-queue";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("Offline storage is unavailable"));
    const request = window.indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "attemptId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runStore(mode, operation) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  }));
}

function announceQueueChange(count) {
  window.dispatchEvent(new CustomEvent("snoozelet:offline-queue", { detail: { count } }));
}

export async function queuedReviewCount() {
  return Number(await runStore("readonly", (store) => store.count()));
}

export async function queueReview(payload) {
  await runStore("readwrite", (store) => store.put({ ...payload, queuedAt: Date.now() }));
  announceQueueChange(await queuedReviewCount());
}

export async function flushReviewQueue() {
  if (!navigator.onLine) return { synced: 0, remaining: await queuedReviewCount() };
  const items = await runStore("readonly", (store) => store.getAll());
  let synced = 0;
  for (const item of items.sort((a, b) => a.queuedAt - b.queuedAt)) {
    const { queuedAt: _queuedAt, ...payload } = item;
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.status === 401) break;
    if (!response.ok) {
      if (response.status >= 500) break;
      await runStore("readwrite", (store) => store.delete(item.attemptId));
      continue;
    }
    await runStore("readwrite", (store) => store.delete(item.attemptId));
    synced += 1;
  }
  const remaining = await queuedReviewCount();
  announceQueueChange(remaining);
  return { synced, remaining };
}
