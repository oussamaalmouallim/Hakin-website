# Architecture de H MODE

Référence technique du projet, à jour au 08/11/2026 (lots 22 à 31). Mise en ligne et exploitation pas à pas :
[`../DEPLOIEMENT_ET_SUPERVISION/`](../DEPLOIEMENT_ET_SUPERVISION/) (guide PDF, étude, supervision, checklist).
Les choix sont expliqués dans les ADR de [`decisions/`](decisions/) ; la démarche, lot par lot, dans [`projet/plan.md`](projet/plan.md).

## 1. En une phrase

Un **seul site statique** (`web/`), qui contient la vitrine, la boutique et l'administration `/admin`, parle
directement à **Supabase** (base, comptes, photos). Aucun serveur à nous. Les droits sont vérifiés par la base.

```
   Visiteur ─────────────┐                ┌──────────── Admin (e-mail + mot de passe + clé)
                         ▼                ▼
   ┌───────────────────────────────────────────────────────────┐
   │ web/ — site statique (Netlify, ou image Docker nginx)      │
   │  vitrine · boutique · panier · commande · compte · /admin  │
   └──────────────┬──────────────────────────────┬─────────────┘
                  │ clé publique + session        │ lien wa.me (message pré-rempli)
                  ▼                               ▼
   ┌──────────────────────────────┐      ┌──────────────────┐
   │ Supabase (hébergé)           │      │ WhatsApp de la   │
   │ Postgres + RLS · Auth ·      │      │ boutique         │
   │ Storage (photos) · journal   │      └──────────────────┘
   └──────────────▲───────────────┘
                  │ toutes les 30 min (jeton)
   GitHub Actions « Surveillance » (robot) ──► build hook Netlify si le catalogue a changé
```

Pourquoi : [ADR 0007](decisions/0007-architecture-et-deploiement.md). Pas de microservice, pas d'hébergement à part
pour l'admin : il est chargé à la demande, dans le même site, et ne peut rien faire sans les droits que la base lui donne.

## 2. Le dépôt

```
Hakin-website/
├── web/                     l'application (Vite 5, React 18, TypeScript strict, Tailwind 3)
│   ├── src/
│   │   ├── App.tsx          routes (pages chargées à la demande, sauf accueil, boutique, fiche)
│   │   ├── features/        une page par dossier : accueil, catalogue, produit, panier,
│   │   │                    commande, compte, infos, admin
│   │   ├── design-system/   composants de base de la charte (Bouton, Champ, Modale, Tiroir…)
│   │   ├── components/      coque du site (en-tête, menus, pied, carte produit, Lightswind ré-habillé)
│   │   ├── lib/             logique pure + accès Supabase (voir § 4)
│   │   ├── state/           stores Zustand : panier, favoris, compte, session, synchroCompte
│   │   ├── data/            catalogue de repli (produits.json…) et boutique.json
│   │   ├── styles/          tokens.css (charte), base
│   │   └── test/            Vitest
│   ├── e2e/                 Playwright : site (sans Supabase) et admin/ (Supabase local)
│   ├── medias/              photos d'origine → `npm run images` → public/images/ (WebP 480/960)
│   ├── public/              _redirects, robots.txt, icônes, images générées
│   ├── scripts/             images, logo, sitemap, aperçus de partage, admin:sql, sante:sql, robot, contrôles Supabase, Lighthouse
│   └── design.md · palette.md · animation.md · .cloneme/   charte CloneMe (pilote le code)
├── supabase/                migrations/ (schéma daté, rejouable), seed.sql, config.toml
├── infra/                   docker/ (Dockerfile, nginx.conf, securite.conf) · docker-compose.yml
├── .github/workflows/       ci · supabase · image · base
├── docs/                    architecture (ce fichier), decisions/, design/, projet/
├── marketing/               identité visuelle, prompts, Facebook, Instagram, TikTok, Meta Ads
├── DEPLOIEMENT_ET_SUPERVISION/  guide PDF, étude d'hébergement, architecture de la supervision, checklist
├── archive/                 ancien site statique, legacy, ancien serveur (lecture seule, rien supprimé)
├── netlify.toml             hébergement Netlify
└── start.sh · stop.sh · deploy.sh
```

