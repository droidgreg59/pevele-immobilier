import Link from "next/link";
import { villages } from "@/data/villages";

// Lien vers les 44 fiches communes depuis chaque page : l'accueil n'en lie
// que 8, et ces fiches sont les pages d'atterrissage des requêtes
// « immobilier <commune> » (audit SEO 2026-10-30).
const VILLAGES_ALPHA = [...villages].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

export default function Footer() {
  return (
    <footer className="mt-6 border-t border-line bg-cream px-6 py-5 pb-20 text-[12.5px] font-medium text-muted-2 md:pb-5">
      <nav aria-label="Immobilier par commune">
        <h2 className="m-0 text-[12.5px] font-semibold text-muted">
          L&apos;immobilier commune par commune
        </h2>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {VILLAGES_ALPHA.map((v) => (
            <li key={v.slug}>
              <Link href={`/villages/${v.slug}`} className="hover:text-blue">
                {v.nom}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span>© Pévèle-Immobilier.fr — la référence de l&apos;immobilier en Pévèle</span>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/espace-professionnel" className="text-blue">
            Vous êtes un professionnel ?
          </Link>
          <Link href="/guides" className="text-blue">
            Guides
          </Link>
          <Link href="/comparer" className="text-blue">
            Comparateur
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
      </div>
    </footer>
  );
}
