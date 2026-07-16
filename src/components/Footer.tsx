"use client";

import Link from "next/link";
import { BRAND_SHORT, PHONE_DISPLAY, PHONE_TEL, PHONE2_DISPLAY, PHONE2_TEL } from "@/lib/constants";
import { useI18n } from "@/i18n/client";
import SocialLinks from "@/components/SocialLinks";

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
  const { t } = useI18n();

  const navItems = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.vehicles, href: "/voitures" },
    { label: t.how.title, href: "/#how" },
    { label: t.nav.contact, href: "/#location" },
  ];

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Top — oversized wordmark + columns */}
        <div className="grid gap-12 border-b border-white/10 py-16 lg:grid-cols-[1.8fr_1fr] lg:py-20">
          <div className="max-w-sm">
            <div className="flex items-baseline gap-2.5">
              <span className="font-display text-3xl font-medium tracking-tight">
                {BRAND_SHORT}
              </span>
              <span className="hidden text-[0.7rem] font-bold uppercase tracking-[0.32em] text-stone sm:inline">
                Rent Car
              </span>
            </div>
            <p className="mt-5 text-sm leading-7 text-white/55">
              {t.footer.tagline}
            </p>
            <div className="mt-7 flex flex-col items-start gap-1">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                {t.footer.phoneLabel}
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                <a
                  href={`tel:${PHONE_TEL}`}
                  aria-label={`${t.nav.call} ${PHONE_DISPLAY}`}
                  className="inline-block font-display text-xl transition-colors duration-200 hover:text-white/80"
                  dir="ltr"
                >
                  {PHONE_DISPLAY}
                </a>
                <a
                  href={`tel:${PHONE2_TEL}`}
                  aria-label={`${t.nav.call} ${PHONE2_DISPLAY}`}
                  className="inline-block font-display text-xl transition-colors duration-200 hover:text-white/80"
                  dir="ltr"
                >
                  +216 {PHONE2_DISPLAY}
                </a>
              </div>
            </div>

            {/* Social */}
            <div className="mt-7">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                {t.footer.followUs}
              </p>
              <div className="mt-3 flex items-center gap-2 text-white/60">
                <SocialLinks
                  className="rounded-[var(--radius-sm)] border border-white/15 p-2 transition-colors duration-200 hover:border-white/40 hover:text-white"
                  iconSize={18}
                />
              </div>
            </div>
          </div>

          <FooterColumn title={t.footer.navigation} items={navItems} />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-3 py-7 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <span>
            © {new Date().getFullYear()} {BRAND_SHORT}. {t.footer.rights}
          </span>
          <span className="uppercase tracking-[0.2em]">{t.common.country}</span>
        </div>
      </div>
    </footer>
  );
}
