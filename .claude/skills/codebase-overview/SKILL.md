---
name: codebase-overview
description: Architecture, dossiers clés et flux de données de la boutique H MODE (ui/). À utiliser avant d'explorer le code ou de modifier plusieurs modules.
---

# Vue d'ensemble
- `ui/` : la boutique (Vite + React 18 + TS + Tailwind + framer-motion + React Router + Zustand + Supabase). Seule appli active.
- `ui/src/data/` : fichiers de repli du catalogue (`produits.json`, `categories.json` — 7 types, `collections.json`, `boutique.json`, `fonds-clairs.json` généré par `npm run images`). Aucune donnée fictive.
- `ui/src/lib/` : logique pure.
  - Catalogue : `catalogue.ts` (`produits`/`boutique`/`textes` modifiés SUR PLACE, `estCommandable`, `srcImage`), `donnees.ts` (lecture base → copie locale → `appliquerCatalogue`/`appliquerReglages`, store `useDonnees`), `produitsBase.ts` (ligne de la table ↔ produit, fusion des réglages et textes).
  - Navigation : `filtres.ts` (filtres, facettes, URL), `recherche.ts`.
  - Livraison : `livraison.ts` (`VILLES`, `villesLivrees` réglées par l'admin, Casablanca seule au 07/11).
  - Commande : `commandeDirecte.ts` (`/commande?article=…`), `commandes.ts` (`passer_commande`), `whatsapp.ts`, `format.ts` (`formatDH`, téléphone, référence).
  - Supabase : `supabase.ts` (client unique, `null` sans `.env`), `compteDistant.ts` (lectures/écritures du compte, RLS).
  - Admin : `admin.ts` (slug, validation, filtres, statuts, CSV, résumé du journal, réglages).
- `ui/src/state/` : stores Zustand — `panier.ts`, `favoris.ts`, `compte.ts` (miroir du compte), `session.ts` (Supabase Auth), `synchroCompte.ts` (fusion visiteur → compte, écritures en base), `interface.ts`, `animations.tsx`.
- `ui/src/design-system/` : composants de base exportés par `index.ts`. Vitrine : route `/design-system`.
- `ui/src/components/` : coque du site — `EnTete`, `Panneaux` (mini-panier, menu mobile, recherche), `PiedDePage`, `CarteProduit`, `Ambiance` (bandeau, WhatsApp flottant, loader), `Reseaux`, `ChampLigne`, `lightswind/` (`looping-words`, `count-up`, section « La Maison »).
- `ui/src/features/<page>/` : une page par dossier — accueil, catalogue, produit, panier, commande, compte (connexion, compte), infos (contact, maison, pages légales, 404), **admin**.
- `ui/src/features/admin/` (`/admin`, ADR 0006) : `PageAdmin` (garde + coque + routes), `TableauDeBord`, `ListeProduits`, `EditionProduit`, `Commandes`, `Reglages`, `Textes`, `Journal` ; `api.ts` (appels Supabase, messages d'erreur), `photos.ts` (WebP 480/960 dans le navigateur), `commun.tsx` (briques + `useChargement`).
- `ui/src/App.tsx` : routes, transition de page, `chargerDonnees`, pages chargées à la demande (sauf Accueil, Boutique, Produit), `/admin` hors de `motion.main`.
- `ui/src/test/` : Vitest — `logique`, `parcours`, `commande`, `auth`, `synchro` (fausse base à RLS), `admin` + `admin-ecrans` (fausse base).
- `ui/e2e/` : Playwright — site sans Supabase (`vite --mode e2e`, prix d'essai `donnees/prix-test.json`) ; `admin/` sur Supabase local (compte admin jetable).
- `ui/scripts/` : `optimiser-images.mjs`, `lighthouse.mjs`, `tests-supabase-local.mjs` (vrais comptes, RLS, admin), `verifier-supabase.mjs` (contrôle sans écriture), `montage-heros.mjs`, `logo-marque.mjs` (`npm run logo` : logo du héros → profils IG/FB dans `medias/marque/`, favicon).
- `ui/medias/` : photos originales (`produits/<slug>/<n>.jpg`, `campagne/`, `provenance.json`) → WebP dans `ui/public/images/` (généré).
- `supabase/` : `schema.sql` (comptes, panier, commandes, favoris), `lot-19-favoris.sql`, `lot-20-admin.sql` (admin, produits, réglages, journal, stockage), `config.toml` (base locale).
- Racine : `start.sh`/`stop.sh`/`deploy.sh`, Docker + nginx, `plan.md` (lots), `TODO.md`, `docs/decisions/` (ADR), `docs/logo-prompt-gemini.md`.
- Hors appli : ancien site statique (`index.html`, `css/`, `js/`, `assets/`), `Scrapping/` (Python, interne), `legacy/`, `Template/hero.png`. `server/` : vide.

# Flux principaux
- Données : démarrage → `chargerDonnees()` (copie locale puis base) → catalogue et réglages appliqués sur place → `useDonnees.version` remonte les pages du catalogue (pas celles à formulaire).
- Commande : fiche (coloris + taille) → panier ou commande directe → `/commande` (`validerCommande`) → `passer_commande` (prix pris en base) → message WhatsApp → `/commande/confirmation`. Paiement à la livraison seulement. Sans `.env` : WhatsApp seul (ADR 0001).
- Compte : connexion → `synchroCompte` charge panier, favoris, profil, adresses, commandes ; fusion du visiteur une fois.
- Admin : compte inscrit dans `admins` (SQL) → `est_admin()` + RLS → écritures dans `produits`/`reglages`/`commandes` → journal par déclencheurs.
- Pièce sans prix (`prixDH: null`) : pas de panier, bouton « Demander prix et disponibilité » (WhatsApp).

# Points d'entrée par type de tâche
- Bug UI d'une page : `ui/src/features/<page>/`, puis le composant du design system concerné.
- Nouveau composant réutilisable : `ui/src/design-system/` + `index.ts` + `PageDesignSystem.tsx`.
- Prix, tailles, photos, textes, livraison : dans l'admin (base) ; fichiers `ui/src/data/` = repli (règle `donnees.md`).
- Écran d'admin : `features/admin/`, logique testable dans `lib/admin.ts`, droits dans `supabase/lot-20-admin.sql`.
- Table, RLS, fonction SQL : `supabase/*.sql` puis `tests-supabase-local.mjs`.
- Filtres / tri / recherche : `lib/filtres.ts`, `recherche.ts`, UI dans `features/catalogue/`.
- Message ou numéro WhatsApp : `lib/whatsapp.ts` + réglages (`boutique`).
- Couleurs, typo, animations : **`palette.md` (racine) → `ui/src/styles/tokens.css`** (lues par `ui/tailwind.config.js`), classes dans `ui/src/styles/index.css`.
- Refonte Original Fit (méthode CloneMe) : `design.md`, `palette.md`, `animation.md`, `RAPPORT-CLONAGE.md` à la racine ; marques `cloneme: P-xx/C-xx/A-xx` dans le code ; mesures dans `.cloneme/`. Contrôle (plugin CloneMe, version installée) : `node ~/.claude/plugins/cache/stackllm-skills/cloneme/*/scripts/verifier-synchro.mjs .`

# Mise à jour
Mettre à jour cette Skill quand un module est ajouté ou déplacé (en fin de tâche).
