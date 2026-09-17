import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getArtisanById } from "@/lib/artisans";
import ArtisanProfileForm from "@/components/ArtisanProfileForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ma fiche artisan",
};

export default async function CompteArtisanProfilPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/artisan/profil");
  if (session.type !== "ARTISAN") redirect("/compte");

  const artisan = await getArtisanById(session.userId);
  if (!artisan) redirect("/compte");

  return (
    <div className="flex flex-col gap-1">
      <h2 className="m-0 font-display text-[24px] text-ink">Ma fiche artisan</h2>
      <p className="m-0 max-w-[64ch] text-[14px] leading-[1.6] text-muted">
        Ces informations apparaissent sur votre fiche publique dans l&apos;annuaire des artisans.
      </p>

      <div className="mt-6">
        <ArtisanProfileForm artisan={artisan} />
      </div>
    </div>
  );
}
