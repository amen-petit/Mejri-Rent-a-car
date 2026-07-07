"use client";
import Link from "next/link";
import { useState } from "react";
import { BRAND_SHORT, PHONE_DISPLAY, PHONE_TEL } from "@/lib/constants";
import { useI18n } from "@/i18n/client";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SocialLinks from "@/components/SocialLinks";

const NAV_LINKS = [
  { key: "home", href: "/" },
  { key: "vehicles", href: "/voitures" },
  { key: "about", href: "/#about" },
  { key: "contact", href: "/#contact" },
] as const;

function Wordmark() {
  return (
    <Link href="/" className="group flex items-baseline gap-2.5">
      <span className="font-display text-xl font-medium tracking-tight text-ink">
        {BRAND_SHORT}
      </span>
      <span className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-stone sm:inline">
        Rent a Car
      </span>
    </Link>
  );
}

function PhoneLink({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <a
      href={`tel:${PHONE_TEL}`}
      aria-label={`${t.nav.call} ${PHONE_DISPLAY}`}
      className={className}
    >
      <svg
        className="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      <span className="font-medium" dir="ltr">
        {PHONE_DISPLAY}
      </span>
    </a>
  );
}

export default function Navbar() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-mist bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Wordmark />

        {/* Desktop nav */}
        <div className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="relative text-sm text-stone transition-colors duration-200 hover:text-ink after:absolute after:-bottom-1.5 after:start-0 after:h-px after:w-0 after:bg-ink after:transition-[width] after:duration-200 after:ease-out hover:after:w-full"
            >
              {t.nav[link.key]}
            </Link>
          ))}
        </div>

        {/* Desktop right cluster */}
        <div className="hidden items-center gap-3 md:flex">
          <PhoneLink className="hidden items-center gap-2 text-sm text-stone transition-colors duration-200 hover:text-ink lg:inline-flex" />
          <div className="hidden items-center gap-1 text-stone lg:flex">
            <SocialLinks
              className="p-1.5 transition-colors duration-200 hover:text-ink"
              iconSize={17}
            />
          </div>
          <LanguageSwitcher />
          <Link href="/voitures" className="btn-primary">
            {t.nav.book}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors duration-200 hover:bg-ink hover:text-paper"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t.nav.openMenu}
            aria-expanded={menuOpen}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-mist bg-paper px-5 pb-6 pt-2 md:hidden">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="border-b border-mist py-3.5 text-sm text-stone transition-colors duration-150 hover:text-ink"
                onClick={() => setMenuOpen(false)}
              >
                {t.nav[link.key]}
              </Link>
            ))}

            <PhoneLink className="flex items-center gap-2.5 border-b border-mist py-3.5 text-sm text-ink" />

            <div className="flex items-center gap-1 py-4 text-stone">
              <SocialLinks
                className="p-1.5 transition-colors duration-200 hover:text-ink"
                iconSize={20}
              />
            </div>

            <div className="pt-1">
              <LanguageSwitcher variant="inline" onSelect={() => setMenuOpen(false)} />
            </div>

            <Link href="/voitures" className="btn-primary mt-5 w-full" onClick={() => setMenuOpen(false)}>
              {t.nav.bookNow}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
