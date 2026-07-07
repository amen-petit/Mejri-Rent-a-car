import Link from "next/link";
import { getServerI18n } from "@/i18n/server";

export const metadata = {
  title: "Page introuvable",
};

export default async function NotFound() {
  const { t } = await getServerI18n();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-20 text-center">
      <span className="eyebrow">{t.states.notFoundEyebrow}</span>
      <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4rem)] font-medium leading-[1.02] tracking-tight text-ink">
        {t.states.notFoundTitle}
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-stone">
        {t.states.notFoundDesc}
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary px-7 py-3">
          {t.states.backHome}
        </Link>
        <Link href="/voitures" className="btn-outline px-7 py-3">
          {t.states.viewVehicles}
        </Link>
      </div>
    </main>
  );
}
