# Identité visuelle de H MODE

Ce document décrit l'identité **telle qu'elle existe déjà** sur le site. Rien n'est inventé : chaque couleur vient de
[`web/palette.md`](../web/palette.md) (la référence du code), le logo vient de `web/medias/marque/`, le héros de
`web/public/images/campagne/`. Si une couleur change un jour, c'est `palette.md` qui change d'abord, puis ce document.

## 1. Positionnement visuel

H MODE vend des vêtements **casual** de marques connues (sweats, sneakers, t-shirts, vestes, jeans) à Casablanca,
avec paiement à la livraison et conseil sur WhatsApp.

L'image doit dire trois choses :

| Ce qu'on veut faire sentir | Comment le site le montre |
|---|---|
| **Sérieux et fiable** : on peut commander sans crainte | fond clair, beaucoup d'espace, textes courts, prix et conditions clairs |
| **Casual, urbain, facile à porter** | titres en capitales épaisses, photos portées, pas de décor chargé |
| **Une touche chaleureuse qui nous appartient** | le **beige** et le **bronze** du monogramme, la lumière douce du héros |

En une phrase : *un catalogue clair et moderne, réchauffé par une touche beige.*

## 2. Direction artistique

- **Base** : fond crème presque blanc, texte noir profond, beaucoup d'air autour des photos.
- **Touche H MODE** : beige et bronze, seulement en petite quantité (logo, filets fins, fond d'une photo portée).
  Si tout devient beige, la touche disparaît.
- **Accent jaune** : réservé aux signaux (« Nouveau », un bouton d'appel). Jamais en grand fond.
- **Lumière** : naturelle, chaude et douce, comme la scène du héros (terrasse, olivier, mur clair, ciel voilé).
- **Ton** : calme et sûr de lui. Pas de « PROMO !!! » en rouge, pas d'effets brillants, pas de dégradés criards.

## 3. Palette exacte

### Couleurs principales (le cœur de l'identité)

| Rôle | Nom | HEX | Où l'utiliser |
|---|---|---|---|
| Fond principal | Crème | `#F5F4F0` | fond de toutes les publications, fond des visuels produits |
| Texte | Encre | `#0A0A0A` | titres, prix, texte |
| Touche H MODE | Beige | `#E4D0B7` | fond doux derrière un produit, pastille, bandeau discret |
| Logo | Bronze | `#836240` | monogramme « H », filets fins, signature |

### Couleurs secondaires

| Rôle | Nom | HEX | Où l'utiliser |
|---|---|---|---|
| Fond alterné | Crème 2 | `#EFEDE7` | deuxième fond d'un carrousel, cadre d'une photo |
| Fond alterné | Crème 3 | `#E8E5DC` | séparation, zone de texte |
| Beige clair | Sable clair | `#EDE3D5` | grand fond doux d'une couverture |
| Beige très pâle | Sable pâle | `#F4EDE3` | fond derrière une photo portée |
| Dégradé du logo | Bronze clair → Bronze → Bronze foncé | `#9C8366` → `#836240` → `#5F4831` | uniquement pour reproduire le monogramme |
| Texte secondaire | Gris | `#6B6B6B` | petites mentions (« Paiement à la livraison ») |
| Texte désactivé | Gris clair | `#B4B2AC` | rarement : légendes très discrètes |

### Couleurs d'accent et de signal

| Rôle | Nom | HEX | Règle |
|---|---|---|---|
| Accent | Jaune | `#F5D000` | petite pastille « Nouveau » ou un mot souligné. Jamais plus de 5 % d'un visuel |
| Accent doux | Jaune pâle | `#FFE875` | survol, très rare |
| Promotion | Rouge brique | `#C8341B` | seulement pour un prix barré ou le mot « Soldes » |
| WhatsApp | Vert WhatsApp | `#25D366` | seulement l'icône WhatsApp |

## 4. Typographies

| Usage | Police | Gratuite ? | Dans Canva |
|---|---|---|---|
| Titres, prix, noms de pièce (en **CAPITALES**) | **Archivo Black** | oui (Google Fonts) | disponible sous ce nom |
| Texte courant | **Space Grotesk** | oui (Google Fonts) | disponible sous ce nom |
| Petites étiquettes (« NOUVEAU », « TAILLE M ») | **JetBrains Mono**, en capitales espacées | oui (Google Fonts) | disponible sous ce nom |
| Logo et monogramme seulement | **Cormorant Garamond** | oui (Google Fonts) | disponible sous ce nom |

Règles :
- Deux polices au plus sur un même visuel (en général Archivo Black + Space Grotesk).
- Cormorant Garamond ne sert **qu'au « H » du logo** : jamais pour un texte de publication.
- Si une police manque dans Canva, vérifiez son nom exact ; à défaut, importez-la depuis Google Fonts (compte Canva Pro).

## 5. Le logo

Le logo officiel est le **monogramme du héros** (décision du 07/11/2026) : un « H » à empattements en Cormorant
Garamond, en dégradé bronze (`#9C8366` → `#836240` → `#5F4831`), traversé d'une courbe fine qui monte vers la droite.
Le logotype complet ajoute le nom « H MODE » en Archivo Black.

| Fichier | Contenu | Usage |
|---|---|---|
| `web/medias/marque/logo-monogramme-2000.png` | le « H » seul, fond transparent, 2000 px | à poser sur une photo ou un fond clair |
| `web/medias/marque/logo-profil-1080.png` | le « H » sur fond crème `#F5F4F0`, 1080 × 1080 | photo de profil Instagram, Facebook, TikTok |
| `web/public/favicon.png`, `apple-touch-icon.png` | icônes du site | générées par `npm run logo` |

Règles d'utilisation :
- **À faire** : le poser sur crème, beige ou une photo claire et calme ; garder de l'espace autour (au moins la
  largeur d'un jambage du « H ») ; le placer dans un coin, petit (signature).
- **À ne pas faire** : le déformer, le mettre en jaune ou en rouge, lui ajouter une ombre ou un contour, le poser sur
  une photo chargée, réécrire le « H » dans une autre police, le changer de couleur selon la saison.
- Sur un fond très sombre, utilisez le « H » en crème `#F5F4F0` plein (sans dégradé) plutôt que le bronze.

## 6. Style photographique des produits

Deux familles de photos existent déjà sur le site :

| Type | À quoi ça ressemble | Règle |
|---|---|---|
| **Packshot** (le vêtement seul) | pièce entière, centrée, fond uni clair | fond crème ou blanc, lumière égale, aucune ombre dure |
| **Porté** (sur une personne) | pose naturelle, lumière du jour, décor sobre | décor clair et chaud, comme le héros |

Règles qui ne changent jamais :
- **Montrer le vrai produit** : pas de filtre qui change la couleur, pas de retouche qui change la coupe ou la matière.
  Un client qui reçoit une pièce d'une autre couleur que la photo renvoie la pièce (retour sous 24 h).
- La pièce **entière** dans le cadre, sans la couper aux bords.
- Une couleur = une photo nette de cette couleur. Ne pas « recolorer » une photo pour montrer un autre coloris.
- Lumière du jour près d'une fenêtre, téléphone posé ou tenu droit, fond uni : c'est suffisant.

## 7. Combinaisons qui marchent

| Combinaison | Fond | Titre | Détail | Pour |
|---|---|---|---|---|
| **Classique** | Crème `#F5F4F0` | Encre `#0A0A0A` (Archivo Black) | monogramme bronze dans un coin | produit seul, annonce |
| **Chaleureuse** | Beige `#E4D0B7` | Encre `#0A0A0A` | filet bronze `#836240` | collection, couverture |
| **Douce** | Sable pâle `#F4EDE3` | Encre | prix en Archivo Black | porté, ambiance |
| **Nouveauté** | Crème | Encre | petite pastille jaune `#F5D000` « NOUVEAU » | arrivage |
| **Contraste** | Encre `#0A0A0A` | Crème `#F5F4F0` | « H » crème plein | une citation, une annonce importante (rare) |

À éviter : jaune sur beige (peu lisible), rouge en grand fond, plus de trois couleurs sur un même visuel.
