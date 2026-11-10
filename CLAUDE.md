# Projet : H MODE (site vitrine + boutique + admin · Vite + React 18 + TS + Tailwind · Supabase)
<!-- Notes mainteneur : invisibles pour Claude. Plan lot par lot : docs/projet/plan.md · données manquantes : docs/projet/TODO.md -->
<!-- Structure : web/ (application) · supabase/migrations · infra/ (Docker) · .github/workflows · docs/ · archive/ -->

## Commandes
- Un seul serveur : `./start.sh` → http://localhost:6013 (catalogue réel, Supabase de `web/.env`) · Arrêt : `./stop.sh`. Ne jamais lancer d'autre serveur de dev (plus de 6011 / 6012).
- Dans `web/` : Tests : `npm test` · Types : `npm run lint` · Build : `npm run build` · Images WebP : `npm run images` · Logo (profils IG/FB, favicon) : `npm run logo`
- Test d'un seul fichier : `cd web && npx vitest run src/test/logique.test.ts`
- Robot de surveillance : `npm run sante:sql` (jeton → SQL) · `npm run robot:sante` (à la main, variables `SITE_URL`, `VITE_SUPABASE_*`, `SANTE_JETON`). Admin sur Supabase local sans toucher au 6013 : config `hmode-test-local` de `.claude/launch.json` (port 6014), clé posée par psql puis retirée.
- Navigateur réel : `cd web && npm run test:e2e` (Playwright, serveur de test 6014 sans Supabase, lancé et arrêté seul) · Lighthouse : `npm run qualite:lighthouse` (build de prod temporaire) → rapports dans `web/rapports/` (non versionné)
- Production locale (Docker, nginx sans root) : `./deploy.sh` → http://localhost:6111 (santé `/sante`) · arrêt : `docker compose -f infra/docker-compose.yml down`
- Contrôle CloneMe : `node ~/.claude/plugins/cache/stackllm-skills/cloneme/*/scripts/verifier-synchro.mjs web`
- CI : `.github/workflows/` (ci, supabase local, image ghcr, migrations en ligne manuelles). Hébergement : Netlify (`netlify.toml`, routes dans `web/public/_redirects`).
- Tests avec vrais comptes (ponctuel, puis arrêter) : `npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,realtime,postgres-meta,supavisor` à la racine (stockage gardé pour les photos) → `cd web && npm run test:supabase` (comptes, RLS, admin) → `npm run test:e2e:admin` (Playwright de l'admin, compte admin jetable) → `npx supabase stop`. E-mails reçus : http://127.0.0.1:54324. Nouvelle évolution de la base : `npx supabase migration new <nom>` (dans `supabase/migrations/`, rejouable), puis `npx supabase migration up --local`

## Conventions
- Code, noms et textes en français (composants `PageBoutique`, `CarteProduit`, état `usePanier`…).
- Toute UI passe par `@/design-system` et les tokens Tailwind de la charte (nacre, sable, bronze, or, encre). Pas de couleur en dur.
- Ne jamais inventer prix, tailles, matière, stock, délais ou affirmations commerciales : afficher « À confirmer » (`AConfirmer`).
- Une fonction sans données (filtre, tri, lien) est masquée, pas affichée à vide. Aucun bouton décoratif.
- Comptes, panier et commandes : Supabase (ADR 0005, schéma dans `supabase/migrations/`, RLS par compte).
- Administration `/admin` (ADR 0006) : connexion propre à trois champs (e-mail, mot de passe, clé de sécurité au format libre), pas celle des clients ; compte admin créé par `npm run admin:sql` depuis `ADMIN_EMAIL`/`ADMIN_MOT_DE_PASSE`/`ADMIN_CLE` (sans `VITE_`) de `web/.env`, ligne de `admins`, session déverrouillée 12 h par la clé ; droits vérifiés par la base (`est_admin()`), jamais par le navigateur. Jamais d'identifiant ni de clé dans une variable `VITE_`. Catalogue et réglages lus en base par `lib/donnees.ts`, appliqués SUR PLACE dans `produits`/`boutique`/`textes` de `lib/catalogue.ts` (repli : fichiers de `src/data/`). Commande = enregistrée par `passer_commande` puis message WhatsApp ; paiement à la livraison uniquement, jamais en ligne. Sans `.env`, retour au parcours WhatsApp seul (ADR 0001).
- Clés Supabase dans `web/.env` (non versionné) : URL + clé publique seulement. Contrôle sans écriture : `cd web && node --env-file=.env scripts/verifier-supabase.mjs`.
- Contacts et réseaux : source unique `web/src/data/boutique.json`.
- Toute écriture publique en base (commande, erreur, visite, demande) passe par `passer_limite` ; jamais d'insert direct pour `anon`. Longueurs des champs : `lib/longueurs.ts` = contraintes de la base.
- Admin : rôles `technique` / `commerce` (`est_admin_technique()`) ; supervision réservée au technique. Demande WhatsApp ≠ commande.
- Mise en ligne et exploitation : `DEPLOIEMENT_ET_SUPERVISION/` (guide PDF + étude d'hébergement, architecture de la supervision, checklist) ; source du PDF `docs/guide-pdf/`, régénéré par `npm run guide:pdf` (Paged.js + Chromium). Marketing : `marketing/INDEX.md`.
- Vérifier une page dans le navigateur par le DOM et les styles calculés, pas seulement par capture d'écran.
- Fin de lot : mettre à jour le tableau « Avancement » en haut de `docs/projet/plan.md`.
- Nouvelle route dans `App.tsx` : l'ajouter aussi à `web/public/_redirects` et `infra/docker/nginx.conf` (sinon 404 ; `routes.test.ts` le vérifie).

## Pièges connus
- Lectures bloquées dans `.claude/settings.json` : `web/dist/`, `node_modules/`, `archive/legacy/`, images et exports de `Scrapping/` (hors git, reste sur le disque).
- Ports : 6010 et 8765 sont pris par d'autres process de l'utilisateur, ne pas y toucher.
- Node ≥ 25 : `localStorage` global incomplet → stockage mémoire dans `web/src/test/setup.ts`.
- `Intl` fr-MA donne « 1.250 » : `formatDH` utilise une regex + espaces insécables (` `). Les tests comparent avec ` `.
- Heredocs bash : ` ` y devient littéral → écrire ces fichiers avec Write.
- Un ancêtre transformé (transition de page framer-motion) casse `position: fixed` → élément fixé dans une page = `createPortal(…, document.body)`.
- Animation qui démarre cachée : `initial={actives ? … : false}` via `useAnimationsActives()`, sinon contenu invisible en « animations off ».
- Captures du navigateur intégré : prises en cours d'animation (contenu pâle) ; panneau masqué = animations en pause.
- Panier persistant : clé `hmode-panier`, `version: 1` (une autre version vide le panier).
- Tests : jamais le vrai Supabase (`env` vidé dans `vite.config.ts`) ; client simulé dans `src/test/*` (fausse base à RLS dans `synchro.test.ts`).
- Aucune donnée fictive dans le site (mode démo supprimé le 04/11). Prix d'essai seulement pour Playwright : `web/e2e/donnees/prix-test.json`, servis par `vite --mode e2e`. Le 6013 écrit dans la vraie base : n'y passer que de vraies commandes.
- Nouvelles données de la base : les pages du catalogue se remontent (`key` = version), les pages à formulaire (commande, connexion, compte, contact) non, pour ne pas effacer une saisie. Écran qui charge puis laisse saisir : ignorer une réponse en retard (jeton, voir `useChargement`).
- `index.html` : ne pas toucher au bloc `<!-- partage:debut -->…<!-- partage:fin -->` (réécrit au build par `scripts/pages-partage.mjs`).
- Tests unitaires qui comptent les appels `rpc` : neutraliser `@/lib/supervision` (pages vues, erreurs) comme dans `commande.test.tsx`.
- `/admin` est rendu hors de `motion.main` (barres fixées en bas) et n'est pas préchargé pour les visiteurs.
- L'ancien site est dans `archive/ancien-site/` jusqu'à la mise en ligne : ne pas le supprimer.
- CSP stricte (Netlify et nginx) : pas de script en ligne, pas de domaine externe hors `*.supabase.co`. Un nouveau service externe = l'ajouter aux deux politiques (`netlify.toml`, `infra/docker/securite.conf`).
- `npx lightswind add …` réécrit `web/tailwind.config.js` (plugin `lightswind/plugin` non installé → page blanche) : sauvegarder la config avant, la restaurer après, puis ré-habiller le composant (licence MIT en tête).

## Contexte
- Architecture : utiliser la Skill `codebase-overview`
- Guide technique : `docs/architecture.md` · index : `docs/README.md`
- Décisions : `docs/decisions/` (lire seulement si utile)

# Compact instructions
Conserver : fichiers modifiés, décisions prises, erreurs de test non résolues, lot en cours de `plan.md`.
