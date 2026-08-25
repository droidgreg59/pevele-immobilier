import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pévèle Immobilier — Annonces et prix immobiliers dans toute la Pévèle",
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Le portail de référence des annonces et des prix immobiliers de la Pévèle : maisons, appartements et terrains à vendre ou à louer dans les 35 communes, agences et particuliers réunis.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "Pévèle Immobilier — Annonces et prix immobiliers dans toute la Pévèle",
    description:
      "Le portail de référence des annonces et des prix immobiliers de la Pévèle : maisons, appartements et terrains à vendre ou à louer dans les 35 communes.",
    images: [{ url: "/images/camphin-en-pevele.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pévèle Immobilier — Annonces et prix immobiliers dans toute la Pévèle",
    description:
      "Le portail de référence des annonces et des prix immobiliers de la Pévèle, agences et particuliers réunis.",
    images: ["/images/camphin-en-pevele.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${jakarta.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
