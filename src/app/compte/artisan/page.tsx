import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getArtisanById } from "@/lib/artisans";
import ArtisanProfileForm from "@/components/ArtisanProfileForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ma fiche artisan — Pévèle Immobilier",
};

export default async function CompteArtisanPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/artisan");
  if (session.type !== "ARTISAN") redirect("/compte");

  const artisan = await getArtisanById(session.userId);
  if (!artisan) redirect("/compte");

  return (
    <div className="animate-fade-up max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm text-gold">
        MON COMPTE
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        MA FICHE ARTISAN
      </h1>
      <div className="flex flex-wrap gap-4">
        <Link href="/compte" className="font-mono text-[11.5px] font-medium text-blue">
          ← MON COMPTE
        </Link>
        <Link
          href={`/artisans/${session.userId}`}
          className="font-mono text-[11.5px] font-medium text-blue"
        >
          VOIR MA FICHE PUBLIQUE →
        </Link>
      </div>

      <p className="mt-6 max-w-[64ch] font-sans text-[14.5px] leading-[1.6] text-muted">
        Ces informations apparaissent sur votre fiche publique dans
        l&apos;annuaire des artisans.
      </p>

      <div className="mt-7">
        <ArtisanProfileForm artisan={artisan} />
      </div>
    </div>
  );
}
