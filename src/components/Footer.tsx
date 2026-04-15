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
        background: "linear-gradient(180deg, #231F20 0%, #D4AF37 100%)",
      }}
      className="text-white"
    >
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="inline-flex rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">
                Yahyaoui
              </span>
              <span className="mt-1 text-xl font-bold text-white">
                Rent a Car
              </span>
            </div>
          </div>
          <p className="text-sm leading-7 text-slate-300 max-w-xs">
            Flotte moderne et fiable pour vos besoins de mobilité en Tunisie.
            Réservation en ligne facile, service client dédié, et assistance
            24/7.
          </p>
          <p className="text-sm font-semibold text-[#D4AF37]">24 786 189</p>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">
            Navigation
          </p>
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-slate-300 transition-colors duration-250 hover:text-[#D4AF37]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]">
            Légal
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/#privacy"
              className="text-sm text-slate-300 transition-colors duration-250 hover:text-[#D4AF37]"
            >
              Politique de confidentialité
            </Link>
            <Link
              href="/#terms"
              className="text-sm text-slate-300 transition-colors duration-250 hover:text-[#D4AF37]"
            >
              Conditions d&apos;utilisation
            </Link>
            <Link
              href="/#contact"
              className="text-sm text-slate-300 transition-colors duration-250 hover:text-[#D4AF37]"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[#D4AF37]/30 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Tous droits réservés.</span>
          <div className="flex flex-wrap gap-4 sm:gap-6">
            <a
              href="#"
              className="transition-colors duration-250 hover:text-[#D4AF37]"
            >
              Confidentialité
            </a>
            <a
              href="#"
              className="transition-colors duration-250 hover:text-[#D4AF37]"
            >
              Conditions
            </a>
            <a
              href="#"
              className="transition-colors duration-250 hover:text-[#D4AF37]"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
