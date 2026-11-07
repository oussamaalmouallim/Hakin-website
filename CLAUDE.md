# Projet : H MODE (boutique e-commerce · Vite + React 18 + TS + Tailwind)
<!-- Notes mainteneur : invisibles pour Claude. Plan lot par lot : plan.md · données manquantes : TODO.md -->

## Commandes
- Un seul serveur : `./start.sh` → http://localhost:6013 (catalogue réel, Supabase de `ui/.env`) · Arrêt : `./stop.sh`. Ne jamais lancer d'autre serveur de dev (plus de 6011 / 6012).
- Dans `ui/` : Tests : `npm test` · Types : `npm run lint` · Build : `npm run build` · Images WebP : `npm run images` · Logo (profils IG/FB, favicon) : `npm run logo`
- Test d'un seul fichier : `cd ui && npx vitest run src/test/logique.test.ts`
- Navigateur réel : `cd ui && npm run test:e2e` (Playwright, serveur de test 6014 sans Supabase, lancé et arrêté seul) · Lighthouse : `npm run qualite:lighthouse` (build de prod temporaire) → rapports dans `ui/rapports/` (non versionné)
- Production locale (Docker/nginx) : `./deploy.sh` → http://localhost:6111
- Tests avec vrais comptes (ponctuel, puis arrêter) : `npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,realtime,postgres-meta,supavisor` à la racine (stockage gardé pour les photos) → `cd ui && npm run test:supabase` (comptes, RLS, admin) → `npm run test:e2e:admin` (Playwright de l'admin, compte admin jetable) → `npx supabase stop`. E-mails reçus : http://127.0.0.1:54324. Base locale déjà créée : appliquer un nouveau fichier SQL par `docker exec -i supabase_db_hmode psql -U postgres -d postgres < supabase/<fichier>.sql`

## Conventions
- Code, noms et textes en français (composants `PageBoutique`, `CarteProduit`, état `usePanier`…).
- Toute UI passe par `@/design-system` et les tokens Tailwind de la charte (nacre, sable, bronze, or, encre). Pas de couleur en dur.
- Ne jamais inventer prix, tailles, matière, stock, délais ou affirmations commerciales : afficher « À confirmer » (`AConfirmer`).
- Une fonction sans données (filtre, tri, lien) est masquée, pas affichée à vide. Aucun bouton décoratif.
- Comptes, panier et commandes : Supabase (ADR 0005, schéma `supabase/schema.sql` + `lot-20-admin.sql` + `lot-21-admin-cle.sql`, RLS par compte).
- Administration `/admin` (ADR 0006) : connexion propre à trois champs (e-mail, mot de passe, clé de 12 chiffres), pas celle des clients ; compte admin créé par `npm run admin:sql` depuis `ADMIN_EMAIL`/`ADMIN_MOT_DE_PASSE`/`ADMIN_CLE` (sans `VITE_`) de `ui/.env`, ligne de `admins`, session déverrouillée 12 h par la clé ; droits vérifiés par la base (`est_admin()`), jamais par le navigateur. Jamais d'identifiant ni de clé dans une variable `VITE_`. Catalogue et réglages lus en base par `lib/donnees.ts`, appliqués SUR PLACE dans `produits`/`boutique`/`textes` de `lib/catalogue.ts` (repli : fichiers de `src/data/`). Commande = enregistrée par `passer_commande` puis message WhatsApp ; paiement à la livraison uniquement, jamais en ligne. Sans `.env`, retour au parcours WhatsApp seul (ADR 0001).
- Clés Supabase dans `ui/.env` (non versionné) : URL + clé publique seulement. Contrôle sans écriture : `cd ui && node --env-file=.env scripts/verifier-supabase.mjs`.
- Contacts et réseaux : source unique `ui/src/data/boutique.json`.
- Vérifier une page dans le navigateur par le DOM et les styles calculés, pas seulement par capture d'écran.
- Fin de lot : mettre à jour le tableau « Avancement » en haut de `plan.md`.

## Pièges connus
- Lectures bloquées dans `.claude/settings.json` : `ui/dist/`, `node_modules/`, `legacy/`, images et exports de `Scrapping/`.
- Ports : 6010 et 8765 sont pris par d'autres process de l'utilisateur, ne pas y toucher.
- Node ≥ 25 : `localStorage` global incomplet → stockage mémoire dans `ui/src/test/setup.ts`.
- `Intl` fr-MA donne « 1.250 » : `formatDH` utilise une regex + espaces insécables (` `). Les tests comparent avec ` `.
- Heredocs bash : ` ` y devient littéral → écrire ces fichiers avec Write.
- Un ancêtre transformé (transition de page framer-motion) casse `position: fixed` → élément fixé dans une page = `createPortal(…, document.body)`.
- Animation qui démarre cachée : `initial={actives ? … : false}` via `useAnimationsActives()`, sinon contenu invisible en « animations off ».
- Captures du navigateur intégré : prises en cours d'animation (contenu pâle) ; panneau masqué = animations en pause.
- Panier persistant : clé `hmode-panier`, `version: 1` (une autre version vide le panier).
- Tests : jamais le vrai Supabase (`env` vidé dans `vite.config.ts`) ; client simulé dans `src/test/*` (fausse base à RLS dans `synchro.test.ts`).
- Aucune donnée fictive dans le site (mode démo supprimé le 04/11). Prix d'essai seulement pour Playwright : `ui/e2e/donnees/prix-test.json`, servis par `vite --mode e2e`. Le 6013 écrit dans la vraie base : n'y passer que de vraies commandes.
- Nouvelles données de la base : les pages du catalogue se remontent (`key` = version), les pages à formulaire (commande, connexion, compte, contact) non, pour ne pas effacer une saisie. Écran qui charge puis laisse saisir : ignorer une réponse en retard (jeton, voir `useChargement`).
- `/admin` est rendu hors de `motion.main` (barres fixées en bas) et n'est pas préchargé pour les visiteurs.
- L'ancien site (`index.html`, `css/`, `js/`, `assets/`) reste en place jusqu'à la mise en ligne : ne pas le supprimer.
- `npx lightswind add …` réécrit `ui/tailwind.config.js` (plugin `lightswind/plugin` non installé → page blanche) : sauvegarder la config avant, la restaurer après, puis ré-habiller le composant (licence MIT en tête).

## Contexte
- Architecture : utiliser la Skill `codebase-overview`
- Décisions : `docs/decisions/` (lire seulement si utile)

# Compact instructions
Conserver : fichiers modifiés, décisions prises, erreurs de test non résolues, lot en cours de `plan.md`.
