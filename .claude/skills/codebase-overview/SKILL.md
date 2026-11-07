---
name: codebase-overview
description: Architecture, dossiers clés et flux de données de la boutique H MODE (web/). À utiliser avant d'explorer le code ou de modifier plusieurs modules.
---

# Vue d'ensemble
- `web/` : l'application unique — site vitrine, boutique et `/admin` (Vite + React 18 + TS + Tailwind + framer-motion + React Router + Zustand + Supabase). `design.md`/`palette.md`/`animation.md` (charte CloneMe) et `.cloneme/` y sont rangés, à côté du code qu'ils pilotent.
- `web/src/data/` : fichiers de repli du catalogue (`produits.json`, `categories.json` — 7 types, `collections.json`, `boutique.json`, `fonds-clairs.json` généré par `npm run images`). Aucune donnée fictive.
- `web/src/lib/` : logique pure.
  - Catalogue : `catalogue.ts` (`produits`/`boutique`/`textes` modifiés SUR PLACE, `estCommandable`, `srcImage`), `donnees.ts` (lecture base → copie locale → `appliquerCatalogue`/`appliquerReglages`, store `useDonnees`), `produitsBase.ts` (ligne de la table ↔ produit, fusion des réglages et textes).
  - Navigation : `filtres.ts` (filtres, facettes, URL), `recherche.ts`.
  - Livraison : `livraison.ts` (`VILLES`, `villesLivrees` réglées par l'admin, Casablanca seule au 07/11).
  - Commande : `commandeDirecte.ts` (`/commande?article=…`), `commandes.ts` (`passer_commande`), `whatsapp.ts`, `format.ts` (`formatDH`, téléphone, référence).
  - Supabase : `supabase.ts` (client unique, `null` sans `.env`), `compteDistant.ts` (lectures/écritures du compte, RLS).
  - Admin : `admin.ts` (slug, validation, filtres, statuts, CSV, résumé du journal, réglages).
- `web/src/state/` : stores Zustand — `panier.ts`, `favoris.ts`, `compte.ts` (miroir du compte), `session.ts` (Supabase Auth), `synchroCompte.ts` (fusion visiteur → compte, écritures en base), `interface.ts`, `animations.tsx`.
- `web/src/design-system/` : composants de base exportés par `index.ts`. Vitrine : route `/design-system`.
- `web/src/components/` : coque du site — `EnTete`, `Panneaux` (mini-panier, menu mobile, recherche), `PiedDePage`, `CarteProduit`, `Ambiance` (bandeau, WhatsApp flottant, loader), `Reseaux`, `ChampLigne`, `lightswind/` (`looping-words`, `count-up`, section « La Maison »).
- `web/src/features/<page>/` : une page par dossier — accueil, catalogue, produit, panier, commande, compte (connexion, compte), infos (contact, maison, pages légales, 404), **admin**.
- `web/src/features/admin/` (`/admin`, ADR 0006) : `PageAdmin` (connexion admin e-mail + mot de passe + clé, coque, routes), `TableauDeBord`, `ListeProduits`, `EditionProduit`, `Commandes`, `Reglages`, `Textes`, `Journal` ; `api.ts` (appels Supabase, messages d'erreur), `photos.ts` (WebP 480/960 dans le navigateur), `commun.tsx` (briques + `useChargement`).
- `web/src/App.tsx` : routes, transition de page, `chargerDonnees`, pages chargées à la demande (sauf Accueil, Boutique, Produit), `/admin` hors de `motion.main`.
- `web/src/test/` : Vitest — `logique`, `parcours`, `commande`, `auth`, `synchro` (fausse base à RLS), `admin` + `admin-ecrans` (fausse base).
- `web/e2e/` : Playwright — site sans Supabase (`vite --mode e2e`, prix d'essai `donnees/prix-test.json`) ; `admin/` sur Supabase local (compte admin jetable).
- `web/scripts/` : `optimiser-images.mjs`, `lighthouse.mjs`, `tests-supabase-local.mjs` (vrais comptes, RLS, admin), `verifier-supabase.mjs` (contrôle sans écriture), `montage-heros.mjs`, `admin-sql.mjs` (`npm run admin:sql` : SQL qui crée le compte admin et pose l'empreinte de la clé, depuis `web/.env`), `logo-marque.mjs` (`npm run logo` : logo du héros → profils IG/FB dans `medias/marque/`, favicon).
- `web/medias/` : photos originales (`produits/<slug>/<n>.jpg`, `campagne/`, `provenance.json`) → WebP dans `web/public/images/` (généré).
- `supabase/migrations/` : schéma dans l'ordre (`…_schema`, `…_favoris`, `…_administration` : admin, produits, réglages, journal, stockage, `…_cle_admin` : clé de sécurité, sessions déverrouillées), tous rejouables. `seed.sql` (local, vide), `config.toml`.
- `infra/` : `docker/Dockerfile` (build Node puis nginx sans root, port 8080, `/sante`), `docker/nginx.conf` + `securite.conf` (CSP, en-têtes, 200/404), `docker-compose.yml`. `.github/workflows/` : `ci.yml`, `supabase.yml`, `image.yml` (ghcr), `base.yml` (migrations en ligne, manuel). `netlify.toml` + `web/public/_redirects` : hébergement.
- Racine : `start.sh`/`stop.sh`/`deploy.sh`, `README.md`. `docs/` : `decisions/` (ADR), `design/` (rapport CloneMe, maquettes, prompt logo), `projet/` (`plan.md`, `TODO.md`, `planning/`).
- Hors appli : `archive/` (ancien site statique, `legacy/`, ancien `server/`), `Scrapping/` (Python, interne, hors git).

# Flux principaux
- Données : démarrage → `chargerDonnees()` (copie locale puis base) → catalogue et réglages appliqués sur place → `useDonnees.version` remonte les pages du catalogue (pas celles à formulaire).
- Commande : fiche (coloris + taille) → panier ou commande directe → `/commande` (`validerCommande`) → `passer_commande` (prix pris en base) → message WhatsApp → `/commande/confirmation`. Paiement à la livraison seulement. Sans `.env` : WhatsApp seul (ADR 0001).
- Compte : connexion → `synchroCompte` charge panier, favoris, profil, adresses, commandes ; fusion du visiteur une fois.
- Admin : connexion `/admin` → clé (`deverrouiller_admin`, session 12 h) → `est_admin()` + RLS → écritures dans `produits`/`reglages`/`commandes` → journal par déclencheurs.
- Pièce sans prix (`prixDH: null`) : pas de panier, bouton « Demander prix et disponibilité » (WhatsApp).

# Points d'entrée par type de tâche
- Bug UI d'une page : `web/src/features/<page>/`, puis le composant du design system concerné.
- Nouveau composant réutilisable : `web/src/design-system/` + `index.ts` + `PageDesignSystem.tsx`.
- Prix, tailles, photos, textes, livraison : dans l'admin (base) ; fichiers `web/src/data/` = repli (règle `donnees.md`).
- Écran d'admin : `features/admin/`, logique testable dans `lib/admin.ts`, droits dans `supabase/migrations/…_administration.sql` et `…_cle_admin.sql`.
- Table, RLS, fonction SQL : `npx supabase migration new <nom>` puis `tests-supabase-local.mjs`.
- Nouvelle route : `App.tsx` + `public/_redirects` + `infra/docker/nginx.conf` (`routes.test.ts`). Nouveau domaine externe : CSP de `netlify.toml` et `infra/docker/securite.conf`.
- Filtres / tri / recherche : `lib/filtres.ts`, `recherche.ts`, UI dans `features/catalogue/`.
- Message ou numéro WhatsApp : `lib/whatsapp.ts` + réglages (`boutique`).
- Couleurs, typo, animations : **`palette.md` (racine) → `web/src/styles/tokens.css`** (lues par `web/tailwind.config.js`), classes dans `web/src/styles/index.css`.
- Refonte Original Fit (méthode CloneMe) : `web/design.md`, `web/palette.md`, `web/animation.md`, rapport dans `docs/design/` ; marques `cloneme: P-xx/C-xx/A-xx` dans le code ; mesures dans `web/.cloneme/`. Contrôle : `node ~/.claude/plugins/cache/stackllm-skills/cloneme/*/scripts/verifier-synchro.mjs web`

# Mise à jour
Mettre à jour cette Skill quand un module est ajouté ou déplacé (en fin de tâche).
