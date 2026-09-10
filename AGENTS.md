<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Pévèle-Immobilier.fr — contexte projet

Site immobilier de référence pour la région de la Pévèle (Nord). Next.js 16 App Router, TypeScript,
Tailwind v4, Prisma + SQLite, auth JWT maison (`jose`, cookies de session). **Toute mutation passe par une
Server Action** (`"use server"` + `FormData`) — pas de routes REST/Express classiques, sauf les endpoints
`/api/cron/*` (protégés par `CRON_SECRET`, voir README) et `/api/session`.

### Fichiers locaux à transférer manuellement entre machines

`.env`, `prisma/dev.db` et `public/uploads/` sont **volontairement exclus de git** (`.gitignore`) — ils ne
suivent jamais un `git clone`/`pull`. En changeant de machine, les copier à part (jamais via le chat — ce
sont des secrets et des données réelles). `.env` contient tous les secrets (Resend, Turnstile, Cloudflare
beacon, cron, `AUTH_SECRET`) ; `dev.db` est la vraie base (utilisateurs, annonces) ; `public/uploads/`
contient les photos des annonces (structure : `uploads/listings/<id>/*.jpg`, `uploads/logos/...`).

### Discipline « données réelles uniquement »

Toute donnée de référence ajoutée (commerces/écoles/transports par village, mode de chauffage, type de
maison, mentions légales…) doit venir d'une source vérifiable — jamais inventée. Sources déjà utilisées :
flux XML AC3/Immofacile de l'agence (inspecté en direct via un script Node avant d'écrire le moindre
mapping — ne jamais deviner un nom de balise), OpenStreetMap/Overpass API (commerces, transports),
annuaire officiel de l'Éducation nationale (écoles, filtré `etat === "OUVERT"`), API publique Géorisques
(`georisques.gouv.fr/api/v1`, état des risques par commune — endpoints inspectés en direct avant mapping,
`src/lib/georisques.ts`), et les faits fournis directement par l'utilisateur (raison sociale, adresse…). Pour un fait légal non confirmé, utiliser le
composant `<ACompleter>` (`[À COMPLÉTER : ...]`) plutôt que d'inventer une valeur plausible — les pages
concernées (`/mentions-legales`, `/confidentialite`, `/cgu`) sont volontairement `noindex` tant que des
`<ACompleter>` y subsistent.

Le badge « Agence vérifiée » n'est jamais posé automatiquement : l'agence soumet son SIRET et son
numéro de carte professionnelle (carte T), et un administrateur valide à la main depuis
`/admin/verifications` (`User.verifStatut`). La raison sociale officielle est récupérée en best-effort
sur `recherche-entreprises.api.gouv.fr` mais ne fait pas foi.

### Observabilité

Trois briques distinctes, à ne pas confondre :
- **Audience** — Cloudflare Web Analytics (`src/app/layout.tsx`, sur `CF_BEACON_TOKEN`) : pages vues,
  référents, Web Vitals. Pas d'API d'évènement.
- **Entonnoir produit** — modèle `Event` + `logEvent(name, …)` (`src/lib/events.ts`), appelé en
  « fire and forget » (jamais `throw`, toujours `await` avant un `return`/`redirect`) dans les Server
  Actions aux étapes clés. Lu par `/admin/stats`. Ajouter un `EventName` à l'union **et** à
  `EVENT_LABELS` (`src/lib/admin-stats.ts`) quand on instrumente une nouvelle étape.
- **Erreurs** — `src/lib/report-error.ts` poste une enveloppe Sentry **sans SDK** (dépendances = 0),
  branché via `src/instrumentation.ts` (serveur) et `src/instrumentation-client.ts` +
  `src/app/global-error.tsx` (client). No-op tant que `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` sont
  vides. Pas de symbolication des stacks minifiées — c'est le compromis assumé du « sans SDK ».

### Cache / ISR

