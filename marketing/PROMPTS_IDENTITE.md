# Prompts et modèles visuels de H MODE

Ce document sert à produire les visuels des réseaux **sans créer une nouvelle identité**. Il s'appuie sur
[`IDENTITE_VISUELLE.md`](IDENTITE_VISUELLE.md) : relisez-le d'abord.

## 0. Avant de générer quoi que ce soit

**Le logo de profil existe déjà** : `web/medias/marque/logo-profil-1080.png` (le « H » bronze sur fond crème,
1080 × 1080). Pour Instagram, Facebook et TikTok, **ce fichier suffit** : c'est le plus fidèle.

Un générateur d'images (ChatGPT, Gemini, Midjourney, Canva…) ne recopie jamais un logo à l'identique : il le redessine.
Les prompts ci-dessous servent donc à deux choses seulement :
1. obtenir une **variante de mise en page** du même logo (fond beige, version pour fond sombre) ;
2. créer les **décors** (couverture, fonds) autour du logo, que vous posez ensuite vous-même dans Canva.

Méthode sûre : **joignez toujours `logo-profil-1080.png` ou `logo-monogramme-2000.png` au prompt** (« image de
référence ») et demandez de le garder tel quel. Si le résultat change la forme du « H », jetez-le et utilisez le fichier
d'origine.

## 1. Tailles utiles

