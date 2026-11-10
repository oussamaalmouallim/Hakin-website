# Prompts et modèles visuels de H MODE

Ce document sert à produire **tous** les visuels des réseaux dans une seule direction artistique : le **collage
urbain** de la couverture Facebook (10/11/2026). Les couleurs et les règles sont dans
[`IDENTITE_VISUELLE.md`](IDENTITE_VISUELLE.md) § 8 : relisez-le d'abord.

Image de référence : [`images/Gemini_Generated_Image_dg33pldg33pldg33.jpeg`](images/Gemini_Generated_Image_dg33pldg33pldg33.jpeg)
(3168 × 1344). **Joignez-la à chaque prompt** comme « image de style » : c'est elle qui tient la cohérence, plus que les
mots.

## 0. Trois règles avant de générer

1. **Le décor vient de l'IA, le produit vient de la boutique.** Un générateur invente les détails d'un vêtement (logo,
   coutures, couleur). Une pièce montrée à vendre est donc **toujours la vraie photo** de la pièce, posée dans un cadre
   du décor, dans Canva. Une image où l'IA a dessiné le vêtement sert seulement d'**ambiance**, jamais pour une pièce
   précise avec un prix.
2. **Aucun logo de marque dessiné par l'IA.** Écrire « no brand logos, no printed text on clothing » dans chaque prompt.
   Sur la couverture actuelle, l'IA a dessiné un t-shirt « Thrasher » : à remplacer si H MODE ne vend pas cette pièce
   (une marque affichée = une promesse de vente, et la marque appartient à son propriétaire).
