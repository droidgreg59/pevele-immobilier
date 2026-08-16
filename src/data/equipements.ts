export const EQUIPEMENTS = [
  "Jardin",
  "Garage",
  "Parking",
  "Balcon",
  "Terrasse",
  "Cave",
  "Piscine",
  "Cheminée",
] as const;

export type Equipement = (typeof EQUIPEMENTS)[number];
