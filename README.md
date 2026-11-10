# H MODE — site vitrine et boutique · Casablanca

Vêtements premium. Commande enregistrée puis confirmée sur WhatsApp, paiement à la livraison.
Le contenu (pièces, prix, photos, textes, livraison, commandes) se gère dans l'administration `/admin`.

## Architecture

```
            Visiteur                         Admin (e-mail + mot de passe + clé)
               │                               │
               ▼                               ▼
   ┌─────────────────────────────────────────────────────┐
   │ web/ — UN SEUL SITE statique (Netlify, ou image Docker)│
   │   /  /boutique  /produit/…          /admin (à la demande)│
   └──────────────────────┬──────────────────────────────┘
                          │ clé publique, droits vérifiés par la base
                          ▼
   ┌─────────────────────────────────────────────────────┐
   │ Supabase (hébergé) : base, comptes, photos, RLS,      │
   │ est_admin() + clé admin, journal                      │
   └─────────────────────────────────────────────────────┘
```

Un seul site à héberger ; Supabase est le backend, déjà en ligne. L'admin n'est pas un service à part
(voir [`docs/decisions/0007-architecture-et-deploiement.md`](docs/decisions/0007-architecture-et-deploiement.md)).

Documentation : [`docs/README.md`](docs/README.md) (index) · [`docs/architecture.md`](docs/architecture.md) (guide technique : parcours, base, sécurité, hébergement, tests, exploitation) · [`docs/projet/TODO.md`](docs/projet/TODO.md) (ce qui reste).

## Arborescence

```
Hakin-website/
├── web/                    ← l'application : site + /admin (Vite, React 18, TypeScript, Tailwind)
│   ├── src/
│   │   ├── features/       une page par dossier (accueil, catalogue, produit, panier, commande, compte, infos, admin)
│   │   ├── design-system/  composants de base de la charte
│   │   ├── components/     coque du site (en-tête, menus, pied de page, carte produit)
│   │   ├── lib/            logique pure et accès Supabase
│   │   ├── state/          stores (panier, favoris, compte, session)
│   │   ├── data/           catalogue de repli (produits.json…) et boutique.json
│   │   └── test/           Vitest (unitaires, intégration)
│   ├── e2e/                Playwright (site ; admin/ sur Supabase local)
│   ├── public/  medias/  scripts/
│   └── design.md · palette.md · animation.md   ← charte (méthode CloneMe), pilote le code
├── supabase/
│   ├── migrations/         schéma de la base, dans l'ordre
│   ├── seed.sql            base locale seulement
│   └── config.toml
├── infra/
│   ├── docker/             Dockerfile (build + nginx sans root), nginx.conf, securite.conf
│   └── docker-compose.yml
├── .github/workflows/      ci.yml · supabase.yml · image.yml · base.yml
├── docs/                   README.md (index) · architecture.md (guide technique)
│   ├── decisions/          ADR
│   ├── design/             rapport CloneMe, maquettes, prompt du logo
│   └── projet/             plan.md (lots), TODO.md, planning/
├── archive/                ancien site statique, legacy, anciens fichiers (rien de supprimé)
├── netlify.toml            hébergement Netlify (build de web/, en-têtes, cache)
└── start.sh · stop.sh · deploy.sh
```