3. **Le « H » vient du fichier officiel**, jamais de l'IA. L'IA le redessine à chaque fois (sur la couverture, sa
   forme a déjà changé). Dans Canva, posez `web/medias/marque/logo-monogramme-2000.png` et teintez-le en sable
   `#D4BB96` (Modifier l'image → Duotone ou couleur unie).

## 1. Tailles utiles

| Usage | Taille à préparer | Ce qui est visible |
|---|---|---|
| Photo de profil (Facebook, Instagram, TikTok) | 1080 × 1080 | affichée en **rond**, petite |
| Couverture Facebook | **1640 × 624** (la vôtre : 3168 × 1344, même rapport, à réduire) | recadrée différemment sur ordinateur et mobile ; la photo de profil recouvre le coin bas gauche sur ordinateur |
| Publication Instagram / Facebook | **1080 × 1350** (portrait 4:5) | plein écran du fil |
| Story, Reel, TikTok | **1080 × 1920** (9:16) | garder textes et logo hors des 250 px du haut et du bas |

Les tailles changent souvent : vérifiez-les dans l'application au moment de publier.

## 2. Bloc de style à coller dans chaque prompt

Tous les prompts ci-dessous finissent par ce bloc. Si vous écrivez un prompt à vous, collez-le aussi.

```
Style: urban streetwear collage in the style of the attached reference image. Deep charcoal black background
(#111111) with a faint street-map line texture in black (#050505). Bold diagonal dry-brush strokes in sand beige
(#D4BB96) and cream (#F5EFDF), slanted about 10 degrees. Tilted rectangular photo frames with thin offset borders in
sand beige and cream, layered like a scrapbook. Small halftone dot grids in mustard yellow (#E6B12A) in two corners.
Light distressed paper texture on the cream areas. Palette limited to black, sand beige, cream, with mustard yellow
only as tiny accents. No brand logos, no printed text on clothing, no letters, no watermark.
```

## 3. Photo de profil

Le monogramme sable sur le noir à plan de ville : le même univers que la couverture, lisible en petit rond.

> Using the attached logo as an exact reference, create a square 1080×1080 profile picture. Keep the monogram exactly
> as provided: a serif capital "H" crossed by a thin rising swoosh. Do not redraw, restyle, rotate or add letters.
> Render it in flat sand beige (#D4BB96), perfectly centered, about 55% of the width, so it stays fully visible inside
> a circular crop. Background: deep charcoal black (#111111) with a very faint street-map line texture (#050505).
> No brush strokes, no dots, no frames, no shadow, no glow, no text.

Joindre `logo-profil-1080.png`. Si la forme du « H » change, faites-le dans Canva à la place : fond `#111111`,
`logo-monogramme-2000.png` teinté `#D4BB96`, centré à 55 %. Le **même** fichier sur les trois réseaux, le même jour.

## 4. Couverture Facebook

La vôtre est faite. Pour la refaire (nouvelle saison, autres pièces), générez **le décor avec des cadres vides**, puis
posez vos vraies photos dans Canva :

> Wide 1640×624 banner. Left third: deep charcoal black panel with a faint street-map texture and an empty area for a
> large logo. Center and right: six empty tilted photo frames of different sizes (one large in the center, two stacked
> on each side), filled with plain light grey (#E6E6E6) placeholders, with offset sand beige and cream borders.
> Diagonal sand beige and cream brush strokes behind the frames, mustard yellow halftone dots in the bottom left and
> top right. Keep the bottom-left corner free of important elements. [bloc de style § 2]

Dans Canva : un **cadre** (Éléments → Cadres) par emplacement gris, glissez-y les photos de la boutique, « H » officiel
sable à gauche. Vérifiez l'aperçu sur téléphone **et** sur ordinateur.

## 5. Les modèles de publication

Méthode : générez **une fois** chaque décor ci-dessous, faites-en un modèle Canva, puis dupliquez-le. Seule la photo
change. Textes posés dans Canva, jamais par l'IA (elle écrit mal) :
- titre en **Archivo Black**, capitales, crème `#F5EFDF` sur le noir ou noir `#111111` sur le sable ;
- texte en **Space Grotesk**, étiquette en **JetBrains Mono** capitales espacées ;
- « H » officiel sable, petit, toujours en bas à droite ;
- mention fixe en bas : « Paiement à la livraison · Casablanca » ;
- un prix seulement s'il est **saisi dans l'admin**, sinon « Prix sur WhatsApp ». Jamais un prix inventé.

### Modèle 1 — Produit seul (1080 × 1350)

> Vertical 1080×1350 social media template. One large empty tilted photo frame in the center (about 70% of the height),
> plain light grey (#E6E6E6) placeholder inside, offset sand beige border behind it. A sand beige brush-stroke band
> across the bottom 20% for a title. Black street-map background visible at the top for a small label.
> [bloc de style § 2]

Dans le cadre : la **vraie photo**, détourée (Canva → Supprimer l'arrière-plan) ou entière. En haut : la marque
(JetBrains Mono, « NIKE »). Sur la bande sable : le nom de la pièce en Archivo Black noir, prix ou « Prix sur
WhatsApp ».

### Modèle 2 — Vêtement porté (1080 × 1350 ou Story 1080 × 1920)

> Vertical 1080×1920 story template. One full-height empty photo frame slightly tilted, light grey placeholder,
> offset cream border. Brush strokes escaping from the frame edges on the left and right. Mustard dots near the top
> right corner, outside the top 250 pixels. Free black area at the bottom (outside the last 250 pixels) for one line
> of text. [bloc de style § 2]

La photo portée **réelle** dans le cadre. « Porté en taille M » seulement si c'est vrai. Pas de texte sur le visage.

### Modèle 3 — Plusieurs produits (carrousel 1080 × 1350)

> Vertical 1080×1350 collage template with three or four empty tilted frames of different sizes overlapping like the
> reference image, light grey placeholders, sand and cream offset borders. A wide sand brush stroke at the top for a
> title. [bloc de style § 2]

- Diapositive 1 : ce collage, titre « SÉLECTION SWEATS ».
- Diapositives suivantes : une pièce par diapositive avec le modèle 1.
- Dernière : « Commandez sur le site ou sur WhatsApp » + adresse du site, sur le noir.

### Modèle 4 — Nouvel arrivage (carrousel ou Reel)

> Vertical 1080×1350 cover. Mostly black street-map background, one bold diagonal sand beige brush stroke crossing
> the middle, empty for a large title. Two small empty tilted frames at the bottom. A small mustard yellow (#E6B12A)
> rectangle tag shape top left, empty. [bloc de style § 2]

Titre « NOUVEL ARRIVAGE » en Archivo Black noir sur le pinceau sable ; « NOUVEAU » en JetBrains Mono noir dans
l'étiquette moutarde. Puis les pièces une par une, finir par le collage du modèle 3.

### Modèle 5 — Offre (seulement si l'offre est réelle et saisie dans l'admin)

> Vertical 1080×1350 template. Black street-map background, one empty tilted frame on the left half, a vertical cream
> brush-stroke panel on the right half, empty for prices. [bloc de style § 2]

Sur le panneau crème : ancien prix barré gris `#6B6B6B`, nouveau prix en Archivo Black noir, « SOLDES » petit en
rouge brique `#C8341B`, dates de l'offre en clair. Pas de compte à rebours ni de « stock limité » si ce n'est pas vrai.

### Modèle 6 — Plusieurs couleurs d'un même produit (1080 × 1350)

> Vertical 1080×1350 template with three identical empty frames side by side, same size, slightly tilted the same
> way, light grey placeholders, a thin sand beige band under each frame for a label. [bloc de style § 2]

Une photo **réelle** par coloris, même cadrage ; le nom du coloris en JetBrains Mono sous chaque cadre. Un coloris sans
photo n'apparaît pas : jamais de couleur fabriquée par retouche.

## 6. Images d'ambiance générées par l'IA (sans produit à vendre)

Pour une publication d'humeur, un fond de Story, une bannière : un homme en tenue casual dans le même univers.

> Editorial streetwear photo, vertical 1080×1350. A young man, casual outfit in black, denim and mustard yellow
> tones, plain garments without any logo or print, standing in a modern city street with white concrete architecture,
> overcast soft daylight, shallow depth of field, natural pose, hands in pockets. Muted colors, realistic skin, no
> text. Then place the photo in a tilted frame with sand beige offset border over a black street-map background with
> sand brush strokes and mustard halftone dots, like the attached reference.

À ne pas faire avec ces images : les présenter comme une pièce en stock, leur mettre un prix, ou y ajouter un logo de
marque. Pour une pièce précise, revenir aux modèles du § 5 avec la vraie photo.

## 7. Où ranger les fichiers

- Référence de style : `marketing/images/` (la couverture).
- Décors générés et visuels finis : `marketing/visuels/` (créer le dossier au besoin), une version finale par
  publication.

## Sources

- Tailles Facebook (couverture, photo de profil) : [ContentStudio](https://contentstudio.io/blog/facebook-cover-photo-size),
  [Metricool](https://metricool.com/facebook-image-sizes/), [Linearity](https://linearity.io/blog/facebook-size-guide/).
- Logo actuel et décision du 07/11/2026 : `docs/projet/plan.md` (décision D5).
- Couleurs du § 2 : mesurées le 10/11/2026 sur la couverture de référence (moyenne des pixels de chaque zone).
