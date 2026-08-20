export default function manifest() {
  return {
    id: "/",
    name: "Snoozelet Active Recall Workstation",
    short_name: "Snoozelet",
    description: "A focused local study workspace for flashcards, recall, and revision.",
    start_url: "/?source=android-pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#07142d",
    theme_color: "#09122b",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/snoozelet-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/snoozelet-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/snoozelet-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/snoozelet-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
