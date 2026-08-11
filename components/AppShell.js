"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SnoozeMascot from "@/components/SnoozeMascot";
import ComfortSettings from "@/components/ComfortSettings";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const navigation = [
  { href: "/", label: "Dashboard", icon: "⌂", exact: true },
  { href: "/library", label: "My decks", icon: "▤" },
  { href: "/study", label: "Study", icon: "◫" },
  { href: "/games", label: "Games", icon: "✦" },
  { href: "/progress", label: "Progress", icon: "↗" },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const authPage = ["/login", "/signup", "/setup"].some((path) => pathname.startsWith(path));
  if (authPage) return children;

  const active = (item) => {
    if (item.exact) return pathname === item.href;
    if (item.href === "/library" && pathname.startsWith("/decks")) return true;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="snooze-app shell-v3">
      <ServiceWorkerRegistration />
      <div className="night-sky" aria-hidden="true" />
      <aside className="snooze-sidebar">
        <Link href="/" className="sidebar-brand"><span className="sidebar-brand-icon">☾</span><div><strong>Snoozelet</strong><span>Study companion</span></div></Link>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => <Link href={item.href} className={active(item) ? "nav-item active" : "nav-item"} key={item.href}><span className="nav-symbol">{item.icon}</span>{item.label}</Link>)}
        </nav>
        <Link href="/decks/new" className="sidebar-new-deck"><span>＋</span>Create deck</Link>
        <div className="sidebar-comfort"><ComfortSettings placement="sidebar" /></div>
        <div className="sidebar-spacer" />
        <Link className="sidebar-companion" href="/study">
          <SnoozeMascot variant="coach" mood="happy" />
          <span><strong>Snoo is ready</strong><small>Let&apos;s study together</small></span>
        </Link>
      </aside>
      <div className="snooze-main">
        <header className="snooze-topbar"><Link href="/" className="mobile-brand"><span>☾</span><strong>Snoozelet</strong></Link><div className="topbar-actions"><ComfortSettings /><Link href="/decks/new" className="topbar-new-deck">＋ New deck</Link></div></header>
        <div className="snooze-content">{children}</div>
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          {navigation.slice(0, 4).map((item) => <Link href={item.href} className={active(item) ? "active" : ""} key={item.href}><span>{item.icon}</span>{item.label === "My decks" ? "Decks" : item.label}</Link>)}
        </nav>
      </div>
    </div>
  );
}
