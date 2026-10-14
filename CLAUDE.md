# Projet : H MODE (boutique e-commerce · Vite + React 18 + TS + Tailwind)
<!-- Notes mainteneur : invisibles pour Claude. Plan lot par lot : plan.md · données manquantes : TODO.md -->

## Commandes
- Dev : `./start.sh` → http://localhost:6011 · Démo (prix fictifs) : `./start.sh demo` → http://localhost:6012 · Arrêt : `./stop.sh`
- Dans `ui/` : Tests : `npm test` · Types : `npm run lint` · Build : `npm run build` · Images WebP : `npm run images`
- Test d'un seul fichier : `cd ui && npx vitest run src/test/logique.test.ts`
- Production locale (Docker/nginx) : `./deploy.sh` → http://localhost:6111

## Conventions
- Code, noms et textes en français (composants `PageBoutique`, `CarteProduit`, état `usePanier`…).
- Toute UI passe par `@/design-system` et les tokens Tailwind de la charte (nacre, sable, bronze, or, encre). Pas de couleur en dur.
- Ne jamais inventer prix, tailles, matière, stock, délais ou affirmations commerciales : afficher « À confirmer » (`AConfirmer`).
- Une fonction sans données (filtre, tri, lien) est masquée, pas affichée à vide. Aucun bouton décoratif.
- Commande = message WhatsApp pré-rempli + paiement à la livraison. Pas de backend, pas de paiement en ligne (ADR 0001).
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
- L'ancien site (`index.html`, `css/`, `js/`, `assets/`) reste en place jusqu'à la mise en ligne : ne pas le supprimer.

## Contexte
- Architecture : utiliser la Skill `codebase-overview`
- Décisions : `docs/decisions/` (lire seulement si utile)

# Compact instructions
Conserver : fichiers modifiés, décisions prises, erreurs de test non résolues, lot en cours de `plan.md`.
