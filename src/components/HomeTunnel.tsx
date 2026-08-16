"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "who" | "particulier";

function ChoiceCard({
  emoji,
  title,
  desc,
  onClick,
  href,
}: {
  emoji: string;
  title: string;
  desc: string;
  onClick?: () => void;
  href?: string;
}) {
  const className =
    "group flex flex-col items-start gap-3 rounded-2xl border border-line bg-white p-7 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

  const content = (
    <>
      <span className="text-[34px] leading-none">{emoji}</span>
      <span className="font-display text-[19px] font-extrabold text-ink">
        {title}
      </span>
      <span className="font-sans text-[14px] leading-[1.5] text-muted">
        {desc}
      </span>
      <span className="mt-1 font-mono text-[11px] font-medium text-blue opacity-0 transition-opacity group-hover:opacity-100">
        C&apos;est parti →
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function HomeTunnel() {
  const [step, setStep] = useState<Step>("who");

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-8 px-6 py-14 sm:py-20">
      {step === "particulier" ? (
        <button
          type="button"
          onClick={() => setStep("who")}
          className="self-start font-mono text-[11px] font-medium text-blue"
        >
          ← Retour
        </button>
      ) : null}

      {step === "who" ? (
        <div className="animate-view-in flex flex-col gap-8">
          <div className="flex flex-col gap-2 text-center">
            <span className="text-[38px] leading-none">👋</span>
            <h1 className="m-0 font-display text-[34px] font-extrabold leading-tight text-ink sm:text-[42px]">
              Bienvenue sur Pévèle Immobilier
            </h1>
            <p className="mt-1 font-sans text-[15px] text-muted">
              Dites-nous qui vous êtes, on vous montre le bon chemin.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ChoiceCard
              emoji="🙋"
              title="Je suis un particulier"
              desc="Vous cherchez, vendez ou louez un bien pour vous-même."
              onClick={() => setStep("particulier")}
            />
            <ChoiceCard
              emoji="🏢"
              title="Je suis un professionnel"
              desc="Agence immobilière ou artisan, développez votre activité en Pévèle."
              href="/espace-professionnel"
            />
          </div>
        </div>
      ) : null}

      {step === "particulier" ? (
        <div className="animate-view-in flex flex-col gap-8">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="m-0 font-display text-[30px] font-extrabold leading-tight text-ink sm:text-[36px]">
              Quel est votre projet ?
            </h1>
            <p className="mt-1 font-sans text-[15px] text-muted">
              Choisissez ce qui vous correspond, vous pourrez toujours changer d&apos;avis.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ChoiceCard
              emoji="🏠"
              title="Vendre mon bien"
              desc="Estimez et publiez votre annonce en quelques minutes."
              href="/vendre"
            />
            <ChoiceCard
              emoji="🔍"
              title="Acheter ou louer, accompagné"
              desc="Répondez à quelques questions, on affine la recherche pour vous."
              href="/mon-projet"
            />
            <ChoiceCard
              emoji="👀"
              title="Jeter un œil"
              desc="Parcourir librement toutes les annonces, sans engagement."
              href="/acheter"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
