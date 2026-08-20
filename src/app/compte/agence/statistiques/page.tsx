import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getAgencyStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistiques — Pévèle Immobilier",
};

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
      <span className="font-display text-[32px] leading-none text-blue">{value}</span>
      <span className="font-mono text-[10px] font-medium text-muted">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <span className="font-mono text-[10.5px] font-medium text-ink">{title}</span>
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
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-sm text-blue">
        MON COMPTE
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        STATISTIQUES
      </h1>
      <Link href="/compte" className="font-mono text-[11.5px] font-medium text-blue">
        ← MON COMPTE
      </Link>

      <p className="mt-6 max-w-[64ch] font-sans text-[14.5px] leading-[1.6] text-muted">
        Un aperçu de votre activité sur le plan — annonces, recherches
        confiées par des particuliers, propositions envoyées et avis reçus.
      </p>

      <Section title="ANNONCES">
        <StatTile value={String(stats.listings.publiees)} label="EN LIGNE" />
        <StatTile value={String(stats.listings.enVerification)} label="EN VÉRIFICATION" />
        <StatTile
          value={
            stats.listings.prixMoyenVente != null
              ? `${stats.listings.prixMoyenVente.toLocaleString("fr-FR")} €`
              : "—"
          }
          label="PRIX MOYEN (VENTE)"
        />
      </Section>

      <Section title="RECHERCHES CONFIÉES">
        <StatTile value={String(stats.mandates.acceptees)} label="CLIENTS" />
        <StatTile value={String(stats.mandates.enAttente)} label="EN ATTENTE" />
        <StatTile
          value={
            stats.mandates.tauxAcceptation != null ? `${stats.mandates.tauxAcceptation}%` : "—"
          }
          label="TAUX D'ACCEPTATION"
        />
      </Section>

      <Section title="PROPOSITIONS">
        <StatTile value={String(stats.proposals.envoyees)} label="ENVOYÉES" />
        <StatTile value={String(stats.proposals.interessees)} label="ONT INTÉRESSÉ" />
      </Section>

      <Section title="AVIS PÉVÈLE">
        <StatTile value={String(stats.reviews.count)} label="AVIS REÇUS" />
        <StatTile
          value={stats.reviews.average != null ? `${stats.reviews.average} / 5` : "—"}
          label="NOTE MOYENNE"
        />
      </Section>
    </div>
  );
}
