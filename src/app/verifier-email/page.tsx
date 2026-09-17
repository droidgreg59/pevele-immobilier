import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailToken } from "@/lib/auth-actions";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vérification de l'adresse email",
  robots: { index: false, follow: false },
};

export default async function VerifierEmailPage({
  searchParams,
}: PageProps<"/verifier-email">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const [outcome, session] = await Promise.all([verifyEmailToken(token), getSession()]);

  const { titre, message } =
    outcome === "ok"
      ? {
          titre: "Adresse confirmée",
          message: "Merci, votre adresse email est vérifiée. Vous avez accès à toutes les fonctionnalités.",
        }
      : outcome === "already"
        ? {
            titre: "Déjà confirmée",
            message: "Cette adresse email était déjà vérifiée.",
          }
        : {
            titre: "Lien invalide ou expiré",
            message:
              "Ce lien de vérification n'est plus valable. Reconnectez-vous à votre compte pour en demander un nouveau.",
          };

  return (
    <div className="animate-fade-up mx-auto max-w-[560px] px-9 py-16">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-blue">
        Vérification
      </span>
      <h1 className="mt-3 font-display text-[32px] text-ink sm:text-[38px]">{titre}</h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-muted">{message}</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          href={session ? "/compte" : "/connexion"}
          className="rounded-full bg-yellow px-5 py-3 text-[13px] font-semibold text-ink shadow-sm transition hover:shadow-md hover:brightness-95"
        >
          {session ? "Aller à mon compte" : "Se connecter"}
        </Link>
        <Link href="/" className="text-[13px] font-semibold text-blue">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
