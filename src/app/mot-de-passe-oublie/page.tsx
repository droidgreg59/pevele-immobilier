import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description: "Réinitialisez le mot de passe de votre compte Pévèle Immobilier.",
  robots: { index: false, follow: true },
};

export default function MotDePasseOubliePage() {
  return (
    <div className="animate-fade-up max-w-[640px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[44px]">
        Mot de passe oublié
      </h1>
      <Link href="/connexion" className="text-[13px] font-semibold text-blue">
        ← Retour à la connexion
      </Link>

      <p className="mt-6 max-w-[52ch] text-[14.5px] leading-[1.6] text-muted">
        Indiquez l&apos;email de votre compte, nous vous enverrons un lien pour choisir un
        nouveau mot de passe.
      </p>

      <div className="mt-7">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
