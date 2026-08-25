import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte particulier ou agence sur Pévèle Immobilier.",
};

const VALID_TYPES = ["PARTICULIER", "AGENCE", "ARTISAN"] as const;
type AccountType = (typeof VALID_TYPES)[number];

export default async function InscriptionPage({
  searchParams,
}: PageProps<"/inscription">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const rawType = typeof params.type === "string" ? params.type : undefined;
  const initialType: AccountType | undefined = VALID_TYPES.includes(
    rawType as AccountType
  )
    ? (rawType as AccountType)
    : undefined;

  return (
    <div className="animate-fade-up max-w-[640px] px-9 py-8">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Mon compte
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[44px]">
        Créer un compte
      </h1>
      <Link href="/" className="text-[13px] font-semibold text-blue">
        ← Retour à l&apos;accueil
      </Link>

      <p className="mt-6 max-w-[60ch] text-[14.5px] leading-[1.6] text-muted">
        Un compte particulier pour suivre vos annonces et vos favoris, ou un
        compte agence pour votre page professionnelle.
      </p>

      <div className="mt-7">
        <RegisterForm next={next} initialType={initialType} />
      </div>

      <p className="mt-6 text-[13.5px] text-muted">
        Déjà un compte ?{" "}
        <Link
          href={next ? `/connexion?next=${encodeURIComponent(next)}` : "/connexion"}
          className="text-blue"
        >
          Se connecter →
        </Link>
      </p>
    </div>
  );
}
