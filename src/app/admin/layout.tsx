"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
];

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
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="card-surface px-8 py-6 text-sm text-slate-600">
          Vérification de l&apos;accès administrateur...
        </div>
      </div>
    );
  }

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <header className="lg:hidden sticky top-0 z-50 bg-[#000000] text-white shadow-soft-lg border-b border-[#D4AF37]/20">
        <div className="flex items-center justify-between px-4 py-4">
          <div>
            <div className="text-lg font-bold">RentPoint</div>
            <div className="text-[10px] uppercase tracking-widest text-[#F2F2F2]/90 font-bold">
              Admin Panel
            </div>
          </div>

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10"
            aria-label="Ouvrir le menu admin"
          >
            <span className="sr-only">Menu</span>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#D4AF37]/20 px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#D4AF37] text-[#0A0A0C] shadow-soft"
                      : "bg-white/10 text-slate-100"
                  }`}
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={item.icon}
                    />
                  </svg>
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
              className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-white bg-white/10 disabled:opacity-60"
            >
              {loggingOut ? "Déconnexion..." : "Se déconnecter"}
            </button>

            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-2 py-2 text-xs text-slate-300 hover:text-[#F2F2F2] transition-colors font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Voir le site
            </Link>
          </div>
        )}
      </header>

      <aside
        data-reveal="left"
        className="hidden lg:flex lg:flex-col w-72 text-white border-r border-[#D4AF37]/20 fixed top-0 left-0 h-full z-40 shadow-soft-lg"
        style={{
          background: "linear-gradient(180deg, #0A0A0C 0%, #0A0A0C 100%)",
        }}
      >
        <div className="p-7 border-b border-[#D4AF37]/20">
          <div className="text-2xl font-bold">RentPoint</div>
          <div className="mt-2 text-xs uppercase tracking-widest text-[#F2F2F2]/90 font-bold">
            Admin Panel
          </div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-semibold transition-all duration-250 ${
                  isActive
                    ? "bg-[#D4AF37] text-[#0A0A0C] shadow-soft"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.icon}
                  />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#D4AF37]/20 space-y-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full rounded-2xl px-5 py-4 text-left text-sm font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors disabled:opacity-60"
          >
            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-slate-300 hover:text-[#F2F2F2] transition-colors font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voir le site
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-h-screen p-4 sm:p-6 lg:p-8 lg:ml-72 w-full overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
