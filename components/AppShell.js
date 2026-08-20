"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ComfortSettings from "@/components/ComfortSettings";
import LocalSaveStatus from "@/components/LocalSaveStatus";
import StaleCacheCleanup from "@/components/StaleCacheCleanup";

const menus = [
  { label: "Study", href: "/study", items: [["Choose what to study","/study"],["Continue last deck","/"]] },
  { label: "Library", href: "/library", items: [["Modules and Study Units","/library"],["Create or import","/decks/new"]] },
  { label: "AI Help", href: "/ai", items: [["AI workspace","/ai"],["Use ChatGPT","/ai?provider=chatgpt"],["Use Gemini","/ai?provider=gemini"]] },
  { label: "Resources", href: "/notes", items: [["Note links","/notes"],["Add a link","/notes#add-resource"]] },
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
    <StaleCacheCleanup/>
    <header className="workstation-nav" ref={navRef}>
      <Link className="workstation-brand" href="/study"><span className="brand-crescent" aria-hidden="true">◐</span><span><strong>Snoozelet</strong><small>Open. Study. Remember.</small></span></Link>
      <nav aria-label="Primary navigation">{menus.map((menu) => <div className="nav-menu" key={menu.label}><button type="button" className={pathname.startsWith(menu.href) ? "active" : ""} onClick={() => setOpen(open === menu.label ? "" : menu.label)} aria-expanded={open === menu.label}>{menu.label}<span>⌄</span></button>{open === menu.label ? <div className="nav-dropdown">{menu.items.map(([label,href]) => <Link href={href} key={label}>{label}</Link>)}</div> : null}</div>)}</nav>
      <div className="nav-actions"><LocalSaveStatus/><ComfortSettings label="Theme & settings"/><Link className="button primary" href="/decks/new">Create / Import</Link></div>
    </header>
    <main className="workstation-main">{children}</main>
    <nav className="workstation-mobile-nav" aria-label="Mobile navigation">{menus.map((menu) => <Link className={pathname.startsWith(menu.href) ? "active" : ""} href={menu.href} key={menu.label}>{menu.label}</Link>)}</nav>
  </div>;
}
