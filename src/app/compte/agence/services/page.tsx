import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AGENCY_SERVICES } from "@/data/agency-services";
import ServiceRequestForm from "@/components/ServiceRequestForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

export default async function AgenceServicesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion?next=/compte/agence/services");
  if (session.type !== "AGENCE") redirect("/compte");

  const agency = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { telephone: true },
  });

  return (
    <div>
      <h2 className="m-0 font-display text-[24px] text-ink">Services pour votre agence</h2>
      <p className="m-0 mt-1 max-w-[64ch] text-[14px] leading-[1.6] text-muted">
        Deux services à prix fixe, réalisés par Galt Lab, l&apos;équipe qui a conçu
        Pévèle-Immobilier.fr. Demandez un rendez-vous : nous définissons ensemble ce que vous
        voulez avant de démarrer.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {AGENCY_SERVICES.map((s) => (
          <section
            key={s.id}
            className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 shadow-sm"
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-blue">{s.nom}</span>
              <h3 className="m-0 mt-1.5 font-display text-[22px] leading-tight text-ink">{s.accroche}</h3>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-[36px] leading-none text-ink">{s.prix}</span>
              <span className="text-[13px] font-semibold text-muted">{s.rythme}</span>
              {s.delai ? (
                <span className="rounded-full bg-blue-soft px-3 py-1 text-[12px] font-semibold text-blue">
                  {s.delai}
                </span>
              ) : null}
            </div>
            <p className="m-0 text-[14px] leading-[1.6] text-muted">{s.pitch}</p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {s.inclus.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              <ServiceRequestForm serviceId={s.id} defaultTelephone={agency?.telephone ?? ""} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
