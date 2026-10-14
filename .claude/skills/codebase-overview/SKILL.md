---
name: codebase-overview
description: Architecture, dossiers clés et flux de données de la boutique H MODE (ui/). À utiliser avant d'explorer le code ou de modifier plusieurs modules.
---

# Vue d'ensemble
- `ui/` : la boutique (Vite + React 18 + TS + Tailwind + framer-motion + React Router + Zustand). Seule appli active.
- `ui/src/data/` : catalogue JSON (`produits.json`, `produits.demo.json`, `categories.json`, `collections.json`, `boutique.json`).
- `ui/src/lib/` : logique pure — `catalogue.ts` (chargement + fusion démo, `estCommandable`, `srcImage`), `filtres.ts` (filtres, facettes croisées, URL), `recherche.ts`, `whatsapp.ts` (messages + liens), `format.ts` (`formatDH`, téléphone, référence), `animations.ts`.
- `ui/src/state/` : stores Zustand persistés — `panier.ts`, `favoris.ts`, `compte.ts` (compte local), `interface.ts` (panneau ouvert), `animations.tsx` (on/off + reduced-motion).
- `ui/src/design-system/` : composants de base (Bouton, Champ, Sélecteurs, Modale/Tiroir, Notifications, Etats, Marque, Image, Prix…), exportés par `index.ts`. Vitrine : route `/design-system`.
- `ui/src/components/` : coque du site — `EnTete`, `Panneaux` (mini-panier, menu mobile, recherche), `PiedDePage`, `CarteProduit`, `Ambiance` (bandeau, WhatsApp flottant, loader, bandeau démo), `lightswind/` (seasonal-hover-cards = carte produit, scroll-reveal, marquee-menu, looping-words, count-up, shiny-text, ré-habillés).
- `ui/src/features/<page>/` : une page par dossier — accueil, catalogue (boutique, filtres, collections, recherche), produit, panier, commande (+ confirmation), compte, infos (contact, maison, pages légales, 404).
- `ui/src/App.tsx` : routes + transition de page. `main.tsx` : polices, fournisseurs, variable `--demo-h`.
- `ui/src/test/` : Vitest — `logique.test.ts` (lib + stores), `parcours.test.tsx` (parcours d'achat).
- `ui/medias/` : dossier unique des photos originales (`produits/<slug>/<n>.jpg`, `campagne/`, `provenance.json`).
- `ui/scripts/` : `optimiser-images.mjs` (sharp) : `medias/` → WebP 480/960 dans `ui/public/images/` (généré).
- Racine : `start.sh`/`stop.sh`/`deploy.sh`, Docker + nginx, `plan.md` (lots), `TODO.md` (données attendues).
- Hors appli : ancien site statique (`index.html`, `css/`, `js/`, `assets/`), `Scrapping/` (Python, interne), `legacy/` (archives), `Template/hero.png` (maquette).

# Flux principal (commande)
Fiche produit (coloris + taille) → `usePanier.ajouter` → mini-panier / `/panier` → `/commande` (validation `validerCommande`)
→ `messageCommande` + `lienWhatsApp` → `window.open` WhatsApp → `/commande/confirmation`
→ « J'ai envoyé ma commande » → `useCompte.ajouterCommande` + `usePanier.vider`.
Produit sans prix (`prixDH: null`) : pas de panier, bouton « Demander prix et disponibilité » (WhatsApp).

# Points d'entrée par type de tâche
- Bug UI d'une page : `ui/src/features/<page>/`, puis le composant du design system concerné.
- Nouveau composant réutilisable : `ui/src/design-system/` + l'ajouter à `index.ts` et à `PageDesignSystem.tsx`.
- Produit, prix, contacts : `ui/src/data/` (règle `donnees.md`), jamais en dur dans les composants.
- Filtres / tri / recherche : `ui/src/lib/filtres.ts`, `recherche.ts`, UI dans `features/catalogue/`.
- Message ou numéro WhatsApp : `ui/src/lib/whatsapp.ts` + `boutique.json`.
- Couleurs, typo, animations globales : `ui/tailwind.config.js`, `ui/src/styles/index.css`.
- Intégration externe (paiement, stock, backend) : rien n'existe ; `server/` est vide. Lire d'abord `docs/decisions/0001`.

# Mise à jour
Mettre à jour cette Skill quand un module est ajouté ou déplacé (en fin de tâche).
