import { describe, it, expect } from "vitest";
import { listingRevivalFields } from "./listing-revival";

describe("listingRevivalFields", () => {
  it("relève une annonce RETIREE : repasse PUBLIEE et efface retiredAt", () => {
    expect(listingRevivalFields("RETIREE")).toEqual({ statut: "PUBLIEE", retiredAt: null });
  });

  it("ne touche rien pour une annonce déjà PUBLIEE", () => {
    expect(listingRevivalFields("PUBLIEE")).toEqual({});
  });

  it("ne touche rien pour EN_VERIFICATION ou REFUSEE (jamais le statut d'une annonce importée)", () => {
    expect(listingRevivalFields("EN_VERIFICATION")).toEqual({});
    expect(listingRevivalFields("REFUSEE")).toEqual({});
  });
});