Hors git, sur le disque seulement : `Scrapping/` (outil interne de collecte d'images), `web/.env`, `web/rapports/`.

## 3. Les parcours

### Visiteur
1. Le site s'affiche avec le catalogue de repli (`src/data/`), puis `lib/donnees.ts` lit la base
   (`produits`, `reglages`) et remplace le contenu **sur place** dans `lib/catalogue.ts`. Sans réseau ou sans `.env`,
   le repli reste affiché.
2. Les pages du catalogue se remontent quand les données changent ; les pages à formulaire non (pas de saisie effacée).

### Commande (paiement à la livraison seulement)
1. Panier en local (`state/panier.ts`, clé `hmode-panier`), fusionné avec le compte à la connexion (`synchroCompte.ts`).
2. `/commande` : la ville doit être une ville livrée (`lib/livraison.ts`, réglée dans l'admin).
3. `lib/commandes.ts` appelle `passer_commande` : la base relit le prix de chaque pièce (le prix du navigateur est
   ignoré) et enregistre la commande en une transaction.
4. Le message WhatsApp pré-rempli s'ouvre dans le même clic (`lib/whatsapp.ts`). Sans Supabase : WhatsApp seul (ADR 0001).

### Client
Compte Supabase Auth (inscription avec confirmation d'e-mail). Profil, adresses, panier, favoris et historique en base,
chacun ne voit que les siens (RLS). Déconnexion = appareil vidé.

### Admin
1. `/admin` a sa propre connexion à trois champs : e-mail, mot de passe, clé de sécurité (format libre).
2. Le compte n'est jamais créé par le site : `npm run admin:sql` lit `ADMIN_EMAIL`, `ADMIN_MOT_DE_PASSE`, `ADMIN_CLE`
   dans `web/.env` et produit le SQL à coller dans Supabase (empreintes bcrypt seulement).
3. `deverrouiller_admin(cle)` compare la clé à son empreinte et déverrouille **cette session** pendant 12 h.
   5 erreurs = 15 min de blocage. Tout est écrit dans le journal.
4. `est_admin()` exige compte admin **et** session déverrouillée. Toutes les politiques d'écriture s'en servent.
5. Première entrée sur une base vide : le catalogue actuel est importé une fois, tout seul.
6. Écrans : tableau de bord, produits (prix, tailles, coloris, photos, visibilité), commandes (statuts, export CSV),
   réglages (WhatsApp, réseaux, villes livrées, frais), textes (livraison, retours, mentions, CGV…), journal.

Détail : [ADR 0006](decisions/0006-administration.md).

L'admin a trois espaces : **Boutique** (catalogue, réglages, textes, journal), **Ventes** (commandes, demandes WhatsApp)
et **Technique** (supervision). Deux rôles en base (`admins.role`) : `technique` voit tout, `commerce` n'a pas la
supervision ; `est_admin_technique()` le vérifie côté base.

### Demande WhatsApp depuis une fiche
Chaque bouton WhatsApp d'une fiche ouvre un message prêt (pièce, couleur, taille, lien, question) et appelle
`noter_demande_whatsapp` (nom et prix relus en base, limite par visiteur). L'admin les suit dans **Ventes → Demandes
WhatsApp** (à traiter, traitée, sans suite) : ce ne sont jamais des commandes. Détail : [ADR 0008](decisions/0008-supervision-et-commerce.md).

### Supervision (sans serveur à nous)
- **Erreurs du site** : `lib/supervision.ts` capte erreurs de script, promesses rejetées, ressources introuvables et
  erreurs d'appel à la base ; `components/GardeErreur.tsx` attrape les erreurs d'affichage (plus d'écran blanc).
  Messages nettoyés (e-mails, numéros, jetons) dans le navigateur puis en base (`nettoyer_texte`), envoyés à
  `signaler_erreur` (limité).
- **Pages vues** : `compterVisite` à chaque changement d'adresse (hors `/admin`), LCP joint à la première ; visiteur =
  empreinte hachée de l'adresse réseau (sel secret en base), jamais l'adresse.
- **Santé** : le robot `web/scripts/robot-sante.mjs` (workflow `sante.yml`, toutes les 30 min) contrôle site, 404,
  `version.json`, API, Auth, photos et WhatsApp, et écrit par `enregistrer_controles` (jeton haché). L'admin peut aussi
  contrôler depuis son navigateur (`noter_controles`).
- **Version** : `vite.config.ts` grave la version (commit) dans le JavaScript et dans `/version.json`.
- Écran : `features/admin/Supervision.tsx` ; chiffres agrégés par `statistiques_supervision()`.

### Aperçus de partage (Open Graph)
`web/scripts/pages-partage.mjs`, après `vite build` : pour chaque pièce publiée (lue en base, sinon dans les fichiers),
une page `dist/produit/<slug>/index.html` avec ses balises `og:` et une image JPEG 1200 × 630 de moins de 300 Ko
(`dist/partage/`). Netlify et nginx servent cette page avant `index.html`. Le robot relance un build (build hook) quand
le catalogue a changé, au plus toutes les 12 h (`republication_necessaire`).

## 4. Où est quoi dans le code

| Besoin | Fichier |
|---|---|
| Ajouter une page | `web/src/App.tsx` + `web/public/_redirects` + `infra/docker/nginx.conf` (sinon 404, `routes.test.ts` casse) |
| Client Supabase | `web/src/lib/supabase.ts` (URL + clé publique de `.env`) |
| Lecture du catalogue et des réglages | `lib/donnees.ts` → `lib/catalogue.ts` ; conversion base ↔ site : `lib/produitsBase.ts` |
| Compte, panier, favoris en base | `lib/compteDistant.ts`, `state/synchroCompte.ts` |
| Commande | `lib/commandes.ts`, `lib/whatsapp.ts`, `lib/commandeDirecte.ts` |
| Filtres, recherche, prix | `lib/filtres.ts`, `lib/recherche.ts`, `lib/format.ts` (`formatDH`) |
| Livraison | `lib/livraison.ts` |
| Administration | `features/admin/` (écrans) · `features/admin/api.ts` (appels) · `lib/admin.ts` (validation) |
| Supervision | `lib/supervision.ts`, `components/GardeErreur.tsx`, `features/admin/Supervision.tsx`, `scripts/robot-sante.mjs` |
| Demandes WhatsApp | `lib/whatsapp.ts` (`messageProduit`), `lib/demandes.ts`, `features/admin/Demandes.tsx` |
| Aperçus de partage | `web/index.html` (bloc `partage:debut/fin`), `scripts/pages-partage.mjs` |
| Longueurs des champs (= contraintes de la base) | `lib/longueurs.ts` |
| Charte | `web/palette.md` → `src/styles/tokens.css` + `tailwind.config.js` ; composants : `@/design-system` |
| Animations | `web/animation.md` → `lib/animations.ts` ; coupées par `useAnimationsActives()` |

## 5. La base (Supabase)

| Table | Contenu | Qui lit / écrit |
|---|---|---|
| `profils`, `adresses`, `paniers`, `favoris` | données du client | le client, les siennes seulement |
| `commandes`, `lignes_commande` | commandes | écrites par `passer_commande` ; lues par le client (les siennes) et l'admin |
| `produits` | catalogue (coloris, tailles, photos en JSON) | lecture publique des pièces visibles ; écriture admin |
| `reglages` | boutique, livraison, textes | lecture publique ; écriture admin |
| `admins`, `admin_cle`, `admin_sessions`, `admin_essais` | droits admin, empreinte de la clé, sessions déverrouillées, essais | fonctions de la base seulement |
| `journal_admin` | qui a changé quoi, avant / après, connexions | lecture admin ; écrit par déclencheurs |
| `demandes_whatsapp` | clics WhatsApp des fiches (pièce, couleur, taille, suivi) | écrites par `noter_demande_whatsapp` ; lues et suivies par l'admin |
| `limites`, `limites_evenements`, `sel_empreinte` | règles de limitation, passages et blocages, sel de l'empreinte | fonctions de la base ; lecture technique |
| `controles_sante`, `robot_jeton`, `erreurs_site`, `visites`, `sauvegardes`, `republications` | supervision | écrites par des fonctions limitées ; lues par le rôle technique |
| Storage `produits` | photos WebP | lecture publique ; écriture admin |

Fonctions : `passer_commande` (v3), `changer_statut_commande`, `supprimer_commande`, `est_admin`, `est_admin_technique`,
`admin_statut`, `deverrouiller_admin`, `verrouiller_admin`, `session_courante`, `journaliser`, `creer_profil`,
`passer_limite`, `empreinte_visiteur`, `nettoyer_texte`, `signaler_erreur`, `compter_visite`, `noter_demande_whatsapp`,
`enregistrer_controles`, `noter_controles`, `statistiques_supervision`, `republication_necessaire`.

Migrations dans `supabase/migrations/`, toutes rejouables. Nouvelle évolution :
`npx supabase migration new <nom>`, test en local (`npx supabase migration up --local`), puis en ligne par le
workflow `base.yml`. Voir [`supabase/README.md`](../supabase/README.md).

## 6. Sécurité

- **Navigateur** : seulement l'URL et la clé **publique** Supabase. Aucune variable `VITE_` ne contient un identifiant
  ou une clé (`admin:sql` refuse de tourner sinon). Jamais de clé `service_role`.
- **Droits** : tout passe par la RLS et `est_admin()`. Masquer un bouton n'est jamais une protection.
- **Prix** : relus en base au moment de la commande, avec la pièce, le coloris, la taille et la ville livrée.
- **Limitation des requêtes** : toute écriture publique (commande, erreur, visite, demande, robot) passe par
  `passer_limite` : maximum par visiteur (empreinte de l'adresse, falsifiable) **et** plafond global.
- **Admin** : mot de passe et clé hachés (bcrypt), session déverrouillée liée à la session Auth, blocage après 5 erreurs, journal.
- **Hébergement** (identique Netlify et nginx) : CSP stricte (pas de script en ligne, seul domaine externe
  `*.supabase.co`), `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS sur Netlify,
  `/admin` en `noindex` (en-tête + `robots.txt`). Un nouveau service externe = l'ajouter dans `netlify.toml` **et**
  `infra/docker/securite.conf`.

## 7. Hébergement

| Cible | Comment | Rôle |
|---|---|---|
| **Netlify** (prévu) | `netlify.toml`, base `web`, build `npm run build` | mise en ligne ; aperçu pour chaque pull request |
| **Docker** | `infra/docker/Dockerfile` : build Node 22 puis `nginx-unprivileged` (port 8080, sans root) | même site, autre hébergeur possible ; `./deploy.sh` → http://localhost:6111, santé `/sante` |

Les deux renvoient un **vrai 404** sur une adresse inconnue et mettent en cache long les fichiers à empreinte.
`sitemap.xml` est généré au build quand `SITE_URL` (ou `URL` sur Netlify) est défini.

## 8. CI/CD (GitHub Actions)

| Workflow | Quand | Ce qu'il fait |
|---|---|---|
| `ci.yml` | chaque push et pull request | types, tests, build, Playwright, image Docker de contrôle (santé, 200/404, en-têtes) |
| `supabase.yml` | push sur `main`, à la demande | Supabase local dans la CI : migrations sur base vide, vrais comptes, RLS, Playwright admin |
| `image.yml` | push sur `main`, tag `v*` | image publiée sur `ghcr.io/<compte>/hmode-web` |
| `base.yml` | à la main seulement | migrations sur la base en ligne (essai à blanc par défaut, environnement « production ») |
| `sante.yml` | toutes les 30 min, dès que `SITE_URL` existe | robot de surveillance ; échec = e-mail de GitHub |

Le compte admin n'est jamais créé par la CI.

## 9. Tests

| Niveau | Commande (dans `web/`) | Ce qui est couvert |
|---|---|---|
| Types | `npm run lint` | TypeScript strict |
| Unitaires et intégration | `npm test` | logique, écrans, fausse base à RLS, admin, routes ↔ hébergement (jamais le vrai Supabase) |
| Navigateur, site | `npm run test:e2e` | parcours d'achat, clavier, axe WCAG 2.2 AA, mobile (serveur de test 6014, sans Supabase) |
| Vrais comptes | `npm run test:supabase` | inscription, RLS entre comptes, commandes (limites, catalogue, ville), admin et clé, rôles, supervision, robot, demandes (Supabase **local**) |
| Navigateur, admin | `npm run test:e2e:admin` | connexion à trois champs, écrans, axe (Supabase local, compte jetable) |
| Qualité | `npm run qualite:lighthouse` | performance, accessibilité, SEO (build de prod) |
| Charte | `node ~/.claude/plugins/cache/stackllm-skills/cloneme/*/scripts/verifier-synchro.mjs web` | design.md, palette.md, animation.md ↔ code |

## 10. Exploitation

- **Développement** : `./start.sh` → http://localhost:6013 (vraie base de `web/.env` : n'y passer que de vraies commandes).
- **Contenu** : tout se gère dans `/admin` ; rien à redéployer pour un prix, une photo ou un texte.
- **Nouvelle version du site** : push sur `main` → CI → Netlify et image ghcr.
- **Retour arrière** : Netlify → Deploys → « Publish deploy » sur une version précédente ; Docker : relancer l'image
  du tag précédent. Une migration ne se défait pas toute seule : en écrire une nouvelle qui corrige.
- **Sauvegarde** : celle de Supabase (selon l'offre du projet en ligne). Les photos d'origine restent dans `web/medias/`.
- **Mise en ligne, une fois** : voir le [`README.md`](../README.md#mise-en-ligne-une-fois).
