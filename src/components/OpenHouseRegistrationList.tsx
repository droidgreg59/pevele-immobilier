"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  respondToOpenHouseRegistrationAction,
  type OpenHouseDateFormState,
} from "@/lib/open-house-actions";

export type OpenHouseRegistrationItem = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  createdLabel: string;
  creneauLabel: string;
  listingTitre: string;
  listingHref: string;
  manageHref: string;
};

const initial: OpenHouseDateFormState = {};

function Row({ item }: { item: OpenHouseRegistrationItem }) {
  const [state, formAction, pending] = useActionState(
    respondToOpenHouseRegistrationAction,
    initial
  );

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-ink">
          {item.prenom} {item.nom}
        </span>
        <span className="text-[12px] text-muted-2">{item.createdLabel}</span>
      </div>
      <Link href={item.listingHref} className="text-[12.5px] font-semibold text-blue">
        {item.listingTitre} →
      </Link>
      <span className="text-[13px] text-ink">Portes ouvertes : {item.creneauLabel}</span>
      <div className="flex flex-wrap items-center gap-4 text-[12.5px] font-semibold text-blue">
        <a href={`tel:${item.telephone}`}>{item.telephone}</a>
        <a href={`mailto:${item.email}`}>{item.email}</a>
      </div>
      <form action={formAction} className="flex items-center gap-4">
        <input type="hidden" name="registrationId" value={item.id} />
        <button
          type="submit"
          name="decision"
          value="accept"
          disabled={pending}
          className="rounded-full bg-yellow px-3.5 py-2 text-[12.5px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95 disabled:opacity-60"
        >
          Accepter
        </button>
        <button
          type="submit"
          name="decision"
          value="refuse"
          disabled={pending}
          className="text-[12.5px] font-semibold text-muted hover:text-ink disabled:opacity-60"
        >
          Refuser
        </button>
        <Link href={item.manageHref} className="text-[12px] font-semibold text-muted hover:text-ink">
          Gérer →
        </Link>
      </form>
      {state.error ? (
        <p className="m-0 text-[12px] font-medium text-[#b3261e]">{state.error}</p>
      ) : null}
    </div>
  );
}

export default function OpenHouseRegistrationList({
  items,
}: {
  items: OpenHouseRegistrationItem[];
}) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      {items.map((item) => (
        <Row key={item.id} item={item} />
      ))}
    </div>
  );
}
