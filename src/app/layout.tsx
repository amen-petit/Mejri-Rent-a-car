import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import ConditionalFooter from "@/components/ConditionalFooter";
import MotionProvider from "@/components/MotionProvider";
import FeedbackProvider from "@/components/Feedback";
import { SITE_URL, BRAND_NAME } from "@/lib/constants";

const OG_IMAGE_PATH = "/Untitled design.png";
const BRAND_ICON_PATH = "/icons/car.svg";

// Display — optical serif for editorial headlines. Variable font, so no
// `weight`; we opt into the optical-size axis for refined large type.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz"],
});

// Body / UI — quiet grotesk.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} | Location de Voitures en Tunisie`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    `Location de voitures en Tunisie. Réservez votre véhicule en ligne avec ${BRAND_NAME}: citadine, berline, SUV et utilitaires aux meilleurs tarifs.`,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "location voiture tunisie",
    "location voiture tunis",
    "location voiture aeroport tunis",
    "location voiture pas cher tunisie",
    "location SUV tunisie",
    BRAND_NAME,
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
    title: `${BRAND_NAME} | Location de Voitures en Tunisie`,
    description:
      `Réservez votre voiture en Tunisie facilement avec ${BRAND_NAME}. Flotte moderne, assistance 24/7 et réservation rapide.`,
    url: SITE_URL,
    siteName: BRAND_NAME,
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: BRAND_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | Location de Voitures en Tunisie`,
    description:
      `Réservez votre voiture en Tunisie facilement avec ${BRAND_NAME}. Flotte moderne et réservation en ligne.`,
    images: [OG_IMAGE_PATH],
  },
  icons: {
    icon: [
      { url: BRAND_ICON_PATH, type: "image/png" },
      { url: BRAND_ICON_PATH, rel: "shortcut icon", type: "image/png" },
    ],
    apple: [{ url: BRAND_ICON_PATH, type: "image/png" }],
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
        className={`${fraunces.variable} ${inter.variable} bg-paper text-ink antialiased overflow-x-hidden`}
      >
        <MotionProvider />
        <FeedbackProvider>
          <div className="min-h-screen page-enter">{children}</div>
          <ConditionalFooter />
        </FeedbackProvider>
        <Analytics />
      </body>
    </html>
  );
}
