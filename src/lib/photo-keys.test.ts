import { describe, it, expect } from "vitest";
import { isOwnStagedKey, listingKeyFromStaged, stagedPhotoKey, validateStagedKeys } from "./photo-keys";
import { maxPhotosFor } from "./photo-constants";

const UUID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const UUID2 = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("maxPhotosFor", () => {
  it("autorise 15 photos aux agences, 8 aux autres comptes", () => {
    expect(maxPhotosFor("AGENCE")).toBe(15);
    expect(maxPhotosFor("PARTICULIER")).toBe(8);
    expect(maxPhotosFor(undefined)).toBe(8);
  });
});

describe("isOwnStagedKey", () => {
  it("accepte une clé en attente de l'utilisateur", () => {
    expect(isOwnStagedKey(stagedPhotoKey("u1", UUID, "jpg"), "u1")).toBe(true);
  });
  it("refuse la clé d'un autre utilisateur, une clé d'annonce ou un chemin détourné", () => {
    expect(isOwnStagedKey(stagedPhotoKey("u2", UUID, "jpg"), "u1")).toBe(false);
    expect(isOwnStagedKey(`listings/abc/${UUID}.jpg`, "u1")).toBe(false);
    expect(isOwnStagedKey(`staging/u1/../u2/${UUID}.jpg`, "u1")).toBe(false);
    expect(isOwnStagedKey(`staging/u1/${UUID}.exe`, "u1")).toBe(false);
  });
});

describe("validateStagedKeys", () => {
  const k1 = stagedPhotoKey("u1", UUID, "jpg");
  const k2 = stagedPhotoKey("u1", UUID2, "webp");
  it("accepte des clés valides dans la limite", () => {
    expect(validateStagedKeys([k1, k2], "u1", 13, 15)).toBeNull();
  });
  it("refuse au-delà de la limite, photos existantes comprises", () => {
    expect(validateStagedKeys([k1, k2], "u1", 7, 8)).toBe("Maximum 8 photos par annonce.");
  });
  it("refuse les doublons et les clés étrangères", () => {
    expect(validateStagedKeys([k1, k1], "u1", 0, 15)).toBe("Photo en double.");
    expect(validateStagedKeys([stagedPhotoKey("u2", UUID, "jpg")], "u1", 0, 15)).not.toBeNull();
  });
});

describe("listingKeyFromStaged", () => {
  it("déplace le fichier sous le dossier de l'annonce", () => {
    expect(listingKeyFromStaged(stagedPhotoKey("u1", UUID, "jpg"), "L1")).toBe(`listings/L1/${UUID}.jpg`);
  });
});
