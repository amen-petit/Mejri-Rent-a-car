import Link from "next/link";
import { BRAND_SHORT, PHONE_DISPLAY, WHATSAPP_NUMBER } from "@/lib/constants";

const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Nos Véhicules", href: "/voitures" },
  { label: "À Propos", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

const legalItems = [
  { label: "Confidentialité", href: "/#privacy" },
  { label: "Conditions d'utilisation", href: "/#terms" },
  { label: "Nous contacter", href: "/#contact" },
];

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/40">
        {title}
      </p>
      <div className="mt-5 flex flex-col gap-3.5">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="w-fit text-sm text-white/70 transition-colors duration-200 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Top — oversized wordmark + columns */}
        <div className="grid gap-12 border-b border-white/10 py-16 lg:grid-cols-[1.6fr_1fr_1fr] lg:py-20">
          <div className="max-w-sm">
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-3xl font-medium tracking-tight">
                {BRAND_SHORT}
              </span>
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-white/40">
                Rent a Car
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/55">
              Location de voitures en Tunisie. Flotte récente, tarifs
              transparents et assistance disponible à toute heure.
            </p>
            <a
              href={`tel:+${WHATSAPP_NUMBER}`}
              className="mt-7 inline-flex items-baseline gap-3 border-b border-white/20 pb-1 transition-colors duration-200 hover:border-white"
            >
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                Tél
              </span>
              <span className="font-display text-xl">{PHONE_DISPLAY}</span>
            </a>
          </div>

          <FooterColumn title="Navigation" items={navItems} />
          <FooterColumn title="Légal" items={legalItems} />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 py-7 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} {BRAND_SHORT}. Tous droits réservés.</span>
          <span className="uppercase tracking-[0.2em]">Tunisie</span>
        </div>
      </div>
    </footer>
  );
}
