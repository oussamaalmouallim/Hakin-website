# Facebook — stratégie de départ pour H MODE

Pour une boutique qui démarre, sans équipe marketing. Objectif : que la page inspire confiance, qu'elle montre les
pièces, et qu'elle envoie les clients vers le **site** (pour commander) ou **WhatsApp** (pour une question).

Page actuelle : « H MODE » (lien dans `web/src/data/boutique.json`).

## 1. Configurer la page (une fois, 30 minutes)

| Élément | Quoi mettre |
|---|---|
| Photo de profil | `web/medias/marque/logo-profil-1080.png` (voir [PROMPTS_IDENTITE.md](PROMPTS_IDENTITE.md)) |
| Couverture | la couverture du § 3 de PROMPTS_IDENTITE.md (1640 × 624) |
| Nom | H MODE |
| Catégorie | Magasin de vêtements (ou « Boutique de vêtements » selon ce que Facebook propose) |
| Présentation (courte) | « Vêtements casual de marques — sweats, sneakers, t-shirts. Livraison à Casablanca, paiement à la livraison. » |
| Site web | l'adresse du site (une fois en ligne) |
| WhatsApp | le numéro de `boutique.json`, relié au bouton d'action |
| Bouton d'action | **« Envoyer un message WhatsApp »** ou **« Voir la boutique »** (site) |
| Ville | Casablanca |
| Horaires, adresse | seulement quand ils sont fixés (ils sont « À confirmer » sur le site aujourd'hui) |

Ensuite :
- Reliez la page Facebook au compte Instagram (Meta Business Suite) : une seule boîte de réception pour les deux.
- Activez une **réponse automatique** de bienvenue : « Bonjour, merci pour votre message. Nous répondons au plus vite.
  Pour commander : [site]. Paiement à la livraison à Casablanca. »

## 2. Ce qu'on publie

| Type | Exemple | Pourquoi |
|---|---|---|
| **Pièce seule** (modèle 1) | « Hoodie Solo Fleece — Nike. Tailles et prix sur la fiche. » + lien de la fiche | montre le produit, mène à l'achat |
| **Porté** (modèle 2) | la pièce sur une personne, en lumière du jour | aide à imaginer le rendu |
| **Arrivage** (modèle 4) | « Nouvel arrivage : 6 sweats » en carrousel | crée un rendez-vous |
| **Plusieurs coloris** (modèle 6) | les vraies couleurs d'une même pièce | répond à « vous l'avez en noir ? » |
| **Confiance** | comment se passe une commande : site → appel WhatsApp → livraison → paiement à la livraison | rassure, c'est la première question des clients |
| **Coulisses** | préparation d'un colis, arrivée d'un carton | montre une vraie boutique |

Ce qu'on ne publie pas : prix ou stock inventés, faux avis, « dernière pièce » si ce n'est pas vrai, photos d'autres
boutiques.

## 3. À quelle fréquence

Pour démarrer seul : **3 publications par semaine**, toujours aux mêmes jours (par exemple lundi, mercredi, samedi), plus
des Stories quand il y a un arrivage. La régularité compte plus que le nombre. Mieux vaut 3 par semaine pendant trois
mois que 10 la première semaine puis rien.

Astuce : préparez les visuels de la semaine le dimanche (1 h dans Canva), programmez-les dans **Meta Business Suite**.

## 4. Présenter les collections

- Une collection = un **album** ou un **carrousel** : titre (« Sweats & hoodies »), puis une pièce par image, puis une
  image finale « Toute la collection sur le site » avec le lien de la catégorie (`/boutique/sweats`).
- Les catégories du site sont la bonne base : sweats & hoodies, sneakers, t-shirts, vestes, jeans, pantalons.

## 5. Utiliser les liens vers le site

- Mettez toujours le **lien de la fiche** dans la publication : `https://<votre-site>/produit/<nom-de-la-piece>`.
  Le site prépare une image et un titre propres pour chaque fiche : l'aperçu s'affiche tout seul.
- Après avoir changé une pièce dans l'admin, l'aperçu se met à jour au déploiement suivant. Pour forcer Facebook à le
  relire : [outil de débogage du partage de Meta](https://developers.facebook.com/tools/debug/) → coller le lien →
  « Récupérer à nouveau ».

## 6. Messages et demandes clients

Chaque demande doit recevoir une réponse **le jour même** : c'est ce qui fait vendre une petite boutique.

| Demande | Réponse type (à enregistrer en réponse rapide) |
|---|---|
| « C'est combien ? » | « Bonjour ! [Pièce] est à [prix] DH, paiement à la livraison à Casablanca. Quelle taille vous faut-il ? » (prix saisi dans l'admin seulement) |
| « Vous avez en [taille] ? » | vérifier le stock réel, puis répondre ; si oui, envoyer le lien de la fiche |
| « Vous livrez à [ville] ? » | « Pour le moment nous livrons à Casablanca, à domicile. » |
| « Je peux retourner ? » | « Oui, retour possible sous 24 h après la livraison. » |

Les demandes qui arrivent par le bouton WhatsApp d'une fiche sont aussi visibles dans l'admin
(**Ventes → Demandes WhatsApp**) : marquez-les « Traitée » ou « Sans suite » pour ne rien oublier.

## 7. Vendre avec Facebook, concrètement

1. Une publication montre une pièce + le lien de la fiche.
2. Le client clique, choisit sa taille sur le site, commande (paiement à la livraison) **ou** clique WhatsApp.
3. La commande arrive dans l'admin (**Ventes → Commandes**) et sur WhatsApp ; vous confirmez par message.
4. Livraison, paiement à la porte, statut passé à « Livrée » dans l'admin.

Quand des publications marchent bien sans payer (beaucoup de messages, de partages), c'est le signe qu'elles
peuvent devenir une publicité : voir [META_ADS.md](META_ADS.md).

## 8. Bonnes pratiques visuels et textes

- Photo d'abord, texte court ensuite : 2 à 4 lignes, le nom de la pièce, ce qui la rend intéressante, le lien.
- Écrivez comme vous parlez aux clients (français simple ; darija si c'est votre public, mais restez constant).
- Une seule demande par publication : « Lien de la fiche en commentaire » ou « Écrivez-nous sur WhatsApp », pas les deux.
- Toujours la même mise en page (modèles Canva) : la page devient reconnaissable.

## 9. Ce qu'on mesure chaque semaine (Meta Business Suite → Statistiques)

| Chiffre | Ce qu'il dit |
|---|---|
| Personnes touchées | combien de comptes ont vu vos publications |
| Clics sur le lien | combien sont allés sur le site |
| Messages reçus | l'intérêt réel |
| Commandes de la semaine | dans l'admin (Ventes → Commandes) |

Gardez la publication qui a apporté le plus de messages ou de clics : refaites le même type la semaine suivante.

## À savoir sur les marques

H MODE vend des pièces de marques (Nike, Adidas, Puma…) comme **revendeur** (décision D1 du plan). Les noms et logos
de ces marques sont protégés : en publication normale, montrez le produit tel qu'il est ; **ne présentez jamais H MODE
comme la marque elle-même** et ne reprenez pas leurs visuels officiels. Gardez les justificatifs d'achat ou d'agrément :
Meta peut retirer un contenu signalé par le titulaire d'une marque
([règles de Meta sur les marques](https://transparency.meta.com/en-gb/policies/ad-standards/intellectual-property-infringement/copyright-and-trademarks/)).
