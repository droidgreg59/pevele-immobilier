# Pévèle Immobilier — dossier de passation front-end / design

Ce document s'adresse à quelqu'un qui va retravailler **uniquement l'interface**
(mise en page, style, composants visuels) sans toucher à la logique serveur,
aux formulaires fonctionnels ni au modèle de données. Il explique le produit,
la structure du code, le système de design actuel, et où sont les limites à
ne pas franchir sans casser une fonctionnalité.

---

## 1. Le produit

**Pévèle Immobilier** est une marketplace immobilière **locale** : toutes les
annonces (agences ET particuliers) de la Pévèle, un micro-territoire au sud de
Lille (19 communes), réunies au même endroit. L'ambition affichée est d'être
« le portail local » plutôt qu'un concurrent des agences — les agences ont
intérêt à y être présentes plutôt qu'à en être exclues.

Trois types de comptes utilisateurs, avec des parcours différents :

- **Particulier** — cherche un bien, dépose une annonce en direct, sauvegarde
  des recherches, contacte des artisans.
- **Agence** — publie ses annonces (à la main ou via import XML automatique
  depuis son logiciel métier), reçoit des demandes de particuliers, gère des
  clients.
- **Artisan** — figure dans un annuaire par métier (couverture, électricité,
  etc.), reçoit des demandes de devis.

Un quatrième rôle, **administrateur**, existe uniquement en interne (pas de
lien dans la navigation publique) pour valider ou refuser les annonces avant
publication.

Le site est **entièrement en français**, y compris dans le code (noms de
variables métier, commentaires, contenus).

---

## 2. Stack technique (pour situer, pas pour intervenir)

- **Next.js 16** (App Router) + **TypeScript**, React 19.
- **Tailwind CSS v4** — configuré via `@theme inline` dans
  [`src/app/globals.css`](src/app/globals.css), pas de fichier
  `tailwind.config.ts` séparé.
- **Prisma + SQLite** côté base de données (fichier local, pas de service
  externe).
- Authentification maison (cookie de session signé), pas de librairie type
  NextAuth.

### Lancer le projet en local

```bash
npm install
npm run dev
```

Le site tourne sur `http://localhost:3000`. Comptes de démonstration (mot de
passe `demo1234` pour tous) :

| Rôle | Email |
|---|---|
| Agence (avec annonces + import XML actif) | `pvl-immobilier@example.com` |
| Agence | `partenaire@example.com` |
| Particulier | `demo@example.com` |
| Artisan | `artisan-couverture@example.com` |
| Administrateur (modération) | `admin@pevele-immobilier.fr` |

`npm run build` et `npm run lint` doivent rester propres après toute
modification.

---

## 3. Structure du dépôt

```
src/
  app/            → une route par dossier (App Router). Chaque page.tsx est
                    un Server Component qui va chercher les données puis les
                    passe à des composants d'affichage.
  components/     → composants réutilisables (cartes, formulaires, listes).
                    Certains sont "use client" (interactifs), d'autres non.
  lib/            → TOUTE la logique métier : accès base de données, Server
                    Actions (mutations), session/auth, calculs DVF, etc.
                    → C'est le "backend" du projet. Ne pas modifier pour un
                      travail purement visuel.
  data/           → données statiques en dur : liste des 19 villages, packs
                    tarifaires, catégories d'artisans, liste d'équipements.
prisma/
  schema.prisma   → modèle de données (source de vérité des types).
  migrations/     → historique des migrations SQL.
  seed.ts         → jeu de données de démonstration.
public/
  uploads/        → photos et logos uploadés (générés à l'exécution, pas
                    versionnés).
```

---

## 4. Système de design actuel

