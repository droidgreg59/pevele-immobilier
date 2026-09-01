This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Tâches planifiées (cron)

Deux routes protégées permettent d'automatiser des tâches qui, sinon,
nécessitent une action manuelle :

- `GET /api/cron/dvf-import` — réimporte les prix DVF (équivalent à `npm run dvf:import`).
- `GET /api/cron/sync-agencies` — resynchronise le flux XML de toutes les agences qui en ont configuré un.

Les deux exigent le secret `CRON_SECRET` (défini dans `.env`), soit en
en-tête `Authorization: Bearer <secret>`, soit en paramètre `?secret=<secret>`.

**Avec Vercel Cron** (si déployé sur Vercel), ajouter à `vercel.json` :

```json
{
  "crons": [
    { "path": "/api/cron/dvf-import", "schedule": "0 4 * * 1" },
    { "path": "/api/cron/sync-agencies", "schedule": "0 5 * * *" }
  ]
}
```

Vercel envoie automatiquement `Authorization: Bearer $CRON_SECRET` — définir
`CRON_SECRET` dans les variables d'environnement du projet Vercel.

**Avec un ordonnanceur externe** (GitHub Actions, cron-job.org…) :

```bash
curl "https://pevele-immobilier.fr/api/cron/sync-agencies?secret=$CRON_SECRET"
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
