import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos Véhicules",
  description:
    "Découvrez notre flotte de véhicules en Tunisie: citadines, berlines, SUV et utilitaires avec réservation en ligne.",
  alternates: {
    canonical: "/voitures",
  },
};

export default function VoituresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
