"use client";

import Link from "next/link";

export default function Navbar() {
  function toggleTheme() {
    const isLight = document.documentElement.classList.toggle("theme-light");
    // Persistence via cookie — the session rules forbid localStorage.
    document.cookie = `ztheme=${isLight ? "light" : "dark"}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between px-5">
        <Link href="/" className="select-none text-lg font-bold tracking-tight">
          <span className="text-accent">zomato</span>
          <span className="text-muted">lite</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
            className="rounded-full border border-border p-2 text-muted transition-colors hover:border-foreground hover:text-foreground"
          >
            {/* half-filled circle: day on one side, night on the other */}
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
            </svg>
          </button>
          <span className="rounded-full bg-accent/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-accent">
            BETA
          </span>
        </div>
      </div>
    </header>
  );
}