Le site a déjà été redessiné une fois vers un style "SaaS moderne" (cartes
arrondies, ombres douces, plus de bordures/ombres dures façon plan
d'architecte). C'est la base à partir de laquelle retravailler.

### 4.1 Tokens couleur

Définis une seule fois dans `:root` de
[`src/app/globals.css`](src/app/globals.css), puis remappés en classes
Tailwind via `@theme inline` :

| Variable CSS | Classe Tailwind | Valeur | Usage |
|---|---|---|---|
| `--pvl-ink` | `text-ink` / `bg-ink` | `#22242c` | Texte principal, fonds sombres |
| `--pvl-blue` | `text-blue` / `bg-blue` | `#2743a6` | Couleur de marque, liens, accents |
| `--pvl-yellow` | `bg-yellow` | `#f5b52e` | CTA principal (boutons pilule) |
| `--pvl-cream` | `bg-cream` | `#fafafa` | Fond de page |
| `--pvl-muted` | `text-muted` | `#6b6e7e` | Texte secondaire |
| `--pvl-muted-2` | `text-muted-2` | `#9da2b3` | Texte tertiaire / placeholder |
| `--pvl-green` | `text-green` | `#417c3e` | Signal positif (baisse de prix, avis) |
| `--pvl-gold` | `text-gold` | `#b08a2e` | Badge "particulier" / accents secondaires |
| `--pvl-line` | `border-line` | `#e9e9ec` | Bordures fines |
| `--pvl-surface` | `bg-surface` | `#f4f4f6` | Fond de carte / section "posée" |

**Important pour un futur retravail visuel** : ces noms de variable sont
référencés à **~60 endroits** dans le code via des styles inline
`style={{ background: "var(--pvl-blue)" }}` (utile quand une couleur dépend
d'une donnée, ex. badge agence vs particulier), en plus des classes Tailwind
`bg-blue`/`text-ink`/etc. **Ne jamais renommer un token** — changer uniquement
sa valeur hex, ou en ajouter un nouveau, pour ne rien casser.

### 4.2 Typographie

- `--font-display` et `--font-sans` → **Archivo** (Google Font, chargée dans
  [`src/app/layout.tsx`](src/app/layout.tsx), poids 400 à 800).
- `--font-mono` → **IBM Plex Mono**, utilisée pour les petits labels, badges,
  nav — texte généralement en petites majuscules avec `tracking` large. C'est
  un choix esthétique volontaire ("détail tech"), pas un oubli.

### 4.3 Motif de composants récurrents

| Élément | Classes types |
|---|---|
| Carte | `rounded-2xl border border-line bg-white shadow-sm` (+ `hover:shadow-md hover:-translate-y-0.5 transition` si cliquable) |
| Bouton principal | `rounded-full bg-yellow px-6 py-3.5 font-mono text-xs font-semibold shadow-sm hover:brightness-95 hover:shadow-md transition` |
| Bouton secondaire | `rounded-full border border-line px-5 py-3 text-sm font-semibold hover:bg-surface transition` |
| Champ de formulaire | `rounded-xl border border-line bg-white px-4 py-3 focus:border-blue focus:ring-2 focus:ring-blue/15 transition` |
| Badge/tag | `rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[11px] font-medium` |

### 4.4 Emojis et animations

Emojis utilisés comme icônes légères (tunnel d'accueil, page espace pro) —
pas de librairie d'icônes installée. Quelques animations CSS nommées dans
`globals.css` (`animate-view-in`, `animate-draw-in`, `animate-pin-pulse`,
`animate-stamp-in`) réutilisées un peu partout pour les transitions d'entrée
de page/carte.

---

## 5. Cartographie des routes

### Pages publiques

| Route | Contenu | Fichier | Composants clés |
|---|---|---|---|
| `/` | Tunnel d'accueil "vous êtes particulier ou pro ?" | `src/app/page.tsx` | `HomeTunnel.tsx` |
| `/acheter` | Liste des annonces à vendre, filtres (village, budget, chambres, équipements, type de bien) | `src/app/acheter/page.tsx` | `ListingsBrowser.tsx`, `ListingCard.tsx` |
| `/acheter/[id]` | Fiche annonce (vente) | `src/app/acheter/[id]/page.tsx` | `ListingDetail.tsx`, `PhotoGallery.tsx` |
| `/louer` | Idem, annonces en location | `src/app/louer/page.tsx` | idem |
| `/louer/[id]` | Fiche annonce (location) | `src/app/louer/[id]/page.tsx` | idem |
| `/vendre` | Présentation des "packs" vendeur | `src/app/vendre/page.tsx` | `PackCard.tsx` |
| `/vendre/deposer` | Formulaire de dépôt d'annonce (connexion requise) | `src/app/vendre/deposer/page.tsx` | `PublishForm.tsx`, `PhotoDropzone.tsx` |
| `/estimer` | Simulateur d'estimation basé sur les prix DVF | `src/app/estimer/page.tsx` | — |
| `/mon-projet` | Tunnel guidé pour définir une recherche (achat/location, budget, villages, critères) | `src/app/mon-projet/page.tsx` | `ProjectWizard.tsx` |
| `/villages` | Grille des 19 communes | `src/app/villages/page.tsx` | `VillageCard.tsx` |
| `/villages/[slug]` | Fiche village (description, annonces locales, stats prix) | `src/app/villages/[slug]/page.tsx` | `VillageMap.tsx` |
| `/carte` | Carte interactive SVG des 19 communes | `src/app/carte/page.tsx` | `VillageMap.tsx` |
| `/prix` | Tableau des prix moyens au m² par village (données DVF) | `src/app/prix/page.tsx` | — |
| `/artisans` | Annuaire des artisans, filtrable par catégorie | `src/app/artisans/page.tsx` | — |
| `/artisans/[id]` | Fiche artisan publique + formulaire de demande de devis | `src/app/artisans/[id]/page.tsx` | `DevisRequestForm.tsx` |
| `/professionnels` | Annuaire des agences | `src/app/professionnels/page.tsx` | — |
| `/professionnels/[id]` | Fiche agence publique (annonces, avis, coordonnées) | `src/app/professionnels/[id]/page.tsx` | `ReviewForm.tsx` |
| `/espace-professionnel` | Page de pitch pour agences/artisans, avec CTA d'inscription | `src/app/espace-professionnel/page.tsx` | — |
| `/connexion` | Formulaire de connexion | `src/app/connexion/page.tsx` | `LoginForm.tsx` |
| `/inscription` | Formulaire d'inscription (accepte `?type=AGENCE\|ARTISAN\|PARTICULIER`) | `src/app/inscription/page.tsx` | `RegisterForm.tsx` |

### Espace compte (connexion requise)

| Route | Contenu | Restriction |
|---|---|---|
| `/compte` | Hub principal : mes annonces, favoris, recherches sauvegardées, alertes, et sections spécifiques agence/artisan | tous profils |
| `/compte/favoris` | Gestion détaillée des favoris (visité / à surveiller / contacté) | tous profils |
| `/compte/annonces/[id]` | Modifier une annonce déposée | propriétaire de l'annonce |
| `/compte/agence` | Coordonnées de l'agence + panneau d'import XML AC3/Immofacile | comptes `AGENCE` |
| `/compte/agence/clients` | Recherches confiées par des particuliers, propositions de biens | comptes `AGENCE` |
| `/compte/agence/statistiques` | Statistiques d'activité de l'agence | comptes `AGENCE` |
| `/compte/artisan` | Fiche artisan éditable + demandes de devis reçues | comptes `ARTISAN` |

### Administration

| Route | Contenu | Restriction |
|---|---|---|
| `/admin/annonces` | File d'attente de modération : publier ou refuser (avec motif) une annonce en attente | `User.isAdmin = true` uniquement, aucun lien visible dans la nav |

### Technique

| Route | Rôle |
|---|---|
| `/api/session` | Endpoint JSON interne, utilisé par `Header.tsx` (composant client) pour savoir si un visiteur est connecté et afficher "Se connecter" ou "Mon compte" |

---

## 6. Modèle de données (vue d'ensemble)

Le détail complet est dans [`prisma/schema.prisma`](prisma/schema.prisma).
Ce qui est utile à connaître pour l'UI :

- **`User`** — un compte peut être `PARTICULIER`, `AGENCE` ou `ARTISAN`
  (`AccountType`), plus un booléen `isAdmin` indépendant. Les champs
  affichés varient selon le type (une agence a `entreprise`, `logoUrl`,
  `xmlImportUrl`… ; un artisan a `categories`, `communesDesservies`…).
- **`Listing`** (une annonce) — `transaction` (`VENTE`/`LOCATION`),
  `typeBien` (`MAISON`/`APPARTEMENT`/`TERRAIN`), `statut`
  (`EN_VERIFICATION`/`PUBLIEE`/`REFUSEE`). Une annonce non publiée n'apparaît
  jamais dans les listes publiques (`/acheter`, `/louer`) — c'est normal,
  pas un bug d'affichage.
- **`ListingPhoto`**, **`PriceHistory`** — relations 1-N sur `Listing`.
- **`Favorite`**, **`SavedSearch`**, **`SearchMandate`**, **`ListingProposal`**
  — le parcours "un particulier sauvegarde une recherche, la confie à une
  agence, l'agence lui propose des biens".
- **`Review`**, **`DevisRequest`**, **`VisitRequest`** — avis sur une agence,
  demande de devis à un artisan, demande de visite sur une annonce.
- **`DvfTransaction`** — données publiques (data.gouv.fr) réimportées, servent
  aux statistiques de prix par village.

Liste canonique des équipements (utilisée partout où des équipements sont
affichés/filtrés) : `Jardin, Garage, Parking, Balcon, Terrasse, Cave,
Piscine, Cheminée` — voir [`src/data/equipements.ts`](src/data/equipements.ts).

---

## 7. Ce qu'il est SÛR de modifier

Pour un travail purement front-end/design :

- Toute classe Tailwind dans `src/components/**/*.tsx` et
  `src/app/**/page.tsx` (mise en page, espacements, couleurs via les tokens
  existants, typographie, animations).
- Les valeurs hex des tokens dans `globals.css` (pas leurs noms).
- Les textes/libellés statiques (attention : le site est en français partout,
  garder ce ton).
- Ajout de nouveaux composants purement visuels.
- `public/images/` (images statiques du site, pas les uploads).

## 8. Ce qu'il faut modifier avec précaution

- **Les attributs `name` des champs de formulaire** (`<input name="...">`,
  `<select name="...">`). Ils sont lus côté serveur par des Server Actions via
  `formData.get("nomDuChamp")` (dans `src/lib/*-actions.ts`). Renommer un
  champ dans le JSX sans le renommer côté serveur casse silencieusement le
  formulaire (aucune erreur TypeScript ne le détecte, car `formData.get()`
  n'est pas typé).
- **La structure des composants qui reçoivent des props typées** (ex.
  `ListingCard`, `ListingDetail`) — le type vient de `src/lib/listings.ts`.
  On peut réorganiser l'affichage de ces données librement, mais pas inventer
  des champs qui n'existent pas dans le modèle.
- **Les routes dynamiques** (`[id]`, `[slug]`) — ne pas renommer les dossiers
  sans mettre à jour tous les `Link href="..."` qui pointent dessus.

## 9. Ce qu'il ne faut pas toucher (hors périmètre front-end)

- `src/lib/*.ts` — toute la logique métier, les accès base de données, les
  Server Actions (`"use server"`). C'est l'équivalent d'un contrôleur/API
  backend, même si le code vit dans le même dépôt Next.js.
- `prisma/schema.prisma` et `prisma/migrations/` — le modèle de données.
- `src/data/*.ts` — données de référence (villages, catégories) considérées
  comme du contenu métier, pas du style.

---

## 10. Emplacements "à venir" — ne pas confondre avec des bugs

Quelques blocs affichent volontairement "Bientôt disponible" car la donnée
sous-jacente n'existe pas encore (pas de fausse donnée inventée) :

- Section "L'environnement" sur chaque fiche annonce (écoles, commerces,
  transports) — `ListingDetail.tsx`.
- Section "à venir" sur la fiche village (mêmes infos, à l'échelle commune) —
  `src/app/villages/[slug]/page.tsx`.
- "Mes collaborateurs" dans le compte agence — multi-utilisateurs par agence
  pas encore développé.

Ces trois blocs peuvent être restylés librement (ils utilisent déjà le motif
`border-dashed` pour se distinguer visuellement des blocs actifs), mais ne
doivent pas être transformés pour afficher des données qui n'existent pas
réellement.

---

## 11. Parcours clés à connaître pour juger l'UI en contexte

1. **Achat/location libre** : `/` → `/acheter` (filtres) → fiche annonce →
   favori / demande de visite (si connecté).
2. **Recherche accompagnée** : `/mon-projet` (tunnel pas-à-pas) → recherche
   sauvegardée sur `/compte` → confiée à une agence → l'agence propose des
   biens → le particulier réagit (intéressé / pas intéressé).
3. **Dépôt d'annonce (particulier ou agence)** : `/vendre/deposer` → statut
   `EN_VERIFICATION` → un admin publie ou refuse (avec motif) depuis
   `/admin/annonces` → si refusée, le motif s'affiche sur `/compte` et sur la
   page d'édition ; modifier l'annonce la repasse en vérification.
4. **Agence — import automatique** : `/compte/agence`, coller l'URL d'un flux
   XML (format AC3/Immofacile), cliquer "Synchroniser" → les annonces
   admissibles (dans la zone Pévèle, type de bien supporté, statut actif)
   sont créées ou mises à jour et **publiées directement** (pas de passage
   par la modération, contrairement au dépôt manuel).
5. **Artisan** : fiche publique sur `/artisans/[id]` avec formulaire de devis
   → la demande arrive dans `/compte` côté artisan.

---

## 12. Contact rapide fichier → route (composants les plus réutilisés)

| Composant | Utilisé dans |
|---|---|
| `ListingCard.tsx` | `/acheter`, `/louer`, `/compte`, fiche village |
| `ListingDetail.tsx` | `/acheter/[id]`, `/louer/[id]` |
| `ListingsBrowser.tsx` | `/acheter`, `/louer` (logique de filtre côté client) |
| `Header.tsx` / `Footer.tsx` | toutes les pages, via `src/app/layout.tsx` |
| `PublishForm.tsx` / `EditListingForm.tsx` | dépôt / modification d'annonce |
| `VillageMap.tsx` | `/carte`, fiche village |
