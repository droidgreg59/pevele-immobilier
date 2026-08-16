import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-cream px-6 py-5 font-mono text-[10.5px] font-medium text-muted-2">
      <span>© Pévèle-Immobilier.fr — l&apos;immobilier local de la Pévèle</span>
      <Link href="/" className="text-blue">
        ← Retour à l&apos;accueil
      </Link>
    </footer>
  );
}
