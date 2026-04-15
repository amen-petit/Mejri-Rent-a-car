import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import ConditionalFooter from "@/components/ConditionalFooter";
import MotionProvider from "@/components/MotionProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const ogImagePath = "/Untitled design.png";
const brandIconPath = "/brand-logo.png";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Royal Car | Location de Voitures en Tunisie",
    template: "%s | Royal Car",
  },
  description:
    "Location de voitures en Tunisie. Réservez votre véhicule en ligne avec Royal Car: citadine, berline, SUV et utilitaires aux meilleurs tarifs.",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "location voiture tunisie",
    "location voiture tunis",
    "location voiture aeroport tunis",
    "location voiture pas cher tunisie",
    "location SUV tunisie",
    "Royal Car",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Royal Car | Location de Voitures en Tunisie",
    description:
      "Réservez votre voiture en Tunisie facilement avec Royal Car. Flotte moderne, assistance 24/7 et réservation rapide.",
    url: siteUrl,
    siteName: "Royal Car",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: "Royal Car",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Royal Car | Location de Voitures en Tunisie",
    description:
      "Réservez votre voiture en Tunisie facilement avec Royal Car. Flotte moderne et réservation en ligne.",
    images: [ogImagePath],
  },
  icons: {
    icon: [
      { url: brandIconPath, type: "image/png" },
      { url: brandIconPath, rel: "shortcut icon", type: "image/png" },
    ],
    apple: [{ url: brandIconPath, type: "image/png" }],
  },
  category: "travel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${poppins.variable} ${openSans.variable} font-body bg-[#F5F6F7] text-[#2E2E2E] antialiased overflow-x-hidden`}
      >
        <MotionProvider />
        <div className="min-h-screen page-enter">{children}</div>
        <ConditionalFooter />
        <Analytics />
      </body>
    </html>
  );
}
