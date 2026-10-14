# Photos du site — dossier unique

Toutes les photos originales du site sont ici. Rien d'autre à toucher : `public/images/` est **généré**.

```
medias/
├── produits/<slug-du-produit>/1.jpg   ← photo de la carte (vue principale)
│                              2.jpg   ← vue au survol de la carte, puis galerie de la fiche
│                              3.jpg … ← vues suivantes de la galerie
├── campagne/hero.png                  ← maquette d'où sont découpées les images de l'accueil
├── campagne/cadrages.json             ← zones découpées dans hero.png (x, y, largeur, hauteur)
└── provenance.json                    ← d'où vient chaque photo (photos boutique, Nike, Jumia…)
```

## Changer une photo
1. Remplacer le fichier (ex. `produits/air-force-1-07-nike/1.jpg`). Formats acceptés : jpg, png, webp, avif.
2. `cd ui && npm run images`
3. Recharger le site.

## Ajouter une vue à un produit
Déposer `2.jpg`, `3.jpg`… dans son dossier, lancer `npm run images`, puis ajouter la vue dans `images` du produit
(`ui/src/data/produits.json`) : `{ "src": "/images/produits/<slug>/2", "alt": "…", "vue": "dos" }`.

## Ajouter un produit
Créer `produits/<nouveau-slug>/1.jpg`, lancer `npm run images`, puis ajouter le produit dans `produits.json`.

## Conseils
- Une seule photo par fichier : pas de montage, pas de doublon (même photo recadrée = doublon).
- Format idéal : portrait 4:5, au moins 1200 px de large, fond uni clair.
