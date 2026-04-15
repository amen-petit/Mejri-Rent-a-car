import type { Metadata } from "next";
import { getCarById } from "@/lib/cars";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { id } = await params;
  const car = await getCarById(id);

  if (!car) {
    return {
      title: "Véhicule introuvable",
      description: "Le véhicule demandé est introuvable.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${car.brand} ${car.name} - Location en Tunisie`;
  const description = `Louez ${car.brand} ${car.name} en Tunisie à partir de ${car.price_per_day} DT/jour. Réservation rapide en ligne avec Royal Car.`;
  const canonical = `/voitures/${car.id}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonical}`,
      type: "website",
      images: car.images?.[0]
        ? [
            {
              url: car.images[0],
              alt: `${car.brand} ${car.name}`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: car.images?.[0] ? [car.images[0]] : undefined,
    },
  };
}

export default function CarDetailLayout({ children }: LayoutProps) {
  return children;
}
