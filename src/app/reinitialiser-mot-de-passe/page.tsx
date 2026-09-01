import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe",
  description: "Choisissez un nouveau mot de passe pour votre compte Pévèle Immobilier.",
  robots: { index: false, follow: true },
};

export default async function ReinitialiserMotDePassePage({
  searchParams,
}: PageProps<"/reinitialiser-mot-de-passe">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <div className="animate-fade-up max-w-[640px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[44px]">
        Nouveau mot de passe
      </h1>
      <Link href="/connexion" className="text-[13px] font-semibold text-blue">
        ← Retour à la connexion
      </Link>

      {token ? (
        <div className="mt-7">
          <ResetPasswordForm token={token} />
        </div>
      ) : (
        <p className="mt-6 max-w-[52ch] text-[14.5px] leading-[1.6] text-muted">
          Ce lien est invalide.{" "}
          <Link href="/mot-de-passe-oublie" className="text-blue">
            Redemander un lien de réinitialisation →
          </Link>
        </p>
      )}
    </div>
  );
}
