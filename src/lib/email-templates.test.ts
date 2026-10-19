import { describe, it, expect } from "vitest";
import { newListingToModerateEmail } from "./email-templates";

const base = {
  titre: "Maison <b>test</b> & Cie",
  prix: 312000,
  transaction: "VENTE" as const,
  typeBien: "MAISON",
  commune: "Baisieux",
  ownerLabel: 'Agence "X" <img src=x>',
  ownerType: "AGENCE",
  ownerUnverifiedAgency: true,
  photos: 3,
};

describe("newListingToModerateEmail", () => {
  it("échappe le HTML saisi par le déposant et résume l'annonce", () => {
    const { subject, html } = newListingToModerateEmail(base);
    expect(subject).toBe("Nouvelle annonce à modérer : Maison <b>test</b> & Cie");
    expect(html).toContain("Maison &lt;b&gt;test&lt;/b&gt; &amp; Cie");
    expect(html).toContain("Agence &quot;X&quot; &lt;img src=x&gt;");
    expect(html).not.toContain("<img src=x>");
    expect(html).toContain("Baisieux");
    expect(html).toContain("3 photos");
    expect(html).toContain("/admin/annonces");
  });

  it("signale une agence non vérifiée, et seulement dans ce cas", () => {
    expect(newListingToModerateEmail(base).html).toContain("pas encore vérifiée");
    expect(newListingToModerateEmail({ ...base, ownerUnverifiedAgency: false }).html).not.toContain(
      "pas encore vérifiée"
    );
  });
});
