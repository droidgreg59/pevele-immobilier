import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import PublishForm from "@/components/PublishForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Déposer une annonce",
  description: "Publiez votre annonce immobilière en Pévèle.",
};

export default async function DeposerPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/vendre/deposer");

  const accountLabel =
    session.type === "AGENCE" ? session.nom : `${session.nom} (particulier)`;

  return (
    <div className="animate-fade-up max-w-[900px] px-9 py-8">
      <div className="mb-2 flex flex-wrap items-baseline gap-4.5">
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-gold">
          Vendre
        </span>
        <h2 className="m-0 font-display text-[32px] text-ink sm:text-[40px]">
          Votre annonce
        </h2>
      </div>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <div className="mt-6.5">
        <PublishForm accountLabel={accountLabel} />
      </div>
    </div>
  );
}
