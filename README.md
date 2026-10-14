# H MODE — boutique e-commerce premium · Casablanca

Boutique de vêtements premium homme. Commande sur WhatsApp, paiement à la livraison.
Plan de refonte complet, lot par lot : [`plan.md`](plan.md).

## Arborescence

```
Hakin-website/
├── ui/                 ← nouvelle boutique (Vite + React + TypeScript + Tailwind + framer-motion)
│   ├── public/images/  ← images publiées (WebP générés par `npm run images`)
│   ├── scripts/        ← optimisation d'images (sharp) + correspondance photos sources
│   └── src/
│       ├── data/            produits.json · categories.json · collections.json · boutique.json
│       ├── design-system/   tokens appliqués : Bouton, Champ, Sélecteurs, Modale, Tiroir, Notifications…
│       ├── components/      En-tête, menus, recherche, mini-panier, pied de page, carte produit
│       │   └── lightswind/  composants Lightswind (MIT) ré-habillés H MODE
│       ├── features/        accueil · catalogue · produit · panier · commande · compte · infos
│       ├── state/           panier, favoris, compte local, animations (Zustand + localStorage)
│       └── lib/             catalogue, filtres, recherche, message WhatsApp, formats
├── server/             ← vide (aucun backend pour l'instant)
├── Template/           ← référence de direction artistique (hero.png)
├── index.html, css/, js/, assets/   ← ANCIEN site statique (toujours fonctionnel, à retirer à la mise en ligne)
├── legacy/             ← fichiers archivés (export WhatsApp Web sauvegardé par erreur)
├── Scrapping/          ← recherche visuelle (usage interne, images non publiables)
├── Planning/           ← documents de stratégie
└── start.sh · stop.sh · deploy.sh · Dockerfile · docker-compose.yml · nginx.conf
```

## Lancer

```bash
./start.sh          # dev → http://localhost:6011
./start.sh demo     # démo → http://localhost:6012 (prix et tailles FICTIFS pour tester le panier, bandeau visible)
./stop.sh
./deploy.sh         # production locale Docker/nginx → http://localhost:6111
```

Dans `ui/` : `npm run build` · `npm run lint` (types) · `npm test` (Vitest) · `npm run images` (régénère les WebP).

## Ajouter ou modifier un produit

1. Déposer la photo dans `ui/medias/produits/<slug>/<n>.jpg` (`n` = numéro de vue, 1 = photo de la carte). Voir `ui/medias/LISEZMOI.md`.
2. `cd ui && npm run images`.
3. Ajouter l'entrée dans `ui/src/data/produits.json`. Champs clés :
   - `prixDH` : `null` affiche « Prix sur demande » et bloque l'ajout au panier ; un nombre active le panier.
   - `tailles` : `[{ "taille": "M", "disponible": true }]`. Une taille indisponible est barrée.
   - `disponibilite` : `disponible` | `epuise` | `a_confirmer`.
   - `aConfirmer` : liste des informations pas encore validées (affichées « À confirmer », jamais inventées).
4. Coordonnées, réseaux, paiement, livraison, retours : `ui/src/data/boutique.json` (source unique, notamment du numéro WhatsApp).

## Fonctionnement de la commande

Panier → formulaire de commande (validation des champs) → WhatsApp s'ouvre avec le récapitulatif pré-rempli
(référence, articles, total, coordonnées, « paiement à la livraison ») → page de confirmation.
Le panier n'est vidé que lorsque le client confirme avoir envoyé le message. **Aucun paiement en ligne,
aucun stock temps réel, aucun compte serveur** : le compte client est enregistré dans le navigateur (voir `plan.md`, annexe G).

## Mise en ligne

Hébergement statique (Netlify, GitHub Pages) : publier `ui/dist/`. Le fichier `ui/public/_redirects` gère les routes
de l'application sur Netlify. Docker/nginx est fourni pour un serveur propre.

## Contacts officiels

WhatsApp +212 625 490 034 · Instagram [@hmod_e2121](https://www.instagram.com/hmod_e2121/) ·
[Facebook](https://www.facebook.com/profile.php?id=61594200016066)
