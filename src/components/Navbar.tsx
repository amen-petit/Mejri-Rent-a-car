"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      data-reveal
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-soft"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group flex items-center">
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              RentPoint
            </span>
            <span className="mt-1 text-lg font-bold text-[#0A0A0C] sm:text-xl">
              rent a car
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-12 text-sm font-medium text-slate-600">
          <Link
            href="/"
            className="relative transition-colors duration-250 hover:text-navy-500 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#D4AF37] after:transition-all after:duration-250 hover:after:w-full"
          >
            Accueil
          </Link>
          <Link
            href="/voitures"
            className="relative transition-colors duration-250 hover:text-navy-500 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#D4AF37] after:transition-all after:duration-250 hover:after:w-full"
          >
            Nos Véhicules
          </Link>
          <Link
            href="/#about"
            className="relative transition-colors duration-250 hover:text-navy-500 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#D4AF37] after:transition-all after:duration-250 hover:after:w-full"
          >
            À Propos
          </Link>
          <Link
            href="/#contact"
            className="relative transition-colors duration-250 hover:text-navy-500 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#D4AF37] after:transition-all after:duration-250 hover:after:w-full"
          >
            Contact
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/voitures" className="btn-primary">
            Réserver maintenant
          </Link>
        </div>

        <button
          className="md:hidden inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-soft transition-all duration-250 hover:opacity-95"
          style={{
            background: "linear-gradient(135deg, #0A0A0C 0%, #D4AF37 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Ouvrir le menu"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {menuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div
          data-reveal
          className="md:hidden border-t border-slate-200 bg-white px-6 py-4 shadow-soft-md"
        >
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg transition-colors duration-250 hover:text-navy-500 hover:bg-navy-50"
              onClick={() => setMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link
              href="/voitures"
              className="px-3 py-2 rounded-lg transition-colors duration-250 hover:text-navy-500 hover:bg-navy-50"
              onClick={() => setMenuOpen(false)}
            >
              Nos Véhicules
            </Link>
            <Link
              href="/#about"
              className="px-3 py-2 rounded-lg transition-colors duration-250 hover:text-navy-500 hover:bg-navy-50"
              onClick={() => setMenuOpen(false)}
            >
              À Propos
            </Link>
            <Link
              href="/#contact"
              className="px-3 py-2 rounded-lg transition-colors duration-250 hover:text-navy-500 hover:bg-navy-50"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/voitures"
              className="btn-primary mt-2"
              onClick={() => setMenuOpen(false)}
            >
              Réserver maintenant
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