`Scrapping/` (outil interne de collecte d'images, 151 Mo) reste sur le disque mais n'est plus dans git.

## Lancer

```bash
./start.sh     # développement → http://localhost:6013 (Supabase de web/.env)
./stop.sh
./deploy.sh    # production locale : image Docker + nginx → http://localhost:6111 (santé : /sante)
```

Dans `web/` :

| Commande | Rôle |
|---|---|
| `npm run lint` · `npm test` · `npm run build` | types · tests unitaires et d'intégration · build (+ `sitemap.xml` et aperçus de partage si `SITE_URL`, `version.json` toujours) |
| `npm run test:e2e` | Playwright du site (serveur de test 6014, sans Supabase) |
| `npm run test:supabase` · `npm run test:e2e:admin` | vrais comptes et admin, sur Supabase **local** (`npx supabase start`) |
| `npm run images` · `npm run logo` | photos WebP · logo et icônes |
| `npm run admin:sql` | SQL qui crée le compte admin et sa clé, depuis `web/.env` (à coller dans Supabase) ; `ADMIN_ROLE=commerce` devant pour un compte sans supervision |
| `npm run sante:sql` · `npm run robot:sante` | jeton du robot de surveillance (SQL à coller) · lancer le robot à la main |

## Variables d'environnement (`web/.env`, jamais dans git)

| Variable | Où | Rôle |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env`, Netlify, variables GitHub | publiques : gravées dans le site |
| `SITE_URL` | Netlify, variables GitHub | adresse finale, pour `sitemap.xml` |
| `ADMIN_EMAIL`, `ADMIN_MOT_DE_PASSE`, `ADMIN_CLE` | `.env` seulement | compte admin, via `npm run admin:sql` ; jamais `VITE_` |
| `SANTE_JETON` | `.env` + secret GitHub | jeton du robot de surveillance (`npm run sante:sql`) |
| `NETLIFY_BUILD_HOOK` | secret GitHub, facultatif | le robot relance un build quand le catalogue change (aperçus de partage) |

Modèle : `web/.env.example`.

## CI/CD

| Workflow | Quand | Ce qu'il fait |
|---|---|---|
| `ci.yml` | chaque push et pull request | types, tests, build, Playwright, image Docker de contrôle (santé, 200/404, en-têtes) |
| `supabase.yml` | push sur `main`, à la demande | Supabase local dans la CI : comptes, RLS, admin, Playwright admin |
| `image.yml` | push sur `main`, tag `v*` | image publiée sur `ghcr.io/<compte>/hmode-web` |
| `base.yml` | à la demande seulement | migrations sur le Supabase en ligne (essai à blanc par défaut) |
| `sante.yml` | toutes les 30 min (actif dès que `SITE_URL` existe) | robot de surveillance : site, base, comptes, photos, WhatsApp → admin « Supervision » ; échec = e-mail de GitHub |

Mise en ligne du site : Netlify relié au dépôt (déploiement à chaque push sur `main`, aperçu pour chaque pull request).

## Mise en ligne, une fois

Tout est détaillé pas à pas, pour un débutant, dans **[le guide PDF](DEPLOIEMENT_ET_SUPERVISION/GUIDE_DEPLOIEMENT_HEBERGEMENT_MAINTENANCE_HMODE.pdf)** du dossier [`DEPLOIEMENT_ET_SUPERVISION/`](DEPLOIEMENT_ET_SUPERVISION/) (hébergement,
coûts, domaine, HTTPS, sauvegardes, pannes, checklists). En bref :

1. Désactiver GitHub Pages (il sert encore l'ancien site).
2. **Base en ligne** : `npx supabase link --project-ref <ref>`, puis
   `npx supabase migration repair --status applied 20261102120000 20261105120000 20261107120000 20261107180000`
   (créées à la main), puis `npx supabase db push --dry-run` et `npx supabase db push` pour les 4 migrations du 08/11.
3. **Netlify** : importer le dépôt, définir `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`.
4. **Supabase** → Authentication : Site URL, Redirect URLs, **SMTP** (sans SMTP à vous, 2 à 3 e-mails par heure).
5. **GitHub** → variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`, `SUPABASE_PROJECT_REF` ;
   secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SANTE_JETON` (+ `NETLIFY_BUILD_HOOK` facultatif).

## Marketing

Identité visuelle, prompts de logo et de couverture, stratégies Facebook, Instagram, TikTok et Meta Ads :
[`marketing/INDEX.md`](marketing/INDEX.md).
