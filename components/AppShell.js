"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ComfortSettings from "@/components/ComfortSettings";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PwaControls from "@/components/PwaControls";
import CloudSyncButton from "@/components/CloudSyncButton";

const menus = [
  { label: "Study", href: "/study", items: [["Study workspace","/study"],["Weak cards","/study?scope=weak"],["AI Help","/ai"]] },
  { label: "Library", href: "/library", items: [["Modules and Study Units","/library"],["Create or import","/decks/new"]] },
  { label: "Training", href: "/games", items: [["Recognition training","/games"],["Match","/games?mode=match"],["Speed training","/games?mode=blast"]] },
  { label: "Progress", href: "/progress", items: [["Study statistics","/progress"],["Review history","/progress#history"],["Backup","/progress#backup"]] },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const authPage = ["/login", "/signup", "/setup"].some((path) => pathname.startsWith(path));
  const [open, setOpen] = useState("");
  const navRef = useRef(null);
  useEffect(() => setOpen(""), [pathname]);
  useEffect(() => { const close = (event) => { if (!navRef.current?.contains(event.target)) setOpen(""); }; const escape = (event) => { if (event.key === "Escape") setOpen(""); }; document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape); return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); }; }, []);
  if (authPage) return children;
  const studying = /^\/decks\/[^/]+\/(learn|flashcards|multiple-choice|typed|recall|test)$/.test(pathname);
  return <div className={`workstation-shell${studying ? " active-session" : ""}`}>
    <ServiceWorkerRegistration/><PwaControls/>
    <header className="workstation-nav" ref={navRef}>
      <Link className="workstation-brand" href="/"><strong>Snoozelet</strong><span>Active recall workstation</span></Link>
      <nav aria-label="Primary navigation">{menus.map((menu) => <div className="nav-menu" key={menu.label}><button type="button" className={pathname.startsWith(menu.href) ? "active" : ""} onClick={() => setOpen(open === menu.label ? "" : menu.label)} aria-expanded={open === menu.label}>{menu.label}<span>⌄</span></button>{open === menu.label ? <div className="nav-dropdown">{menu.items.map(([label,href]) => <Link href={href} key={label}>{label}</Link>)}</div> : null}</div>)}</nav>
      <div className="nav-actions"><CloudSyncButton/><ComfortSettings label="Theme & settings"/><Link className="button primary" href="/decks/new">Create / Import</Link></div>
    </header>
    <main className="workstation-main">{children}</main>
    <nav className="workstation-mobile-nav" aria-label="Mobile navigation">{menus.map((menu) => <Link className={pathname.startsWith(menu.href) ? "active" : ""} href={menu.href} key={menu.label}>{menu.label}</Link>)}</nav>
  </div>;
}
