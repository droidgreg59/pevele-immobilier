import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import PreLaunchModal from "@/components/PreLaunchModal";
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
    "Le portail de référence des annonces et des prix immobiliers de la Pévèle : maisons, appartements et terrains à vendre ou à louer dans les 44 communes, agences et particuliers réunis.",
  // Pas de `alternates.canonical` ici : Next.js hérite silencieusement le
  // canonical du layout parent sur toute page qui ne redéfinit pas le sien —
  // le mettre à "/" ici faisait donc canonicaliser vers l'accueil n'importe
  // quelle page oubliée (constaté en prod sur /connexion et /mon-projet).
  // Chaque page publique déclare maintenant son propre `alternates.canonical`
  // (src/app/page.tsx pour l'accueil) ; une page qui l'oublie n'a désormais
  // aucun canonical plutôt qu'un canonical erroné.
  // Balises meta de vérification Search Console / Bing Webmaster Tools —
  // no-op tant que ces variables sont absentes (voir .env.example et le
  // rapport de fin de sprint pour la procédure d'obtention des jetons).
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "Pévèle Immobilier — Annonces et prix immobiliers dans toute la Pévèle",
    description:
      "Le portail de référence des annonces et des prix immobiliers de la Pévèle : maisons, appartements et terrains à vendre ou à louer dans les 44 communes.",
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
  manifest: "/manifest.webmanifest",
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#003AB4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const cfBeaconToken = process.env.CF_BEACON_TOKEN;

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
        <PreLaunchModal />
        {cfBeaconToken ? (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({ token: cfBeaconToken })}
          />
        ) : null}
      </body>
    </html>
  );
}
