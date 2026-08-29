import "server-only";
import { SITE_URL, SITE_NAME } from "./seo";

/**
 * Gabarits HTML des emails transactionnels. CSS entièrement en ligne (les
 * clients mail ignorent les feuilles de style externes et beaucoup de CSS
 * moderne) — on reste volontairement simple : un en-tête, un titre, un
 * corps, un bouton d'action, un pied de page.
 */

const BLUE = "#2c439c";
const INK = "#20242e";
const MUTED = "#676b78";
const CREAM = "#fbfaf8";
const LINE = "#e7e5e0";
const YELLOW = "#f0b429";

function layout(title: string, bodyHtml: string, cta?: { label: string; href: string }): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid ${LINE};overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid ${LINE};">
                <span style="font-size:16px;font-weight:700;color:${INK};">Pévèle <span style="color:${BLUE};">Immobilier</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:${INK};">${title}</h1>
                <div style="font-size:14.5px;line-height:1.6;color:${MUTED};">${bodyHtml}</div>
                ${
                  cta
                    ? `<a href="${cta.href}" style="display:inline-block;margin-top:20px;background:${YELLOW};color:${INK};font-weight:700;font-size:13.5px;text-decoration:none;padding:12px 22px;border-radius:999px;">${cta.label} →</a>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid ${LINE};">
                <span style="font-size:11.5px;color:${MUTED};">
                  ${SITE_NAME} — l'immobilier local de la Pévèle · <a href="${SITE_URL}" style="color:${MUTED};">${SITE_URL.replace("https://", "")}</a>
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 10px;">${text}</p>`;
}

export function visitRequestReceivedEmail(opts: {
  listingTitre: string;
  listingHref: string;
  authorNom: string;
  message: string;
}): { subject: string; html: string } {
  return {
    subject: `Nouvelle demande de visite — ${opts.listingTitre}`,
    html: layout(
      "Nouvelle demande de visite",
      p(`<b>${opts.authorNom}</b> souhaite visiter votre annonce « ${opts.listingTitre} ».`) +
        p(`Message : « ${opts.message} »`),
      { label: "Voir la demande", href: `${SITE_URL}${opts.listingHref}` }
    ),
  };
}

export function estimationRequestReceivedEmail(opts: {
  adresse: string;
  authorNom: string;
}): { subject: string; html: string } {
  return {
    subject: `Nouvelle demande d'estimation — ${opts.adresse}`,
    html: layout(
      "Nouvelle demande d'estimation",
      p(`<b>${opts.authorNom}</b> souhaite un rendez-vous d'estimation pour un bien situé « ${opts.adresse} ».`),
      { label: "Voir la demande", href: `${SITE_URL}/compte` }
    ),
  };
}

export function estimationRequestRespondedEmail(opts: {
  agencyNom: string;
  accepted: boolean;
}): { subject: string; html: string } {
  return {
    subject: opts.accepted
      ? `${opts.agencyNom} a accepté votre demande d'estimation`
      : `${opts.agencyNom} a décliné votre demande d'estimation`,
    html: layout(
      opts.accepted ? "Rendez-vous d'estimation accepté" : "Demande d'estimation déclinée",
      opts.accepted
        ? p(`<b>${opts.agencyNom}</b> a accepté votre demande de rendez-vous d'estimation et va vous recontacter.`)
        : p(`<b>${opts.agencyNom}</b> a décliné votre demande de rendez-vous d'estimation.`),
      { label: "Voir mes demandes", href: `${SITE_URL}/compte` }
    ),
  };
}

export function mandateReceivedEmail(opts: { clientNom: string }): { subject: string; html: string } {
  return {
    subject: "Un particulier vous confie sa recherche",
    html: layout(
      "Nouvelle recherche confiée",
      p(`<b>${opts.clientNom}</b> souhaite vous confier sa recherche immobilière.`),
      { label: "Voir mes clients", href: `${SITE_URL}/compte/agence/clients` }
    ),
  };
}

export function mandateRespondedEmail(opts: { agencyNom: string; accepted: boolean }): {
  subject: string;
  html: string;
} {
  return {
    subject: opts.accepted
      ? `${opts.agencyNom} a accepté votre recherche`
      : `${opts.agencyNom} a décliné votre recherche`,
    html: layout(
      opts.accepted ? "Recherche acceptée" : "Recherche déclinée",
      opts.accepted
        ? p(`<b>${opts.agencyNom}</b> a accepté de vous accompagner sur votre recherche.`)
        : p(`<b>${opts.agencyNom}</b> a décliné votre recherche.`),
      { label: "Voir mon compte", href: `${SITE_URL}/compte` }
    ),
  };
}

export function devisRequestReceivedEmail(opts: { authorNom: string; message: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: "Nouvelle demande de devis",
    html: layout(
      "Nouvelle demande de devis",
      p(`<b>${opts.authorNom}</b> vous a envoyé une demande de devis.`) +
        p(`Message : « ${opts.message} »`),
      { label: "Voir la demande", href: `${SITE_URL}/compte` }
    ),
  };
}

export function proposalReceivedEmail(opts: {
  agencyNom: string;
  listingTitre: string;
  listingHref: string;
}): { subject: string; html: string } {
  return {
    subject: `${opts.agencyNom} vous propose un bien`,
    html: layout(
      "Nouvelle proposition de bien",
      p(`<b>${opts.agencyNom}</b> vous propose « ${opts.listingTitre} », en réponse à votre recherche confiée.`),
      { label: "Voir le bien", href: `${SITE_URL}${opts.listingHref}` }
    ),
  };
}

export function listingModeratedEmail(opts: {
  listingTitre: string;
  listingHref: string;
  accepted: boolean;
  raison?: string | null;
}): { subject: string; html: string } {
  return {
    subject: opts.accepted
      ? `Votre annonce « ${opts.listingTitre} » est en ligne`
      : `Votre annonce « ${opts.listingTitre} » a été refusée`,
    html: layout(
      opts.accepted ? "Annonce publiée" : "Annonce refusée",
      opts.accepted
        ? p(`Votre annonce « ${opts.listingTitre} » est désormais visible sur le site.`)
        : p(`Votre annonce « ${opts.listingTitre} » n'a pas été validée.`) +
            (opts.raison ? p(`Motif : ${opts.raison}`) : ""),
      { label: opts.accepted ? "Voir l'annonce" : "Modifier l'annonce", href: `${SITE_URL}${opts.listingHref}` }
    ),
  };
}

export function reviewReceivedEmail(opts: { authorNom: string; note: number }): {
  subject: string;
  html: string;
} {
  return {
    subject: "Vous avez reçu un nouvel avis",
    html: layout(
      "Nouvel avis Pévèle",
      p(`<b>${opts.authorNom}</b> vous a laissé un avis (${opts.note}/5) sur votre page agence.`),
      { label: "Voir mon avis", href: `${SITE_URL}/compte` }
    ),
  };
}
