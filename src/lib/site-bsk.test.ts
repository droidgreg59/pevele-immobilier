import { describe, expect, it } from "vitest";
import { bskBiensPageUrl, bskListingUrls, isBskAgentPage, parseBskListing } from "./site-bsk";

const URL = "https://bskimmobilier.com/bien/cysoing/maison-ancienne-de-134-m/350868";
const IMG = "https://d3co7sr323ligs.cloudfront.net/data/ads";

// Extrait de la fiche réelle 350868 (Virginie Chauchoy, relevée le 2026-11-17).
const fiche = (overrides: { banner?: string; location?: string; h1?: string; mentions?: string } = {}) => `
<meta property="og:image" content="${IMG}/c72beeac-9bb2/1ec1/c/main-branded.jpg" />
<img alt="Entrée.jpg" data-src="${IMG}/c72beeac-9bb2/1ec1/c/main-branded.jpg"/>
<img alt="Salon.jpg" data-src="${IMG}/c72beeac-9bb2/5eb2/c/salon-branded.jpg"/>
<img alt="Entrée.jpg" data-src="${IMG}/c72beeac-9bb2/1ec1/c/main-branded.jpg"/>
<img alt="Similaire" data-src="${IMG}/80ad2398-10da/a9cc/c/autre-branded.jpg"/>
<span class="section-photo-banner banner banner-exclusivite"> ${overrides.banner ?? "Exclusivité"} </span>
<div class="property-title"> <h1>${overrides.h1 ?? "Maison ancienne de 134 m² à Cysoing"}</h1> </div>
<div class="property-price"> 339 000 &euro; </div>
<div class="property-location"> ${overrides.location ?? "59830 Cysoing"} </div>
<ul class="property-info-list">
<li class="property-info-list-item property-info-room"> <span class="icon-container"><i class="icon"></i></span> 6 pièces </li>
<li class="property-info-list-item property-info-bedroom"> <span class="icon-container"><i class="icon"></i></span> 4 chambres </li>
<li class="property-info-list-item property-info-surface"> <span class="icon-container"><i class="icon"></i></span> 134 m² </li>
</ul>
<div class="section section-description"> <h2 class="section-label"> Maison flamande à Cysoing </h2>
<p class="property-description"> Laissez-vous séduire par cette maison d&#039;exception.<br /> <br /> Côté technique : gaz.<br/>
${overrides.mentions ?? `Cette annonce référence 350868 vous est présentée par votre agent commercial BSK Immobilier.<br />
Prix du bien : 339 000,00 €<br />Les honoraires d'agence sont à la charge du vendeur.<br />
Date de réalisation du diagnostic énergétique : 03/09/2026<br />CLASSE ÉNERGIE : D (206 kWhEP/m²/an)<br />
CLASSE CLIMAT : D (45 kg CO2/m²/an)<br />Montant estimé des dépenses annuelles d'énergie pour un usage standard : entre 2 460 € et 3 380 € par an. Prix moyens des énergies indexés sur l'année 2023 (abonnements compris).`}
</p></div>
<ul class="property-caracteristic-list">
<li class="property-caracteristic-list-item property-caracteristic-exposition"> <span class="icon-container"><i class="icon"></i></span> <span>Exposition Sud</span> </li>
<li class="property-caracteristic-list-item property-caracteristic-terrace"> <span>Terrasse</span> </li>
<li class="property-caracteristic-list-item property-caracteristic-chimney"> Cheminée </li>
<li class="property-caracteristic-list-item property-caracteristic-transport-station"> Transport / Station </li>
</ul>`;

describe("BSK Immobilier", () => {
  it("reconnaît la page de l'agent et ses propres fiches", () => {
    expect(isBskAgentPage("https://bskimmobilier.com/chauchoy-virginie-10228")).toBe(true);
    expect(isBskAgentPage("https://bskimmobilier.com/bien/selection")).toBe(false);
    const page = `<a href="${URL}?from=agent">x</a><a href="https://bskimmobilier.com/bien/gruson/maison/1">similaire</a>
      <a href="https://bskimmobilier.com/virginie-chauchoy-10228/biens">Voir tous les biens</a>`;
    expect(bskListingUrls(page)).toEqual([URL]);
    expect(bskBiensPageUrl(page)).toBe("https://bskimmobilier.com/virginie-chauchoy-10228/biens");
  });

  it("convertit une fiche en annonce", () => {
    const res = parseBskListing(fiche(), URL);
    if (!res || !("listing" in res)) throw new Error("écartée");
    expect(res.listing).toMatchObject({
      externalRef: "350868",
      transaction: "VENTE",
      typeBien: "MAISON",
      titre: "Maison flamande à Cysoing",
      prix: 339000,
      villageSlug: "cysoing",
      pieces: 6,
      chambres: 4,
      surface: 134,
      equipements: "Terrasse,Cheminée",
      exterieur: "TERRASSE",
      exposition: "sud",
      dpe: "D",
      ges: "D",
      dpeConsommation: 206,
      dpeEmissions: 45,
      dpeCoutMin: 2460,
      dpeCoutMax: 3380,
      dpeCoutAnneeRef: 2023,
      honoraires: null,
      honorairesCharge: "vendeur",
    });
    expect(res.listing.description).toBe("Laissez-vous séduire par cette maison d'exception.\nCôté technique : gaz.");
    // Photos du bien seulement (pas celles des biens similaires), sans doublon.
    expect(res.listing.photoUrls).toEqual([
      `${IMG}/c72beeac-9bb2/1ec1/c/main-branded.jpg`,
      `${IMG}/c72beeac-9bb2/5eb2/c/salon-branded.jpg`,
    ]);
  });

  it("calcule les honoraires à la charge de l'acquéreur", () => {
    const res = parseBskListing(
      fiche({ mentions: "Cette annonce référence 350868. Honoraires à la charge de l'acquéreur. Prix hors honoraires : 325 000 €." }),
      URL
    );
    if (!res || !("listing" in res)) throw new Error("écartée");
    expect(res.listing).toMatchObject({ honoraires: 14000, honorairesCharge: "acquereur" });
  });

  it("écarte les biens hors Pévèle, vendus ou illisibles", () => {
    expect(parseBskListing(fiche({ location: "59000 Lille" }), URL)).toMatchObject({ reason: "hors Pévèle (Lille)" });
    expect(parseBskListing(fiche({ banner: "Sous compromis" }), URL)).toMatchObject({
      reason: "indisponible (Sous compromis)",
    });
    expect(parseBskListing("<html>maintenance</html>", URL)).toBeNull();
  });
});
