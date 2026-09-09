import { describe, it, expect } from "vitest";
import {
  isValidPhoneNumber,
  isValidSiret,
  normalizeSiret,
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
