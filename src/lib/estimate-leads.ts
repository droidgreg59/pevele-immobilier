import "server-only";
import { prisma } from "./prisma";

export type EstimationLeadRow = {
  id: string;
  commune: string;
  villageSlug: string;
  surface: number;
  typeBien: string;
  dpe: string | null;
  estimLow: number;
  estimHigh: number;
  nom: string;
  email: string;
  telephone: string | null;
  traite: boolean;
  createdAt: Date;
};

export async function getEstimationLeads(limit = 200): Promise<EstimationLeadRow[]> {
  return prisma.estimationLead.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export async function getUntreatedEstimationLeadCount(): Promise<number> {
  return prisma.estimationLead.count({ where: { traite: false } });
}
