import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "Accueil", href: "/" },
  { label: "Nos Véhicules", href: "/voitures" },
  { label: "À Propos", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #18559d 0%, #dfc830 100%)",
      }}
      className="text-white"
    >
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center">
            <div
              className="rounded-2xl p-0.5 shadow-soft"
              style={{
                background: "linear-gradient(135deg, #dfc830 0%, #18559d 100%)",
              }}
            >
              <div className="relative h-14 w-40 rounded-2xl bg-white/95 sm:h-16 sm:w-48">
                <Image
                  src="/Untitled design (4).png"
                  alt="Royal Car"
                  fill
                  sizes="(max-width: 640px) 160px, 192px"
                  className="object-contain p-2"
                />
              </div>
            </div>
          </div>
          <p className="text-sm leading-7 text-slate-300 max-w-xs">
            Flotte moderne et fiable pour vos besoins de mobilité en Tunisie.
            Réservation en ligne facile, service client dédié, et assistance
            24/7.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest font-bold text-[#dfc830]">
            Navigation
          </p>
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-slate-300 transition-colors duration-250 hover:text-[#dfc830]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest font-bold text-[#dfc830]">
            Légal
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/#privacy"
              className="text-sm text-slate-300 transition-colors duration-250 hover:text-[#dfc830]"
            >
              Politique de confidentialité
            </Link>
            <Link
              href="/#terms"
              className="text-sm text-slate-300 transition-colors duration-250 hover:text-[#dfc830]"
            >
              Conditions d&apos;utilisation
            </Link>
            <Link
              href="/#contact"
              className="text-sm text-slate-300 transition-colors duration-250 hover:text-[#dfc830]"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[#dfc830]/30 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Tous droits réservés.</span>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <a
              href="#"
              className="transition-colors duration-250 hover:text-[#d4a5a0]"
            >
              Confidentialité
            </a>
            <a
              href="#"
              className="transition-colors duration-250 hover:text-[#d4a5a0]"
            >
              Conditions
            </a>
            <a
              href="#"
              className="transition-colors duration-250 hover:text-[#d4a5a0]"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
