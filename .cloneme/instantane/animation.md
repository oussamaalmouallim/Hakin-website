# Animations — H MODE, direction Original Fit

Relevées sur https://www.original-fit.ma le 2026-11-01 (CSS `/_next/static/chunks/0imoui9p88~.w.css` et chunks JS).
Toutes les animations sont coupées par le mode « animations off » et `prefers-reduced-motion`.

## Constantes (`ui/src/lib/animations.ts`)

| Constante | Valeur | Origine |
|---|---|---|
| `SEUIL_ENTETE` | 50 | Relevé : `window.scrollY>50` |
| `DUREE_MENU` | 0.4 | Relevé : `.mobile-panel { transition: transform .4s }` |
| `DUREE_PANNEAU` | 0.42 | Relevé : `.cart-drawer`, `.search-overlay { transition: transform .42s }` |

## Fiches

| ID | Élément | Déclencheur | Propriétés | Durée · courbe | Origine | Statut |
|---|---|---|---|---|---|---|
| A-01 | Carte produit | survol | `translateY(-6px)` + ombre `--ombre-carte-survol` | 350 ms · `--courbe-standard` | Relevé `hover:-translate-y-1.5 duration-350` | fait (`CarteProduit.tsx`) |
| A-02 | Image de la carte | survol de la carte | boutique : zoom 1.03 des photos pleine zone ; « meilleures ventes » : `scale(1.05) rotate(-3deg)` + disque `scale(1.14)` opacité .36 | 500 ms · `--courbe-standard` | Relevé `.ml-card:hover .ml-img`, `.ml-circle` | fait (`CarteProduit.tsx`) |
| A-03 | Bouton d'ajout rapide | survol de la carte | `opacity` 0 → 1, `translateY(10px)` → 0 | 250 ms | Relevé `.ml-quick` (masqué sur écran tactile) | fait (`index.css .ml-rapide`) |
| A-04 | Cœur | survol / clic | fond `--danger`, icône blanche | 150 ms · `--courbe-standard` | Relevé `hover:bg-(--danger) hover:text-white` | fait (`CarteProduit.tsx`) |
| A-05 | Bandeau noir | continu | `translateX(0 → -50%)` | 30 s linéaire, infini | Relevé `.animate-strip` | fait (`index.css .anim-bande`) |
| A-06 | Filigrane géant | continu | `translateX(0 → -50%)` | 60 s linéaire, infini | Relevé `.watermark-text` (ticker) | fait : derrière la carte « Suivre H MODE » (`index.css .anim-filigrane`) ; le héros H MODE est conservé sans filigrane |
| A-07 | Lien du menu | survol, page active | trait 1,5 px `scaleX(0 → 1)` | 350 ms · `--courbe-panneau` | Relevé `.nav-link-underline:after` (anime `width`, ici `transform` — même rendu) | fait (`index.css .lien-nav`) |
| A-08 | Burger | clic | traits 1 et 3 : `translateY(±7.8px) rotate(±45deg)` ; trait 2 : `opacity 0` | 250 ms | Relevé | fait (`EnTete.tsx`) |
| A-09 | Menu mobile | ouverture / fermeture | `translateX(100% → 0)` | `DUREE_MENU` · `--courbe-panneau` | Relevé `.mobile-panel` | fait (`Panneaux.tsx`) |
| A-10 | Recherche et panier | ouverture / fermeture | recherche `translateY(-100% → 0)` ; panier `translateX(100% → 0)` | `DUREE_PANNEAU` · `--courbe-panneau` | Relevé `.search-overlay`, `.cart-drawer` | fait (`Panneaux.tsx`, `Superposition.tsx`) |
| A-12 | Cartes « par type » | survol | image `rotate(-12° → -8°) scale(1.05)` ; flèche `rotate(-45deg) scale(1.08)` | 500 ms `--courbe-panneau` ; 350 ms | Relevé `.style-card:hover .sc-img`, `.sc-arrow` | fait (`index.css .carte-type`) |
| A-13 | Point de la pastille « Nouveau » / « À la une » (galerie) | continu | halo `box-shadow` 0 → 8 px | 1,6 s ease-in-out, infini | Relevé `.animate-livepulse` | fait (`index.css .anim-pouls`) |
| A-14 | Écran d'entrée | chaque chargement du site | fond encre plein écran ; nom `translateY(28px) → 0` + `opacity`, ligne mono jaune ; barre jaune 2 px `scaleX(0 → 1)` ; puis rideau `translateY(0 → -100%)` | nom 550 ms (retard 150 ms) à 200 ms ; barre 1,5 s ; rideau 750 ms `--courbe-rideau` à 1 900 ms ; retiré à 2 700 ms (`INTRO`) | Relevé composant d'intro de la référence (cas « langue déjà choisie ») ; sans choix de langue ni vidéo (site en français, vidéo exclue) ; défilement bloqué pendant l'intro ; aucun en « animations off » | fait (`Ambiance.tsx ChargeurMarque`) |
| A-11 | Sac de l'en-tête | chargement, une fois | `rotate` 0 → -12° → 10° → -6° → 4° → 0 | 1,2 s, retard 1,2 s | Relevé `.animate-jiggle` | fait (`index.css .anim-secousse`) |

Non repris : vidéo d'intro et bouton « Passer », écran de choix de langue.
