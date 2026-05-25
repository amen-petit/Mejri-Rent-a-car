import type { MetadataRoute } from "next";
import { getCars } from "@/lib/cars";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const cars = await getCars().catch(() => []);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/voitures`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const carRoutes: MetadataRoute.Sitemap = cars.map((car) => ({
    url: `${SITE_URL}/voitures/${car.id}`,
    lastModified: car.created_at ? new Date(car.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...carRoutes];
}
