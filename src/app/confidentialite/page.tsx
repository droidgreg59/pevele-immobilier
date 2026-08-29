import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Politique de confidentialité et protection des données personnelles de ${SITE_NAME}.`,
  alternates: {
    canonical: "/confidentialite",
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

export default function ConfidentialitePage() {
  return (
    <div className="animate-fade-up mx-auto max-w-[760px] px-6 py-14 sm:py-20">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Vie privée
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[40px]">
        Politique de confidentialité
      </h1>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <div className="mt-8 flex flex-col gap-8 font-sans text-[14.5px] leading-[1.7] text-muted">
        <div className="rounded-2xl border border-dashed border-line bg-surface p-5 text-[13.5px] text-ink">
          Ce texte décrit précisément les données réellement collectées par le site à ce jour.
          Les points marqués <ACompleter>à compléter</ACompleter> nécessitent une décision ou une
          information de votre part avant mise en ligne publique.
        </div>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Responsable du traitement</h2>
          <p className="mt-3">
            Le responsable du traitement des données est <b>Galt Lab</b>, éditeur du site (voir
            les{" "}
            <Link href="/mentions-legales" className="text-blue">
              mentions légales
            </Link>
            ).
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Données collectées</h2>
          <p className="mt-3">Selon les actions effectuées sur le site, nous collectons :</p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              <b>À la création d&apos;un compte</b> : nom, email, mot de passe (chiffré, jamais
              stocké en clair), type de compte (particulier, agence, artisan) et, pour les
              professionnels, coordonnées de l&apos;activité (entreprise, téléphone, adresse,
              site web).
            </li>
            <li>
              <b>Au dépôt d&apos;une annonce</b> : les informations du bien (prix, surface,
              localisation, photos…), publiées après vérification.
            </li>
            <li>
              <b>Aux demandes de visite, d&apos;estimation ou de devis</b> : nom, téléphone, et le
              contenu du message, transmis au destinataire de la demande (propriétaire de
              l&apos;annonce, agence ou artisan concerné).
            </li>
            <li>
              <b>Aux avis publiés</b> : le contenu de l&apos;avis et une note, associés à votre
              compte.
            </li>
            <li>
              <b>À la navigation</b> : un cookie de session technique (voir « Cookies »
              ci-dessous). Aucune donnée de navigation n&apos;est collectée à des fins publicitaires.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Finalités et base légale</h2>
          <p className="mt-3">
            Ces données sont utilisées pour : créer et gérer votre compte, publier vos annonces,
            transmettre vos demandes (visite, estimation, devis, recherche confiée) à
            l&apos;agence, à l&apos;artisan ou au particulier concerné, et vous envoyer les
            notifications liées à votre activité sur le site (nouvelle demande reçue, réponse à
            une demande…).
          </p>
          <p className="mt-2">
            Le traitement repose sur l&apos;exécution du contrat qui vous lie au site (fourniture
            du service demandé) ou, à défaut, sur notre intérêt légitime à assurer le
            fonctionnement de la plateforme.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Destinataires des données</h2>
          <p className="mt-3">
            Vos données ne sont jamais vendues à des tiers. Elles sont transmises uniquement :
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              À l&apos;agence, l&apos;artisan ou le particulier directement concerné par une
              demande que vous initiez (visite, estimation, devis, recherche confiée, avis) ;
            </li>
            <li>
              À <b>Resend</b>, notre prestataire d&apos;envoi d&apos;emails transactionnels
              (notifications liées à votre activité sur le site), uniquement pour les besoins de
              cet envoi ;
            </li>
            <li>À l&apos;équipe technique du site, pour l&apos;administration et la modération.</li>
          </ul>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Durée de conservation</h2>
          <p className="mt-3">
            Vos données sont conservées le temps de l&apos;existence de votre compte, puis{" "}
            <ACompleter>
              durée de conservation après suppression du compte ou dernière activité — 3 ans est une
              durée usuelle à confirmer
            </ACompleter>
            .
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Cookies et stockage local</h2>
          <p className="mt-3">
            Le site utilise uniquement un cookie de session, strictement nécessaire à
            l&apos;authentification (technique, non soumis à consentement). Certaines pages
            utilisent également le stockage local de votre navigateur (localStorage) pour
            mémoriser des préférences propres à votre appareil (brouillon de recherche en cours,
            annonces déjà consultées) — ces informations restent sur votre appareil et ne sont
            jamais transmises au site. Le site n&apos;utilise aucun cookie publicitaire ni
            traceur tiers à ce jour.
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Sécurité</h2>
          <p className="mt-3">
            Les mots de passe sont chiffrés (hachage) et ne sont jamais stockés ni transmis en
            clair. La connexion est maintenue par un jeton de session signé, stocké dans un cookie
            protégé contre les accès en JavaScript (httpOnly).
          </p>
        </section>

        <section>
          <h2 className="m-0 font-display text-xl text-ink">Vos droits</h2>
          <p className="mt-3">
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
            d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation et
            d&apos;opposition sur vos données, ainsi que d&apos;un droit à la portabilité. Pour
            exercer ces droits, contactez-nous à{" "}
            <a href="mailto:contact@pevele-immobilier.fr" className="text-blue">
              contact@pevele-immobilier.fr
            </a>
            . Vous disposez également du droit d&apos;introduire une réclamation auprès de la
            CNIL (www.cnil.fr).
          </p>
        </section>
      </div>
    </div>
  );
}
