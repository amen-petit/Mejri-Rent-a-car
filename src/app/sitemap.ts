import type { MetadataRoute } from "next";
import { getCars } from "@/lib/cars";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const cars = await getCars().catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/voitures`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const carRoutes: MetadataRoute.Sitemap = cars.map((car) => ({
    url: `${siteUrl}/voitures/${car.id}`,
    lastModified: car.created_at ? new Date(car.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...carRoutes];
}
