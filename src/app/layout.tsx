import type { Metadata } from "next";
import { Fraunces, Inter, Cairo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import ConditionalFooter from "@/components/ConditionalFooter";
import MotionProvider from "@/components/MotionProvider";
import FeedbackProvider from "@/components/Feedback";
import { I18nProvider } from "@/i18n/client";
import { getServerLocale } from "@/i18n/server";
import { getDir } from "@/i18n/config";
import { SITE_URL, BRAND_NAME, BRAND_SHORT } from "@/lib/constants";

// Brand logo (transparent PNG) — used for the favicon/apple-touch-icon and the
// social share image. Not a tight square crop, so at very small favicon sizes
// (16x16 tab icon) the browser center-crops the full mark; a dedicated square
// icon crop would sharpen that further but isn't required for this to work
// correctly. Transparency means favicons blend into the browser tab instead of
// showing a background box, and OG/Twitter previews render it on the
// platform's own background (typically white) rather than a filled card.
const OG_IMAGE_PATH = "/logo.png";
const BRAND_ICON_PATH = "/logo.png";

// Sitewide WebSite structured data — a signal (not a guarantee; Google has final
// say) that helps it associate the brand name with this domain instead of
// falling back to the raw URL in search results.
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND_NAME,
  alternateName: [BRAND_SHORT],
  url: SITE_URL,
  inLanguage: ["fr", "en", "ar"],
};

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

// Arabic — applied via CSS when <html lang="ar">. Covers both body and display
// so RTL pages read naturally instead of falling back to a Latin serif.
const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
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
        width: 2352,
        height: 1792,
        type: "image/png",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();
  const dir = getDir(locale);

  return (
    <html lang={locale} dir={dir}>
      <body
        className={`${fraunces.variable} ${inter.variable} ${cairo.variable} bg-paper text-ink antialiased overflow-x-hidden`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <I18nProvider initialLocale={locale}>
          <MotionProvider />
          <FeedbackProvider>
            <div className="min-h-screen page-enter">{children}</div>
            <ConditionalFooter />
          </FeedbackProvider>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
