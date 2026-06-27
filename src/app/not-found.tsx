import Link from "next/link";

export const metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-20 text-center">
      <span className="eyebrow">Erreur 404</span>
      <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4rem)] font-medium leading-[1.02] tracking-tight text-ink">
        Cette page n&apos;existe pas
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-stone">
        Le lien est peut-être incorrect ou la page a été déplacée. Revenez à
        l&apos;accueil ou parcourez nos véhicules disponibles.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary px-7 py-3">
          Retour à l&apos;accueil
        </Link>
        <Link href="/voitures" className="btn-outline px-7 py-3">
          Voir les véhicules
        </Link>
      </div>
    </main>
  );
}
