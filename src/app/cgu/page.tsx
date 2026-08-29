import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: `Conditions générales d'utilisation du site ${SITE_NAME}.`,
  alternates: {
    canonical: "/cgu",
  },
  robots: { index: false, follow: true },
};

export default function CguPage() {
  return (
    <div className="animate-fade-up mx-auto max-w-[760px] px-6 py-14 sm:py-20">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Conditions d&apos;utilisation
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Conditions générales d&apos;utilisation
      </h1>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <div className="mt-8 flex flex-col gap-8 font-sans text-[14.5px] leading-[1.7] text-muted">
        <section>
          <h2 className="m-0 font-display text-xl text-ink">1. Objet</h2>
          <p className="mt-3">
            {SITE_NAME} est un portail local mettant en relation, sur le territoire de la
            Pévèle, des particuliers, des agences immobilières et des artisans autour de projets
            immobiliers : consultation d&apos;annonces, dépôt d&apos;annonces, demandes de
            visite, demandes d&apos;estimation, recherches confiées à une agence et demandes de
            devis à un artisan. L&apos;utilisation du site implique l&apos;acceptation pleine et
            entière des présentes conditions.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">2. Accès au service</h2>
          <p className="mt-3">
            La consultation des annonces et des prix est libre et gratuite. La création d&apos;un
            compte (gratuite) est nécessaire pour déposer une annonce, contacter un propriétaire,
            un artisan ou une agence, ou enregistrer une recherche.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">3. Compte utilisateur</h2>
          <p className="mt-3">
            Vous vous engagez à fournir des informations exactes lors de votre inscription et à
            les maintenir à jour. Vous êtes responsable de la confidentialité de votre mot de
            passe et de toute activité effectuée depuis votre compte.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">4. Dépôt d&apos;annonces</h2>
          <p className="mt-3">
            Le dépositaire d&apos;une annonce (particulier ou agence) est seul responsable de
            l&apos;exactitude, de la légalité et de l&apos;actualité des informations et photos
            qu&apos;il publie. Chaque annonce déposée manuellement est soumise à vérification
            avant publication. {SITE_NAME} se réserve le droit de refuser, suspendre ou retirer
            à tout moment une annonce ne respectant pas ces conditions, sans préavis.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">5. Rôle du site</h2>
          <p className="mt-3">
            {SITE_NAME} est un service de mise en relation. Le site n&apos;est partie à aucune
            transaction, visite, mandat, devis ou négociation intervenant entre ses utilisateurs,
            et n&apos;offre aucune garantie quant à leur issue. Les prix moyens au m² affichés
            proviennent de données publiques officielles (DVF) et constituent une indication
            statistique, non une estimation individuelle engageante.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">6. Avis</h2>
          <p className="mt-3">
            Les avis publiés sur les fiches agences engagent la seule responsabilité de leur
            auteur. {SITE_NAME} se réserve le droit de modérer ou supprimer tout avis manifestement
            abusif, mensonger ou contraire aux présentes conditions.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">7. Responsabilité</h2>
          <p className="mt-3">
            {SITE_NAME} met en œuvre des moyens raisonnables pour assurer la disponibilité et la
            fiabilité du site, sans garantie de continuité absolue. {SITE_NAME} ne saurait être
            tenu responsable des contenus déposés par des tiers, ni des suites données aux mises
            en relation effectuées via le site.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">8. Résiliation</h2>
          <p className="mt-3">
            Vous pouvez cesser d&apos;utiliser le site à tout moment. {SITE_NAME} peut suspendre
            ou supprimer un compte en cas de non-respect des présentes conditions.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">9. Modification des CGU</h2>
          <p className="mt-3">
            {SITE_NAME} peut modifier les présentes conditions à tout moment ; la version en
            vigueur est celle publiée sur cette page.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">10. Droit applicable</h2>
          <p className="mt-3">
            Les présentes conditions sont soumises au droit français. En cas de litige, une
            solution amiable sera recherchée avant toute action judiciaire.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Données personnelles</h2>
          <p className="mt-3">
            Le traitement de vos données personnelles est décrit dans notre{" "}
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
