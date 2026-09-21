import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-cream px-6 py-5 pb-20 text-[12.5px] font-medium text-muted-2 md:pb-5">
      <span>© Pévèle-Immobilier.fr — la référence de l&apos;immobilier en Pévèle</span>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/espace-professionnel" className="text-blue">
          Vous êtes un professionnel ?
        </Link>
        <Link href="/guides" className="text-blue">
          Guides
        </Link>
        <Link href="/methodologie" className="text-blue">
          Méthodologie
        </Link>
        <Link href="/mentions-legales" className="text-blue">
          Mentions légales
        </Link>
        <Link href="/confidentialite" className="text-blue">
          Confidentialité
        </Link>
        <Link href="/cgu" className="text-blue">
          CGU
        </Link>
        <Link href="/" className="text-blue">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </footer>
  );
}
