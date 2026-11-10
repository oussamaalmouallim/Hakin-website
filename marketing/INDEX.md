# Marketing de H MODE — sommaire

Tout ce qu'il faut pour lancer H MODE sur les réseaux, écrit pour quelqu'un qui débute. Chaque document part de
l'identité **réelle** du site (palette, logo, héros) et de ce que la boutique propose **vraiment** (livraison à
Casablanca, paiement à la livraison, retour sous 24 h).

## Dans quel ordre les lire

| # | Document | Pour | Temps |
|---|---|---|---|
| 1 | [IDENTITE_VISUELLE.md](IDENTITE_VISUELLE.md) | connaître les couleurs, polices, règles du logo et des photos | 15 min |
| 2 | [PROMPTS_IDENTITE.md](PROMPTS_IDENTITE.md) | préparer photos de profil, couverture Facebook, modèles Canva | 1 à 2 h (une fois) |
| 2 bis | [prompts/](prompts/README.md) | **un fichier par demande à l'IA**, à copier tel quel (profil, couverture, produit, story, carrousel, arrivage, offre, coloris, ambiance) | 2 min par visuel |
| 3 | [INSTAGRAM.md](INSTAGRAM.md) | le réseau principal pour des vêtements : profil, formats, rythme | 20 min |
| 4 | [FACEBOOK.md](FACEBOOK.md) | la page, les messages clients, les réponses types | 15 min |
| 5 | [TIKTOK.md](TIKTOK.md) | se faire connaître avec des vidéos tournées au téléphone | 15 min |
| 6 | [META_ADS.md](META_ADS.md) | la publicité payante, **après** quelques semaines de publications gratuites | 30 min |

## Le plan en quatre temps

1. **Avant le lancement** : identité appliquée sur les trois comptes (même photo de profil, bios cohérentes), 6 à 9
   publications de base, modèles Canva prêts.
2. **Mois 1** : publier régulièrement (voir chaque réseau), répondre à chaque message dans la journée, suivre les
   demandes dans l'admin (**Ventes → Commandes** et **Ventes → Demandes WhatsApp**).
3. **Mois 2** : garder les types de publication qui amènent des messages, abandonner les autres.
4. **Mois 3** : premier test Meta Ads (objectif Messages, Casablanca, budget de test) sur la meilleure publication.

## Ce que le site fait déjà pour le marketing

| Fonction | Où |
|---|---|
| Aperçu propre (image, nom, prix) quand on partage une fiche sur WhatsApp, Facebook ou en message Instagram | automatique, au build (`web/scripts/pages-partage.mjs`) |
| Bouton WhatsApp sur chaque fiche, avec message prêt (pièce, couleur, taille, lien) | fiche produit |
| Suivi des demandes WhatsApp, séparées des commandes | admin → Ventes → Demandes WhatsApp |
| Fréquentation du site (pages vues, visiteurs, pages les plus vues) | admin → Technique → Supervision |

## Règles qui valent partout

- Jamais de prix, de stock, de délai ou d'avis inventé. Un prix n'apparaît que s'il est saisi dans l'admin.
- Jamais de retouche qui change la couleur ou la coupe d'une pièce.
- Les marques vendues (Nike, Adidas…) appartiennent à leurs titulaires : H MODE est un revendeur, pas la marque.
- Le même logo, les mêmes couleurs, le même ton sur tous les réseaux.

## Autres documents utiles

- [`../DEPLOIEMENT_ET_SUPERVISION/`](../DEPLOIEMENT_ET_SUPERVISION/) : mettre le site en ligne, le surveiller, le maintenir (guide PDF).
- [`../docs/architecture.md`](../docs/architecture.md) : comment le site est construit.
- [`../docs/design/logo-prompt-gemini.md`](../docs/design/logo-prompt-gemini.md) : ancien prompt du logo (remplacé par
  le monogramme du héros, gardé pour l'historique).
