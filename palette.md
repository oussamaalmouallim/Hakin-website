# Palette — H MODE, direction Original Fit

Ce fichier est la référence ; `ui/src/styles/tokens.css` en est le miroir exact.
Changer une valeur ici, puis demander « applique palette.md » : le code suit.

- Source : https://www.original-fit.ma/shop et `/` — relevé le 2026-11-01, à 1024 px.
- Règle : Original Fit définit le design principal ; le beige H MODE n'est qu'une touche
  (surfaces secondaires, pastilles de marque, détails du héros, logo).
- Tailwind lit ces variables (`ui/tailwind.config.js`) ; les anciens noms (`nacre`, `sable`,
  `bronze`, `or`) pointent vers ces rôles le temps de la refonte.

## Couleurs — référence

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `--fond` | `#f5f4f0` | Relevé `:root --bg` | fond de toutes les pages, fond des cartes |
| `--fond-2` | `#efede7` | Relevé `:root --bg-2` | zone image des cartes, section « par style » |
| `--fond-3` | `#e8e5dc` | Relevé `:root --bg-3` | survols, champs |
| `--encre` | `#0a0a0a` | Relevé `:root --ink` | texte, boutons pleins, sections sombres |
| `--encre-douce` | `#1c1c1a` | Approximé | cartes sur fond sombre |
| `--gris` | `#8a8a8a` | Relevé `:root --muted` | étiquettes mono, prix barré, textes secondaires |
| `--gris-clair` | `#b4b2ac` | Approximé | textes désactivés, placeholders |
| `--accent` | `#f5d000` | Relevé `:root --accent` | pastilles « Nouveau », bouton d'appel, sélection |
| `--accent-doux` | `#ffe875` | Relevé `:root --accent-soft` | survol de l'accent |
| `--danger` | `#c8341b` | Relevé `:root --danger` | lien « Soldes » de la source, erreurs |
| `--filigrane` | `#e8e6e0` | Relevé `:root --watermark` | grand mot en filigrane du héros |
| `--ligne` | `#0a0a0a1a` | Relevé `:root --line` | bordure des cartes, séparateurs |
| `--ligne-forte` | `#0a0a0a38` | Relevé `:root --line-strong` | pilules de taille, bouton « Connexion » |
| `--blanc` | `#ffffff` | Relevé | fonds des packshots |

## Couleurs — touche H MODE

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `--beige` | `#e4d0b7` | H MODE (sable-200) | pastille marque, fond du héros, puce active |
| `--beige-clair` | `#ede3d5` | H MODE (sable-100) | fond doux de blocs éditoriaux |
| `--beige-pale` | `#f4ede3` | H MODE (sable-50) | fond derrière les photos portées |
| `--beige-fonce` | `#836240` | H MODE (bronze) | monogramme, filets fins |
| `--beige-tres-fonce` | `#5f4831` | H MODE (bronze foncé) | dégradé du monogramme |
| `--beige-moyen` | `#9c8366` | H MODE (bronze clair) | dégradé du monogramme |

## États

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `--succes` | `#5b6b3a` | H MODE | confirmations |
| `--alerte` | `#a9742a` | H MODE | stock faible |
| `--whatsapp` | `#25d366` | Relevé (charte WhatsApp) | bouton de commande WhatsApp |

## Polices

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `--police-titre` | `"Archivo Black", "Arial Black", sans-serif` | Relevé `h1` | titres en capitales, noms et prix produit |
| `--police-texte` | `"Space Grotesk", system-ui, sans-serif` | Relevé `body` | texte courant, navigation |
| `--police-mono` | `"JetBrains Mono", ui-monospace, monospace` | Relevé `.font-mono` | étiquettes, compteurs, pastilles, tri |
| `--police-marque` | `"Cormorant Garamond", Georgia, serif` | H MODE | logo et monogramme seulement |

## Formes et ombres

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `--rayon-carte` | `20px` | Mesuré `article` @1024 | cartes produit, blocs |
| `--rayon-bloc` | `14px` | Approximé | petits blocs, icônes des arguments |
| `--ombre-carte-survol` | `0 22px 36px -22px rgba(10, 10, 10, 0.22)` | Relevé `article:hover` | carte au survol |
| `--ombre-flottant` | `0 24px 60px -28px rgba(10, 10, 10, 0.35)` | Approximé | tiroirs, recherche |

## Mouvement

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `--courbe-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Relevé `transition` des cartes | survols, boutons |
| `--courbe-maison` | `cubic-bezier(0.16, 1, 0.3, 1)` | H MODE | entrées de page, révélations |
| `--courbe-panneau` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Relevé `.mobile-panel`, `.cart-drawer`, `.nav-link-underline:after` | menu mobile, recherche, panier, soulignés |

## En-tête et panneaux

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `--voile-entete` | `#f5f4f0b8` | Relevé `.nav-scrolled` | fond de l'en-tête après 50 px de défilement (+ flou 18 px) |
| `--ligne-entete` | `#0a0a0a14` | Relevé `.nav-scrolled`, `.cart-drawer` | filet bas de l'en-tête, bord des panneaux |
| `--ombre-tiroir` | `-30px 0 60px -20px #0a0a0a2e` | Relevé `.cart-drawer` | panier latéral |