Les lectures DVF (`src/lib/dvf.ts`, sauf `getRecentDvfTransactions` qui renvoie des `Date`) sont
enveloppées dans `unstable_cache` avec le tag `dvf` et une revalidation d'une semaine — la route cron
`/api/cron/dvf-import` appelle `revalidateTag("dvf", "max")` après réécriture. Les pages `/prix` et
`/prix/[commune]` sont en ISR (`export const revalidate`, + `generateStaticParams` pour les 38
communes). `/villages/[slug]`, `/carte` et `/immobilier/[commune]/[intent]` restent dynamiques (session
pour les favoris, `searchParams`) mais ne tapent plus la base pour les DVF. Rendre ces trois-là
statiques demanderait d'hydrater l'état « favori » côté client — chantier à part.

### Tests

`npm test` (Vitest, `vitest.config.ts`) — tests co-localisés `src/**/*.test.ts`, ciblés sur les
fonctions pures / la logique (validation, barèmes coût d'achat, slugify, format, parsing des
`searchParams`, `where` Prisma des recherches, JSON-LD, invariants du jeu de communes). **Pas de
tests qui touchent la base ou le réseau.** `import "server-only"` est neutralisé dans les tests via
un alias vers `test/stubs/server-only.ts`. La CI (`.github/workflows/ci.yml`, sur chaque PR + master)
enchaîne `lint` → `tsc --noEmit` → `test` → `build`, avec une SQLite vide créée par `prisma db push`
(le build exécute `sitemap.ts` qui interroge la base).

### Pièges d'environnement rencontrés

- **`prisma db push` dans un pipe masque les échecs** : `... | tail -20 && npx prisma generate` continue
  même si `db push` échoue (ex. contrainte unique nécessitant `--accept-data-loss`), car le code de sortie
  du pipe est celui de `tail`. Toujours lancer `prisma db push` sans pipe, ou vérifier son sortie
  explicitement.
- **Windows uniquement — verrou de fichier à la régénération du client Prisma** : `npx prisma generate`
  peut échouer avec `EPERM` sur `query_engine-windows.dll.node` si le serveur dev tourne encore. Arrêter le
  serveur dev avant tout `prisma db push`/`generate`, le relancer après.
- **`.next/dev/types/routes.d.ts` peut se corrompre** après une activité concurrente du serveur dev,
  provoquant des erreurs `tsc`/`build` incompréhensibles sans rapport avec le code réel. Arrêter le
  serveur, `rm -rf .next`, reconstruire.
- **`import "server-only"`** casse tout module aussi importé par un script CLI (`npx tsx scripts/...`),
  car ce n'est pas un contexte serveur Next.js. Omettre ce guard dans les modules `src/lib/*` qui doivent
  rester utilisables depuis un script (ex. `dvf-import.ts`, `cron-auth.ts` en gardent un car eux ne sont
  appelés que depuis des route handlers — vérifier au cas par cas).
- **Limite de taille des Server Actions** : `next.config.ts` fixe `serverActions.bodySizeLimit`
  dynamiquement à partir de `MAX_PHOTOS`/`MAX_PHOTO_BYTES` (`src/lib/photo-constants.ts`) — la valeur par
  défaut de Next.js (1 Mo) est bien trop basse pour l'upload de photos d'annonce et provoquait un
  "Failed to fetch" silencieux au dépôt d'annonce.
- **Instabilité observée du Browser pane de Claude Code sur la machine de dev Windows** (a fait planter
  l'application Claude au moins une fois, 2026-09-02) — pas encore confirmée ou infirmée sur macOS.
  Si le Browser pane semble instable (pane "hidden" avec viewport 0x0, navigations refusées, ou crash de
  l'app), arrêter de l'utiliser et vérifier plutôt via `curl` sur le serveur dev, les logs
  (`.next/dev/logs/next-development.log` ou le fichier de sortie d'une tâche en arrière-plan),
  `npx tsc --noEmit` / `npm run build` / `npm run lint`, et demander une confirmation visuelle manuelle à
  l'utilisateur pour tout ce qui nécessite un vrai rendu/interaction JS.
