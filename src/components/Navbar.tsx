"use client";
import Link from "next/link";
import { useState } from "react";
import { BRAND_SHORT } from "@/lib/constants";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Nos Véhicules", href: "/voitures" },
  { label: "À Propos", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

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

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-mist bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Wordmark />

        {/* Desktop nav */}
        <div className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative text-sm text-stone transition-colors duration-200 hover:text-ink after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-ink after:transition-[width] after:duration-200 after:ease-out hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex">
          <Link href="/voitures" className="btn-primary">
            Réserver
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-mist text-ink transition-colors duration-200 hover:bg-ink hover:text-paper md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-mist bg-paper px-5 pb-6 pt-2 md:hidden">
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="border-b border-mist py-3.5 text-sm text-stone transition-colors duration-150 hover:text-ink"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/voitures" className="btn-primary mt-5 w-full" onClick={() => setMenuOpen(false)}>
              Réserver maintenant
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
