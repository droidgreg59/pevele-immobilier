import { describe, it, expect } from "vitest";
import {
  isValidPhoneNumber,
  isValidSiret,
  normalizeSiret,
  isValidOrias,
  normalizeOrias,
  normalizeUrl,
  isValidHttpUrl,
  todayDateString,
  isDateAfterToday,
  tomorrowDateString,
} from "./validation";

describe("isValidPhoneNumber", () => {
  it("accepte un mobile/fixe français à 10 chiffres", () => {
    expect(isValidPhoneNumber("0612345678")).toBe(true);
    expect(isValidPhoneNumber("0320123456")).toBe(true);
  });

  it("tolère espaces, points, tirets, parenthèses", () => {
    expect(isValidPhoneNumber("06 12 34 56 78")).toBe(true);
    expect(isValidPhoneNumber("03.20.12.34.56")).toBe(true);
    expect(isValidPhoneNumber("06-12-34-56-78")).toBe(true);
    expect(isValidPhoneNumber("(06) 12 34 56 78")).toBe(true);
  });

  it("accepte l'indicatif +33", () => {
    expect(isValidPhoneNumber("+33612345678")).toBe(true);
  });

  it("refuse un numéro trop court, trop long ou commençant par 00/+330", () => {
    expect(isValidPhoneNumber("061234567")).toBe(false);
    expect(isValidPhoneNumber("06123456789")).toBe(false);
    expect(isValidPhoneNumber("0012345678")).toBe(false);
    expect(isValidPhoneNumber("+330612345678")).toBe(false);
    expect(isValidPhoneNumber("")).toBe(false);
    expect(isValidPhoneNumber("pas un numéro")).toBe(false);
  });
});

describe("isValidSiret", () => {
  it("valide un SIRET dont la clé de Luhn est bonne (La Poste, 356 000 000 00048)", () => {
    expect(isValidSiret("35600000000048")).toBe(true);
    expect(isValidSiret("356 0000 0000 048")).toBe(true);
  });

  it("refuse une longueur incorrecte ou des non-chiffres", () => {
    expect(isValidSiret("3560000000004")).toBe(false);
    expect(isValidSiret("356000000000480")).toBe(false);
    expect(isValidSiret("3560000000004X")).toBe(false);
  });

  it("refuse un SIRET de 14 chiffres à clé de Luhn invalide", () => {
    expect(isValidSiret("35600000000047")).toBe(false);
    expect(isValidSiret("00000000000001")).toBe(false);
  });
});

describe("normalizeSiret", () => {
  it("ne garde que les chiffres", () => {
    expect(normalizeSiret("356 0000 0000 048")).toBe("35600000000048");
    expect(normalizeSiret("siret: 123-456")).toBe("123456");
  });
});

describe("isValidOrias", () => {
  it("accepte 5 à 10 chiffres, espaces tolérés", () => {
    expect(isValidOrias("12345")).toBe(true);
    expect(isValidOrias("1234567890")).toBe(true);
    expect(isValidOrias("12 345 678")).toBe(true);
  });

  it("refuse moins de 5 ou plus de 10 chiffres, ou des non-chiffres", () => {
    expect(isValidOrias("1234")).toBe(false);
    expect(isValidOrias("12345678901")).toBe(false);
    expect(isValidOrias("ORIAS123")).toBe(false);
    expect(isValidOrias("")).toBe(false);
  });
});

describe("normalizeOrias", () => {
  it("ne garde que les chiffres", () => {
    expect(normalizeOrias("12 345 678")).toBe("12345678");
    expect(normalizeOrias("ORIAS 12345")).toBe("12345");
  });
});

describe("normalizeUrl", () => {
  it("ajoute https:// devant un domaine saisi sans schéma", () => {
    expect(normalizeUrl("www.pvl-immobilier.fr")).toBe("https://www.pvl-immobilier.fr");
    expect(normalizeUrl("pvl-immobilier.fr")).toBe("https://pvl-immobilier.fr");
  });

  it("laisse intact ce qui a déjà un schéma http(s), quelle que soit la casse", () => {
    expect(normalizeUrl("https://pvl-immobilier.fr")).toBe("https://pvl-immobilier.fr");
    expect(normalizeUrl("http://pvl-immobilier.fr")).toBe("http://pvl-immobilier.fr");
    expect(normalizeUrl("HTTPS://pvl-immobilier.fr")).toBe("HTTPS://pvl-immobilier.fr");
  });

  it("rogne les espaces et laisse une valeur vide vide", () => {
    expect(normalizeUrl("  www.pvl-immobilier.fr  ")).toBe("https://www.pvl-immobilier.fr");
    expect(normalizeUrl("   ")).toBe("");
    expect(normalizeUrl("")).toBe("");
  });
});

describe("isValidHttpUrl", () => {
  it("accepte une URL http(s) absolue", () => {
    expect(isValidHttpUrl("https://pvl-immobilier.fr")).toBe(true);
    expect(isValidHttpUrl("http://pvl-immobilier.fr")).toBe(true);
  });

  it("refuse un domaine sans schéma, une chaîne vide, ou un autre protocole", () => {
    expect(isValidHttpUrl("www.pvl-immobilier.fr")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
    expect(isValidHttpUrl("ftp://pvl-immobilier.fr")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("dates", () => {
  it("todayDateString est au format YYYY-MM-DD", () => {
    expect(todayDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("tomorrow est strictement après today, et postérieur à aujourd'hui", () => {
    expect(tomorrowDateString() > todayDateString()).toBe(true);
    expect(isDateAfterToday(tomorrowDateString())).toBe(true);
  });

  it("isDateAfterToday est faux pour aujourd'hui et pour le passé", () => {
    expect(isDateAfterToday(todayDateString())).toBe(false);
    expect(isDateAfterToday("2000-01-01")).toBe(false);
  });
});
