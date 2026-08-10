import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Se connecter — Pévèle Immobilier",
  description: "Connectez-vous à votre compte Pévèle Immobilier.",
};

export default function ConnexionPage() {
  return (
    <div className="animate-view-in max-w-[640px] px-9 py-8">
      <span className="border-2 border-blue px-3 py-1.5 font-mono text-sm text-blue">
        MON COMPTE
      </span>
      <h1 className="mt-3 font-display text-[36px] text-ink sm:text-[44px]">
        SE CONNECTER
      </h1>
      <Link href="/" className="font-mono text-[11.5px] font-medium text-blue">
        ← RETOUR AU PLAN
      </Link>

      <div className="mt-7">
        <LoginForm />
      </div>

      <p className="mt-6 font-mono text-[11.5px] text-muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-blue">
          Créer un compte →
        </Link>
      </p>
    </div>
  );
}
