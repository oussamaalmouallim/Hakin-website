# Instagram — stratégie de départ pour H MODE

Instagram est le réseau le plus important pour une marque de vêtements casual : les clients y regardent les pièces
portées, puis écrivent en message. Compte actuel : `@hmod_e2121` (lien dans `web/src/data/boutique.json`).

> Les chiffres et règles d'Instagram changent souvent, et la plupart des conseils publiés viennent de blogs, pas
> d'Instagram. Les recommandations ci-dessous sont **générales** ; celles qui dépendent d'une règle récente sont
> marquées « à vérifier » avec leur source.

## 1. Profil professionnel (une fois)

| Élément | Quoi mettre |
|---|---|
| Type de compte | **Professionnel → Entreprise** (Paramètres → Type de compte) : donne les statistiques et le bouton de contact |
| Photo | `logo-profil-1080.png`, le même que Facebook et TikTok |
| Nom affiché | `H MODE · Casablanca` (ce champ est aussi lu par la recherche) |
| Catégorie | Magasin de vêtements |
| Bouton de contact | WhatsApp (numéro de `boutique.json`) |
| Lien | l'adresse du site ; plus tard, un lien vers une catégorie en vedette |
| Relier à Facebook | Meta Business Suite : messages et publicités au même endroit |

### Bio (150 caractères au plus)

Exemple, à adapter :
```
Vêtements casual de marques 🧥👟
Livraison à Casablanca · Paiement à la livraison
Retour sous 24 h · Commande ↓
```
Tout ce qui est écrit doit être vrai et déjà affiché sur le site (livraison Casablanca, paiement à la livraison,
retour sous 24 h).

## 2. Organiser le feed

- **Une grille cohérente** : fonds crème et beige, mêmes polices (voir [IDENTITE_VISUELLE.md](IDENTITE_VISUELLE.md)).
  En faisant défiler la grille, on doit reconnaître H MODE sans lire le nom.
- **Format portrait 1080 × 1350** pour les publications : il prend le plus de place dans le fil.
- **Alterner** : une pièce seule, un porté, un carrousel, puis on recommence. Évitez trois packshots d'affilée.
- **Stories à la une** (les ronds sous la bio), à créer une fois :
  « Commander » (comment ça marche), « Livraison » (Casablanca, paiement à la livraison, retour 24 h),
  « Sweats », « Sneakers », « Nouveautés ».

## 3. Les formats et à quoi ils servent

| Format | Sert à | Exemple H MODE |
|---|---|---|
| **Reel** (vidéo verticale) | toucher des gens qui ne vous suivent pas encore | essayage d'un sweat en 15 s, déballage d'un arrivage |
| **Carrousel** (plusieurs images) | faire regarder plus longtemps, montrer les détails et les coloris | modèles 3, 4 et 6 de PROMPTS_IDENTITE.md |
| **Publication simple** | présenter une pièce clairement | modèle 1 |
| **Story** (24 h) | le quotidien, les arrivages, les questions (« Quelle couleur ? » en sondage) | colis préparé, nouvelle pièce, sondage |

Selon plusieurs guides 2026, les Reels servent surtout à toucher de nouvelles personnes, et les carrousels à faire
interagir ceux qui vous suivent déjà ; Instagram dit valoriser le temps de visionnage, les **partages en message** et
les mentions « J'aime » rapportées au nombre de personnes touchées (à vérifier :
[ZoomSphere, d'après Adam Mosseri](https://www.zoomsphere.com/blog/instagram-algorithm-2026-what-actually-gets-reach)).

Contenu **original** seulement : republier les photos ou vidéos d'autres comptes peut faire sortir le compte des
recommandations (à vérifier : [Creatorflow](https://creatorflow.so/blog/instagram-algorithm/)).

## 4. Fréquence réaliste pour une personne seule

| Semaine type | Temps |
|---|---|
| 2 Reels courts (15 à 30 s) | 1 h de tournage groupé + montage simple dans l'application |
| 2 carrousels ou publications | 1 h dans Canva avec les modèles |
| Stories 3 à 5 jours sur 7 | quelques minutes à chaque fois |

C'est l'ordre de grandeur que donnent la plupart des guides (2 à 4 Reels et 2 à 3 publications par semaine), sans
source officielle ; la **régularité** compte plus que le nombre.

## 5. Mettre les produits en valeur

- La pièce entière, nette, en lumière du jour. Le porté donne l'échelle : dites la taille portée si vous la connaissez.
- Premier plan de chaque Reel : la pièce, tout de suite (les premières secondes décident si on regarde).
- Le **détail** qui fait la différence : la matière, le logo brodé, la semelle. Pas d'effet qui change la couleur.
- Plusieurs coloris : modèle 6 (une vraie photo par couleur).

## 6. Descriptions et hashtags

Structure d'une description :
1. une phrase sur la pièce (« Hoodie Solo Fleece, molleton épais, coupe droite ») — seulement ce qui est vrai ;
2. le prix s'il est saisi dans l'admin, sinon « prix en message » ;
3. l'action : « Lien en bio » ou « Écrivez-nous ».

Hashtags : **3 à 5**, précis plutôt que génériques. Plusieurs guides indiquent qu'Instagram limite désormais le nombre
de hashtags et qu'ils aident surtout la **recherche**, pas la portée (à vérifier :
[ZoomSphere](https://www.zoomsphere.com/blog/instagram-algorithm-2026-what-actually-gets-reach)). Exemples :
`#casablanca #modehomme #streetwearmaroc #sneakersmaroc #hoodie`. Ajoutez aussi les mots importants **dans le texte**
(« sweat Nike Casablanca ») : la recherche Instagram les lit.

## 7. Liens vers les fiches produits

Instagram ne rend pas les liens cliquables dans les descriptions. Trois façons d'y mener :
- **Lien en bio** : changez-le vers la fiche ou la catégorie mise en avant de la semaine.
- **Sticker « Lien »** dans une Story : le plus direct vers une fiche précise.
- **En message** : quand un client demande, envoyez le lien de la fiche ; l'aperçu (image + titre) s'affiche tout seul.

## 8. Messages Instagram et WhatsApp

- Répondez dans la journée. Enregistrez des **réponses rapides** (Paramètres → Outils pro → Réponses enregistrées) :
  les mêmes que dans [FACEBOOK.md](FACEBOOK.md) § 6.
- Quand une conversation devient une commande, passez sur WhatsApp ou envoyez le lien de la fiche pour qu'elle soit
  enregistrée sur le site (elle apparaît alors dans l'admin, Ventes → Commandes).
- WhatsApp Business (application gratuite) aide beaucoup : étiquettes (« Nouveau client », « Livré »), réponses
  rapides, message d'absence ([fonctions de l'application](https://www.whatsappbusiness.com/products/business-app-features/)).

## 9. Construire la communauté, pas à pas

| Mois | Objectif | Actions |
|---|---|---|
| 1 | Un compte crédible | 12 publications de base, Stories à la une, bio claire ; inviter famille, amis et premiers clients à suivre |
| 2 | Des habitudes | rythme fixe, Reels d'essayage, répondre à tous les commentaires |
| 3 | De la preuve | publier (avec leur accord) les photos de vrais clients, montrer les colis livrés |
| Ensuite | Accélérer | sponsoriser les publications qui ont le mieux marché ([META_ADS.md](META_ADS.md)) |

Chaque mois, regardez dans les **statistiques** du compte quelles publications ont amené le plus de visites du profil,
de clics sur le lien et de messages, et refaites ce type-là.
