import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Se connecter",
  description: "Connectez-vous à votre compte Pévèle Immobilier.",
};

export default async function ConnexionPage({
  searchParams,
}: PageProps<"/connexion">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;

  return (
    <div className="animate-fade-up max-w-[640px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[44px]">
        Se connecter
      </h1>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <div className="mt-7">
        <LoginForm next={next} />
      </div>

      <p className="mt-6 text-[13.5px] text-muted">
        Pas encore de compte ?{" "}
        <Link
          href={next ? `/inscription?next=${encodeURIComponent(next)}` : "/inscription"}
          className="text-blue"
        >
          Créer un compte →
        </Link>
      </p>
    </div>
  );
}
