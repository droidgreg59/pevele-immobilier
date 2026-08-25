import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAgencyStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistiques",
};

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
      <span className="font-display text-[32px] leading-none text-blue">{value}</span>
      <span className="text-[12px] font-medium text-muted">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <span className="text-[11px] font-semibold text-ink">{title}</span>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

export default async function AgenceStatistiquesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence/statistiques");
  if (session.type !== "AGENCE") redirect("/compte");

  const stats = await getAgencyStats(session.userId);

  return (
    <div className="animate-fade-up max-w-[900px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Statistiques
      </h1>
      <Link href="/compte" className="text-[13px] font-semibold text-blue">
        ← Mon compte
      </Link>

      <p className="mt-6 max-w-[64ch] text-[14.5px] leading-[1.6] text-muted">
        Un aperçu de votre activité sur le plan — annonces, recherches
        confiées par des particuliers, propositions envoyées et avis reçus.
      </p>

      <Section title="Annonces">
        <StatTile value={String(stats.listings.publiees)} label="En ligne" />
        <StatTile value={String(stats.listings.enVerification)} label="En vérification" />
        <StatTile
          value={
            stats.listings.prixMoyenVente != null
              ? `${stats.listings.prixMoyenVente.toLocaleString("fr-FR")} €`
              : "—"
          }
          label="Prix moyen (vente)"
        />
      </Section>

      <Section title="Recherches confiées">
        <StatTile value={String(stats.mandates.acceptees)} label="Clients" />
        <StatTile value={String(stats.mandates.enAttente)} label="En attente" />
        <StatTile
          value={
            stats.mandates.tauxAcceptation != null ? `${stats.mandates.tauxAcceptation}%` : "—"
          }
          label="Taux d'acceptation"
        />
      </Section>

      <Section title="Propositions">
        <StatTile value={String(stats.proposals.envoyees)} label="Envoyées" />
        <StatTile value={String(stats.proposals.interessees)} label="Ont intéressé" />
      </Section>

      <Section title="Avis Pévèle">
        <StatTile value={String(stats.reviews.count)} label="Avis reçus" />
        <StatTile
          value={stats.reviews.average != null ? `${stats.reviews.average} / 5` : "—"}
          label="Note moyenne"
        />
      </Section>
    </div>
  );
}
