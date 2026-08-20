import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-cream px-6 py-5 pb-20 text-[12.5px] font-medium text-muted-2 md:pb-5">
      <span>© Pévèle-Immobilier.fr — l&apos;immobilier local de la Pévèle</span>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/espace-professionnel" className="text-blue">
          Vous êtes un professionnel ?
        </Link>
        <Link href="/" className="text-blue">
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </footer>
  );
}
