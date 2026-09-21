import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Méthodologie des prix immobiliers",
  description:
    "Comment sont calculés les prix immobiliers affichés sur Pévèle-Immobilier.fr : source des données (DVF), critères d'exclusion, choix médiane/moyenne, traitement des valeurs atypiques.",
  alternates: {
    canonical: "/methodologie",
  },
};

export default function MethodologiePage() {
  return (
    <div className="animate-fade-up mx-auto max-w-[760px] px-6 py-14 sm:py-20">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Méthodologie
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Comment sont calculés les prix immobiliers
      </h1>
      <Link href="/prix" className="text-[13px] font-semibold text-blue">
        ← L&apos;Observatoire des prix
      </Link>

      <div className="mt-8 flex flex-col gap-8 font-sans text-[14.5px] leading-[1.7] text-muted">
        <section>
          <h2 className="m-0 font-display text-xl text-ink">Source des données</h2>
          <p className="mt-3">
            Les prix affichés sur {SITE_NAME} viennent exclusivement des{" "}
            <b>DVF (Demandes de Valeurs Foncières)</b>, la base des transactions immobilières
            réellement enregistrées par l&apos;administration fiscale, publiée en open data sur{" "}
            <a href="https://www.data.gouv.fr" className="text-blue" target="_blank" rel="noopener noreferrer">
              data.gouv.fr
            </a>{" "}
            (Etalab). Ce ne sont pas des prix affichés en annonce, ni des estimations : ce sont des
            ventes effectivement signées chez le notaire.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Données brutes vs données retenues</h2>
          <p className="mt-3">
            DVF recense chaque mutation (vente), avec sa date, sa valeur, sa surface et la commune.
            Avant tout calcul, un certain nombre de lignes sont écartées :
          </p>
          <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
            <li>les mutations qui ne sont pas des ventes (donations, successions...) ;</li>
            <li>les biens autres qu&apos;une maison ou un appartement (terrains, locaux commerciaux...) ;</li>
            <li>
              les mutations portant sur plusieurs lots à la fois (ex. un immeuble entier) : leur prix
              global ne reflète pas le prix d&apos;un bien unique ;
            </li>
            <li>les lignes sans surface ou sans valeur exploitable, ou avec une surface inférieure à 9 m² ;</li>
            <li>un prix au m² manifestement hors de tout marché réel (moins de 200 € ou plus de 15 000 €/m²).</li>
          </ul>
          <p className="mt-3">
            Sur la Pévèle, cela laisse <b>3 408 ventes de maisons</b> et <b>240 ventes
            d&apos;appartements</b> exploitables au total, sur les millésimes disponibles.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Maisons et appartements : jamais mélangés</h2>
          <p className="mt-3">
            Une maison et un appartement n&apos;ont pas le même prix au m² pour des raisons
            structurelles (terrain, mitoyenneté, charges de copropriété...). Tous les chiffres de{" "}
            {SITE_NAME} sont donc calculés <b>séparément par typologie</b> — jamais de moyenne
            mélangeant les deux. Le prix mis en avant par défaut est celui des <b>maisons</b>,
            typologie très majoritaire en Pévèle.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Médiane plutôt que moyenne</h2>
          <p className="mt-3">
            L&apos;indicateur principal affiché est la <b>médiane</b> (la valeur qui sépare
            l&apos;échantillon en deux moitiés égales), pas la moyenne. La médiane est plus robuste :
            une poignée de ventes très hautes ou très basses ne la fait pas bouger, contrairement à la
            moyenne. La moyenne reste affichée à titre secondaire, pour comparaison.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Traitement des valeurs atypiques</h2>
          <p className="mt-3">
            Même après les exclusions ci-dessus, certaines ventes réelles restent peu représentatives
            du marché courant (cession familiale sous-évaluée, bien avec dépendances non comptées
            dans la surface déclarée...). DVF ne permet pas d&apos;identifier ces cas directement.
          </p>
          <p className="mt-3">
            La règle retenue : les <b>1 % de prix/m² les plus bas et les 1 % les plus hauts</b> sont
            exclus du calcul de la médiane, de la moyenne et de la fourchette min/max — mais jamais
            des listes de ventes détaillées, où toutes les transactions restent visibles. Ce seuil est
            calculé <b>une fois pour toute la Pévèle, par typologie</b> (jamais commune par commune :
            sur un petit village, 1 % représente parfois une seule vente, ce qui rendrait le seuil
            instable). Concrètement, pour les maisons, ce filtre exclut les prix en dessous de{" "}
            <b>667 €/m²</b> et au-dessus de <b>6 593 €/m²</b> ; pour les appartements, en dessous de{" "}
            <b>1 125 €/m²</b> et au-dessus de <b>12 931 €/m²</b>.
          </p>
          <p className="mt-3">
            Exemple concret : à Cysoing, sur <b>164 ventes de maisons</b> recensées, <b>157</b> sont
            retenues pour le calcul de la médiane et de la moyenne (7 ventes hors bornes restent
            visibles dans le détail des transactions, simplement écartées du calcul).
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Taille d&apos;échantillon et communes concernées</h2>
          <p className="mt-3">
            En dessous de <b>5 ventes retenues</b>, aucun chiffre n&apos;est affiché : la page indique
            « données insuffisantes » plutôt qu&apos;un prix statistiquement fragile. C&apos;est le cas
            de plusieurs petites communes de la Pévèle pour la typologie appartement, quasi absente en
            dehors des bourgs principaux.
          </p>
          <p className="mt-3">
            À l&apos;inverse, une petite commune peut tout à fait afficher un chiffre fiable pour les
            maisons : Cobrieux, par exemple, totalise 18 ventes de maisons DVF exploitables.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Fraîcheur des données</h2>
          <p className="mt-3">
            Les DVF sont mises à jour par l&apos;administration fiscale avec plusieurs mois de décalage
            par rapport à la signature réelle chez le notaire — c&apos;est une limite connue de cette
            source, pas une donnée que {SITE_NAME} peut accélérer. Le site réimporte les données DVF
            disponibles automatiquement (voir la date de mise à jour affichée sur chaque page de prix) ;
            cette fraîcheur d&apos;import est distincte de la fraîcheur des annonces en ligne, qui
            dépend elle des flux de chaque agence partenaire.
          </p>
        </section>

        <p className="mt-2 text-[12px] text-muted-2">
          Source : DVF (Demandes de valeurs foncières), data.gouv.fr / Etalab —{" "}
          <a href={`${SITE_URL}/prix`} className="text-blue">
            voir l&apos;Observatoire des prix
          </a>
          .
        </p>
      </div>
    </div>
  );
}
