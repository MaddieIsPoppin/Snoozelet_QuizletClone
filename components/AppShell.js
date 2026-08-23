"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ComfortSettings from "@/components/ComfortSettings";
import LocalSaveStatus from "@/components/LocalSaveStatus";
import StaleCacheCleanup from "@/components/StaleCacheCleanup";

const links = [
  ["Study", "/study", "◫"],
  ["Library", "/library", "▤"],
  ["Resources", "/notes", "↗"],
  ["Progress", "/progress", "↗"],
];

function isActive(pathname, href) {
  if (href === "/study") return pathname === "/study" || /^\/decks\/[^/]+\/(learn|flashcards|multiple-choice|typed|recall|test|match|blast)$/.test(pathname);
  return pathname.startsWith(href);
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const authPage = ["/login", "/signup", "/setup"].some((path) => pathname.startsWith(path));
  if (authPage) return children;
  const studying = /^\/decks\/[^/]+\/(learn|flashcards|multiple-choice|typed|recall|test|match|blast)$/.test(pathname);
  return <div className={`workstation-shell${studying ? " active-session" : ""}`}>
    <StaleCacheCleanup />
    <header className="workstation-nav">
      <Link className="workstation-brand" href="/study" aria-label="Snoozelet home"><span className="brand-crescent" aria-hidden="true">◐</span><span><strong>Snoozelet</strong><small>Study companion</small></span></Link>
      <nav className="primary-links" aria-label="Primary navigation">{links.map(([label, href]) => <Link className={isActive(pathname, href) ? "active" : ""} aria-current={isActive(pathname, href) ? "page" : undefined} href={href} key={href}>{label}</Link>)}</nav>
      <div className="nav-actions"><LocalSaveStatus /><Link className="nav-ai-link" href="/ai">AI help</Link><ComfortSettings label="⚙" /><Link className="button primary nav-create" href="/decks/new"><span aria-hidden="true">＋</span> Create</Link></div>
    </header>
    <main className="workstation-main">{children}</main>
    <nav className="workstation-mobile-nav" aria-label="Mobile navigation">{links.map(([label, href, icon]) => <Link className={isActive(pathname, href) ? "active" : ""} aria-current={isActive(pathname, href) ? "page" : undefined} href={href} key={href}><span aria-hidden="true">{icon}</span>{label}</Link>)}</nav>
  </div>;
}
