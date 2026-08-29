import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Mentions légales du site ${SITE_NAME}.`,
  alternates: {
    canonical: "/mentions-legales",
  },
  robots: { index: false, follow: true },
};

function ACompleter({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-[#FBF3DC] px-1.5 py-0.5 font-semibold text-gold">
      [À COMPLÉTER : {children}]
    </span>
  );
}

export default function MentionsLegalesPage() {
  return (
    <div className="animate-fade-up mx-auto max-w-[760px] px-6 py-14 sm:py-20">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Informations légales
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">Mentions légales</h1>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <div className="mt-8 flex flex-col gap-8 font-sans text-[14.5px] leading-[1.7] text-muted">
        <div className="rounded-2xl border border-dashed border-line bg-surface p-5 text-[13.5px] text-ink">
          Il reste à préciser la forme juridique/SIRET, le directeur de publication et
          l&apos;hébergeur ci-dessous avant la mise en ligne publique du site — obligatoires au
          regard de la loi française (LCEN).
        </div>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Éditeur du site</h2>
          <p className="mt-3">
            Le site <b>{SITE_URL.replace("https://", "")}</b> est édité par <b>Galt Lab</b>,{" "}
            <ACompleter>forme juridique (auto-entrepreneur, SAS, SARL…) et SIRET si applicable</ACompleter>,
            dont le siège est situé au <b>78 avenue du Peuple Belge, 59800 Lille</b>.
          </p>
          <p className="mt-2">
            Directeur de la publication : <ACompleter>nom du responsable de publication</ACompleter>.
          </p>
          <p className="mt-2">
            Contact : <a href="mailto:contact@pevele-immobilier.fr" className="text-blue">contact@pevele-immobilier.fr</a>.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Hébergement</h2>
          <p className="mt-3">
            Le site est hébergé par <ACompleter>nom de l&apos;hébergeur</ACompleter>,{" "}
            <ACompleter>adresse et contact de l&apos;hébergeur</ACompleter>.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Propriété intellectuelle</h2>
          <p className="mt-3">
            La structure du site, sa charte graphique, ses textes éditoriaux et sa marque «{" "}
            {SITE_NAME} » sont la propriété de l&apos;éditeur, sauf mention contraire. Les annonces,
            avis, photos et autres contenus déposés par les utilisateurs (particuliers, agences,
            artisans) restent la propriété de leurs auteurs respectifs, qui garantissent disposer
            des droits nécessaires à leur publication sur le site.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Sources des données</h2>
          <p className="mt-3">
            Les prix immobiliers affichés sont issus des données{" "}
            <b>DVF (Demandes de Valeurs Foncières)</b>, publiées par la Direction générale des
            Finances publiques et diffusées en open data sur{" "}
            <a href="https://www.data.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-blue">
              data.gouv.fr
            </a>{" "}
            (Etalab, Licence Ouverte).
          </p>
          <p className="mt-2">
            Les délimitations communales et coordonnées géographiques proviennent de l&apos;API
            officielle{" "}
            <a href="https://geo.api.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-blue">
              geo.api.gouv.fr
            </a>
            .
          </p>
          <p className="mt-2">
            Les commerces et transports affichés sur les fiches village proviennent des données{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue"
            >
              © les contributeurs d&apos;OpenStreetMap
            </a>
            , disponibles sous licence ODbL.
          </p>
          <p className="mt-2">
            Les établissements scolaires proviennent de l&apos;annuaire officiel de
            l&apos;Éducation nationale, publié sur data.education.gouv.fr.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Données personnelles</h2>
          <p className="mt-3">
            Le traitement des données personnelles est décrit dans notre{" "}
            <Link href="/confidentialite" className="text-blue">
              politique de confidentialité
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
