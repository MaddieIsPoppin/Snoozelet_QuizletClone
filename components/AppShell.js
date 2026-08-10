"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell({ children }) {
  const pathname = usePathname();

  function isActive(path) {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  }

  return (
    <div className="snooze-app">

      {/* Night sky background */}
      <div className="night-sky" aria-hidden="true">
        <span className="sky-star s1">✦</span>
        <span className="sky-star s2">·</span>
        <span className="sky-star s3">✧</span>
        <span className="sky-star s4">✦</span>
        <span className="sky-star s5">·</span>
        <span className="sky-star s6">✦</span>
        <span className="sky-star s7">✧</span>
      </div>

      {/* Sidebar */}
      <aside className="snooze-sidebar">

        <Link href="/" className="sidebar-brand">
          <div className="sidebar-brand-icon">
            ☾
          </div>

          <div>
            <strong>Snoozelet</strong>
            <span>Night Study</span>
          </div>
        </Link>

        <nav className="main-nav">

          <Link
            href="/"
            className={
              isActive("/")
                ? "nav-item active"
                : "nav-item"
            }
          >
            <span className="nav-symbol">⌂</span>
            Home
          </Link>

          <Link href="/#decks" className="nav-item">
            <span className="nav-symbol">▰</span>
            My decks
          </Link>

          <Link href="/#study" className="nav-item">
            <span className="nav-symbol">◫</span>
            Study
          </Link>

          <Link href="/#games" className="nav-item">
            <span className="nav-symbol">✦</span>
            Games
          </Link>

          <Link href="/#progress" className="nav-item">
            <span className="nav-symbol">↗</span>
            Progress
          </Link>

        </nav>

        <div className="sidebar-divider" />

        <Link
          href="/decks/new"
          className="sidebar-new-deck"
        >
          <span>＋</span>
          Create deck
        </Link>

        <div className="sidebar-spacer" />

        <div className="sidebar-night-message">
          <span className="sidebar-night-icon">☾</span>

          <div>
            <strong>Night Study</strong>
            <span>Study at your own pace.</span>
          </div>

          <span className="sidebar-night-star">✦</span>
        </div>

      </aside>

      {/* Main application */}
      <div className="snooze-main">

        {/* Only visible on mobile */}
        <header className="snooze-topbar">

          <Link href="/" className="mobile-brand">
            <span className="mobile-brand-icon">☾</span>
            <strong>Snoozelet</strong>
          </Link>

          <div className="topbar-spacer" />

          <Link
            href="/decks/new"
            className="topbar-new-deck"
          >
            ＋ New deck
          </Link>

        </header>

        <main className="snooze-content">
          {children}
        </main>

        <nav className="mobile-bottom-nav">

          <Link href="/">
            <span>⌂</span>
            Home
          </Link>

          <Link href="/#decks">
            <span>▰</span>
            Decks
          </Link>

          <Link href="/#study">
            <span>◫</span>
            Study
          </Link>

          <Link href="/#games">
            <span>✦</span>
            Games
          </Link>

        </nav>

      </div>

    </div>
  );
}