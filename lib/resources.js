export function detectResourceType(value) {
  try {
    const url = new URL(String(value));
    if (!["http:", "https:"].includes(url.protocol)) return "";
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    if (host === "docs.google.com" && path.startsWith("/document")) return "google_docs";
    if (host === "docs.google.com" && path.startsWith("/presentation")) return "google_slides";
    if (host === "docs.google.com" && path.startsWith("/spreadsheets")) return "google_sheets";
    if (host === "drive.google.com") return "google_drive";
    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "youtube";
    if (host === "notebooklm.google.com") return "notebooklm";
    if (path.endsWith(".pdf")) return "pdf";
    return "website";
  } catch { return ""; }
}