| Usage | Taille à préparer | Ce qui est visible | Source |
|---|---|---|---|
| Photo de profil Facebook | 1080 × 1080 (carré) | affichée en rond, environ 170 px sur ordinateur, 128 px sur mobile | guides 2026 cités plus bas |
| Photo de profil Instagram | 1080 × 1080 | affichée en **rond**, petite | même logique : garder le « H » au centre |
| Photo de profil TikTok | 1080 × 1080 | affichée en **rond** | idem |
| Couverture Facebook | **1640 × 624** | recadrée différemment sur ordinateur et mobile | voir § 3 |
| Publication Instagram / Facebook | **1080 × 1350** (portrait 4:5) | plein écran du fil | format le plus grand dans le fil |
| Story, Reel, TikTok | **1080 × 1920** (9:16) | plein écran vertical | garder textes et logo hors des 250 px du haut et du bas (boutons de l'application) |

Les tailles des réseaux changent souvent : vérifiez-les dans l'application au moment de publier.

## 2. Logo de profil — Instagram, Facebook, TikTok

**Règle de cohérence** : le **même** fichier sur les trois réseaux. Un client doit reconnaître H MODE d'un réseau à
l'autre. Dans un rond, le « H » doit occuper environ 55 à 60 % du diamètre, centré.

### Prompt — variante fond beige (si vous voulez plus de chaleur)

> Using the attached logo as an exact reference, create a square 1080×1080 social media profile picture.
> Keep the monogram exactly as provided: a serif capital "H" (Cormorant Garamond style) with a bronze gradient from
> #9C8366 to #836240 to #5F4831, crossed by a thin rising swoosh. Do not redraw, restyle, rotate or add letters.
> Place it perfectly centered, occupying about 55% of the width, so it stays fully visible inside a circular crop.
> Flat solid background in warm beige #E4D0B7. No texture, no shadow, no glow, no border, no text, no gradient on the
> background. Clean, premium, minimal, casual fashion brand from Casablanca.

### Prompt — variante pour fond sombre (bannière d'événement, rarement)

> Using the attached logo as an exact reference, create a square 1080×1080 image. Same serif "H" monogram with its
> rising swoosh, unchanged shape, rendered in solid cream #F5F4F0 (no gradient). Centered, about 55% of the width.
> Flat background in deep ink black #0A0A0A. No texture, no shadow, no extra text. Minimal and premium.

### Instagram, Facebook, TikTok : un seul fichier

| Réseau | Fichier | Remarque |
|---|---|---|
| Instagram | `logo-profil-1080.png` | même fichier partout |
| Facebook | `logo-profil-1080.png` | la page Facebook s'appelle « H MODE » |
| TikTok | `logo-profil-1080.png` | TikTok compresse : gardez le fichier d'origine en PNG |

Si vous choisissez la variante beige, mettez-la **sur les trois réseaux le même jour**.

## 3. Couverture Facebook

Facebook recadre la couverture différemment sur ordinateur et sur mobile, et la photo de profil recouvre le **coin bas
gauche** sur ordinateur. D'où la règle : tout ce qui compte (logo, nom, phrase) dans la **zone centrale**, rien
d'important dans les bords ni en bas à gauche.

Composition conseillée (1640 × 624) :
- fond : la lumière et les matières du héros (mur clair, ciel voilé, olivier), ou un aplat beige `#E4D0B7` ;
- au centre-droit : « H MODE » en Archivo Black, encre `#0A0A0A`, et en dessous une ligne en Space Grotesk :
  « Casablanca · Paiement à la livraison » ;
- monogramme bronze petit, à côté du nom, jamais en grand au centre (la photo de profil le montre déjà) ;
- pas de produit précis : la couverture reste valable des mois.

### Prompt — décor de couverture (sans texte : le texte se pose ensuite dans Canva)

> Wide 1640×624 photographic background for a casual menswear boutique in Casablanca. A calm Mediterranean terrace at
> soft late-afternoon light: warm off-white plaster wall (#F5F4F0 to #E4D0B7 tones), a potted olive tree on the far
> left edge, hazy sky and distant hills, beige stone bench. Muted, warm, natural palette: cream, beige, light bronze.
> Leave the central and right area calm and uncluttered for text. No people, no clothing, no logos, no text, no
> watermark. Photorealistic, soft shadows, editorial, minimal.

Puis dans Canva : importez l'image, ajoutez « H MODE » (Archivo Black, `#0A0A0A`) et la ligne
« Casablanca · Paiement à la livraison » (Space Grotesk, `#6B6B6B`) dans la zone centrale-droite, et le monogramme
`logo-monogramme-2000.png` petit à gauche du nom. Vérifiez l'aperçu sur téléphone **et** sur ordinateur.

## 4. Visuels produits dans Canva

### Règles communes aux six modèles

- **Ne jamais déformer le produit** : pas d'étirement, pas de recoloration, pas d'outil qui « améliore » la matière.
  Les outils autorisés : détourage du fond (« Background Remover »), recadrage, luminosité **légère**.
- Fond : crème `#F5F4F0`, beige `#E4D0B7` ou sable pâle `#F4EDE3`.
- Titre : Archivo Black, capitales, encre. Texte : Space Grotesk. Étiquette : JetBrains Mono capitales.
- Monogramme bronze petit, toujours dans le même coin (en bas à droite).
- Un prix n'apparaît que s'il est **saisi dans l'admin**. Sinon : « Prix sur WhatsApp ». Jamais un prix inventé.
- Mention fixe en bas : « Paiement à la livraison · Casablanca ».
- Créez chaque modèle **une fois** dans Canva, enregistrez-le, puis dupliquez-le : seule la photo change.

### Modèle 1 — Produit seul (1080 × 1350)

| Zone | Contenu |
|---|---|
| Haut (15 %) | marque en JetBrains Mono (« NIKE ») |
| Centre (65 %) | pièce détourée, centrée, sur crème, légère ombre portée douce **ou** aucune |
| Bas (20 %) | nom en Archivo Black (« ACG LAVA FLOW »), prix ou « Prix sur WhatsApp », mention fixe |

Prompt pour un **fond** seulement (si vous voulez un décor, le produit reste la vraie photo) :
> Minimal studio background 1080×1350, seamless warm cream paper (#F5F4F0) with a very soft beige floor gradient
> (#EFEDE7), soft daylight from the left, subtle natural shadow area in the center for a product. No objects, no text.

### Modèle 2 — Vêtement porté (1080 × 1350 ou Story 1080 × 1920)

- La photo portée prend tout le cadre ; un bandeau sable pâle `#F4EDE3` en bas porte le nom et la taille portée
  (« Porté en taille M », seulement si c'est vrai).
- Pas de texte sur le visage. Logo en bas à droite.

### Modèle 3 — Plusieurs produits (carrousel 1080 × 1350)

- Diapositive 1 : titre (« SÉLECTION SWEATS ») sur beige + 2 ou 3 pièces en petit.
- Diapositives suivantes : une pièce par diapositive, même mise en page que le modèle 1.
- Dernière diapositive : « Commandez sur le site ou sur WhatsApp » + adresse du site.

### Modèle 4 — Nouvelle collection (carrousel ou Reel)

- Couverture : fond beige, « NOUVEL ARRIVAGE » en Archivo Black, petite pastille jaune `#F5D000` « NOUVEAU ».
- Puis les pièces une par une ; finir par la grille de toutes les pièces.

### Modèle 5 — Promotion ou offre (seulement si l'offre est réelle et saisie dans l'admin)

- Prix barré en gris `#6B6B6B` + nouveau prix en encre, mot « SOLDES » en rouge brique `#C8341B`, petit.
- Dates de l'offre écrites en clair. Pas de compte à rebours inventé, pas de « stock limité » si ce n'est pas vrai.

### Modèle 6 — Plusieurs couleurs d'un même produit (1080 × 1350)

- Une photo **réelle** par coloris, toutes au même cadrage, alignées (2 ou 3 colonnes), le nom du coloris sous chacune
  en JetBrains Mono.
- Jamais une couleur fabriquée par retouche : si la photo d'un coloris manque, ce coloris n'apparaît pas.

## 5. Où ranger les fichiers

Les visuels finis peuvent être rangés dans `marketing/visuels/` (créer le dossier au besoin). Évitez d'y mettre des
fichiers lourds en double : une version finale par publication suffit.

## Sources

- Tailles Facebook (couverture, photo de profil) : [ContentStudio](https://contentstudio.io/blog/facebook-cover-photo-size),
  [Metricool](https://metricool.com/facebook-image-sizes/), [Linearity](https://linearity.io/blog/facebook-size-guide/).
- Logo actuel et décision du 07/11/2026 : `docs/projet/plan.md` (décision D5).
