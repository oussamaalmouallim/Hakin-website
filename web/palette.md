# Palette — H MODE, direction Original Fit

Ce fichier est la référence ; `web/src/styles/tokens.css` en est le miroir exact.
Changer une valeur ici, puis demander « applique palette.md » : le code suit.

- Source : https://www.original-fit.ma/shop et `/` — relevé le 2026-11-01, à 1024 px.
- Règle : Original Fit définit le design principal ; le beige H MODE n'est qu'une touche
  (surfaces secondaires, pastilles de marque, détails du héros, logo).
- Tailwind lit ces variables (`web/tailwind.config.js`) ; les anciens noms (`nacre`, `sable`,
  `bronze`, `or`) pointent vers ces rôles le temps de la refonte.

## Couleurs — référence

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `--fond` | `#f5f4f0` | Relevé `:root --bg` | fond de toutes les pages, fond des cartes |
| `--fond-2` | `#efede7` | Relevé `:root --bg-2` | zone image des cartes, section « par style » |
| `--fond-3` | `#e8e5dc` | Relevé `:root --bg-3` | survols, champs |
| `--encre` | `#0a0a0a` | Relevé `:root --ink` | texte, boutons pleins, sections sombres |
| `--encre-douce` | `#1c1c1a` | Approximé | cartes sur fond sombre |
| `--gris` | `#6b6b6b` | Approximé — choix H MODE du 03/11 pour l'accessibilité (4,8:1 sur `--fond`, 4,55:1 sur `--fond-2`) ; source : `#8a8a8a` Relevé `:root --muted` (3,1:1) | étiquettes mono, prix barré, textes secondaires |
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
| `--courbe-rideau` | `cubic-bezier(0.76, 0, 0.24, 1)` | Relevé intro (`transform 0.75s`) | sortie de l'écran d'entrée vers le haut |
| `--courbe-panneau` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Relevé `.mobile-panel`, `.cart-drawer`, `.nav-link-underline:after` | menu mobile, recherche, panier, soulignés |

## En-tête et panneaux

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `--voile-entete` | `#f5f4f0b8` | Relevé `.nav-scrolled` | fond de l'en-tête après 50 px de défilement (+ flou 18 px) |
| `--ligne-entete` | `#0a0a0a14` | Relevé `.nav-scrolled`, `.cart-drawer` | filet bas de l'en-tête, bord des panneaux |
| `--ombre-tiroir` | `-30px 0 60px -20px #0a0a0a2e` | Relevé `.cart-drawer` | panier latéral |

## Administration (`/admin`, classe `theme-admin` sur `<html>`)

Identité d'application technique (lot 39, 11/11) : fond gris chaud, surfaces blanches, texte encre, police de texte pour
les titres, beige en accent discret. `theme-admin › x` = la variable `--x` redéfinie sous `.theme-admin` (la valeur globale reste celle de la boutique). Choix H MODE (Approximé), inspiré de Lightswind. Ne s'applique jamais aux pages publiques.

| Variable | Valeur | Origine | Usage |
|---|---|---|---|
| `theme-admin › fond` | `#f6f5f2` | Approximé | fond des pages d'admin |
| `theme-admin › fond-2` | `#ffffff` | Approximé | cartes, tableaux, barre du haut |
| `theme-admin › fond-3` | `#f0eeea` | Approximé | survols, en-têtes de tableau |
| `theme-admin › encre` | `#17171a` | Approximé | texte, boutons principaux |
| `theme-admin › encre-douce` | `#26262b` | Approximé | survol des boutons principaux |
| `theme-admin › gris` | `#5d5d66` | Approximé, 6,3:1 sur blanc | textes secondaires |
| `theme-admin › gris-clair` | `#a3a3ab` | Approximé | placeholders, désactivés |
| `theme-admin › ligne` | `#17171a14` | Approximé | bordures des cartes, séparateurs |
| `theme-admin › ligne-forte` | `#17171a2b` | Approximé | bordures des champs |
| `theme-admin › succes` | `#2e7349` | Approximé, 5,6:1 sur blanc | « Opérationnel », réussites |
| `theme-admin › danger` | `#b4321c` | Approximé, 5,9:1 sur blanc | échecs, « Indisponible » |
| `theme-admin › alerte` | `#a8661a` | Approximé | « Dégradé » (texte en `bronze-fonce`) |
| `theme-admin › police-titre` | `var(--police-texte)` | Approximé | titres en Space Grotesk, sans capitales |
| `theme-admin › rayon-carte` / `theme-admin › rayon-bloc` | `14px` / `10px` | Approximé | cartes / champs et boutons |
| `--admin-barre` | `#121214` | Approximé | barre latérale |
| `--admin-barre-2` | `#1d1d21` | Approximé | survol et élément actif de la barre |
| `--admin-barre-ligne` | `#ffffff14` | Approximé | séparateurs de la barre |
| `--admin-barre-texte` | `#a6a6ae` | Approximé, 7,4:1 sur la barre | liens de la barre |
| `--admin-accent` | `#c6a57c` | H MODE (beige) | repère de l'élément actif, accents |
| `--admin-accent-fonce` | `#7a5a36` | H MODE (bronze) | accent en texte sur fond clair |
| `--admin-info` | `#35618c` | Approximé | informations, liens d'action |
| `--admin-serie-1` | `#8a6a45` | Approximé | graphiques : série « site », visiteurs |
| `--admin-serie-2` | `#35618c` | Approximé | graphiques : série « API », pages vues, appels acceptés |
| `--admin-serie-3` | `#b4321c` | Approximé | graphiques : échecs, appels bloqués |
