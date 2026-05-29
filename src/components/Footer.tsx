import Link from "next/link";
import { BRAND_NAME, PHONE_DISPLAY } from "@/lib/constants";

const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Nos Véhicules", href: "/voitures" },
  { label: "À Propos", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

const legalItems = [
  { label: "Politique de confidentialité", href: "/#privacy" },
  { label: "Conditions d'utilisation", href: "/#terms" },
  { label: "Nous contacter", href: "/#contact" },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--color-navy)" }} className="text-white">
      {/* Gradient top accent */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-primary) 30%, var(--color-secondary) 70%, transparent)",
        }}
      />

      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.4fr_1fr_1fr]">
        {/* Brand */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                {BRAND_NAME}
              </span>
              <span className="mt-0.5 text-lg font-bold text-white">
                rent a car
              </span>
            </div>
          </div>
          <p className="max-w-xs text-sm leading-7 text-slate-400">
            Flotte moderne et fiable pour vos besoins de mobilité en Tunisie.
            Réservation en ligne facile, service client dédié, et assistance
            24/7.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.45 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.09a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span className="font-semibold">{PHONE_DISPLAY}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Navigation
          </p>
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-slate-400 transition-colors duration-250 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Légal
          </p>
          <div className="flex flex-col gap-3">
            {legalItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-slate-400 transition-colors duration-250 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/8 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>© 2026 {BRAND_NAME}. Tous droits réservés.</span>
          <span className="flex items-center gap-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--color-primary)" }}
            />
            Tunisie · Service premium
          </span>
        </div>
      </div>
    </footer>
  );
}
