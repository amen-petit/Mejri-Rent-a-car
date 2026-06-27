"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND_SHORT } from "@/lib/constants";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/admin/voitures",
    label: "Véhicules",
    icon: "M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zM13 16h2l3-5V9h-4a1 1 0 00-1 1v6z",
  },
  {
    href: "/admin/reservations",
    label: "Réservations",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    href: "/admin/disponibilite",
    label: "Disponibilité",
    icon: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2",
  },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(pathname !== "/admin/login");
  const [isAuthed, setIsAuthed] = useState(pathname === "/admin/login");

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    if (pathname === "/admin/login") {
      setCheckingAuth(false);
      setIsAuthed(true);
      return;
    }

    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session", {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as {
          authenticated?: boolean;
        };

        if (cancelled) return;

        if (!data.authenticated) {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
          setIsAuthed(false);
        } else {
          setIsAuthed(true);
        }
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-paper">{children}</div>;
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="card-surface px-8 py-6 text-sm text-stone">
          Vérification de l&apos;accès administrateur...
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return null;
  }

  const Brand = (
    <div className="flex items-baseline gap-2.5">
      <span className="font-display text-xl font-medium text-paper">
        {BRAND_SHORT}
      </span>
      <span className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-paper/45">
        Admin
      </span>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      {/* Mobile header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ink text-paper lg:hidden">
        <div className="flex items-center justify-between px-5 py-4">
          {Brand}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-white/15"
            aria-label="Ouvrir le menu admin"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="space-y-1 border-t border-white/10 px-4 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? "bg-paper text-ink" : "text-paper/60 hover:bg-white/5 hover:text-paper"
                  }`}
                >
                  <NavIcon d={item.icon} />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={async () => {
                setMenuOpen(false);
                await handleLogout();
              }}
              disabled={loggingOut}
              className="mt-2 w-full rounded-[var(--radius-sm)] border border-white/15 px-4 py-3 text-left text-sm font-medium text-paper disabled:opacity-60"
            >
              {loggingOut ? "Déconnexion..." : "Se déconnecter"}
            </button>
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-2 py-2 text-xs text-paper/50 transition-colors hover:text-paper"
            >
              ← Voir le site
            </Link>
          </div>
        )}
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-72 flex-col border-r border-white/10 bg-ink text-paper lg:flex">
        <div className="border-b border-white/10 p-7">{Brand}</div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-[var(--radius)] px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "bg-paper text-ink"
                    : "text-paper/55 hover:bg-white/5 hover:text-paper"
                }`}
              >
                <NavIcon d={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full rounded-[var(--radius)] border border-white/15 px-4 py-3 text-left text-sm font-medium text-paper transition-colors hover:bg-white/5 disabled:opacity-60"
          >
            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-1 text-xs text-paper/50 transition-colors hover:text-paper"
          >
            ← Voir le site
          </Link>
        </div>
      </aside>

      <div className="w-full flex-1 overflow-x-hidden p-5 sm:p-6 lg:ml-72 lg:p-10">
        {children}
      </div>
    </div>
  );
}
