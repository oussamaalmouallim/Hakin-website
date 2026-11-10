# Meta Ads — la publicité payante sur Facebook et Instagram, expliquée simplement

**Meta Ads** est la régie publicitaire de Meta : une seule interface (le **Gestionnaire de publicités**, ou Ads Manager)
pour payer des publicités affichées sur Facebook, Instagram, Messenger et WhatsApp.

Ce document sépare toujours deux choses :
- **les principes**, stables, qu'on peut appliquer tout de suite ;
- **les chiffres et règles qui bougent** (tarifs, minimums, politiques) : ils sont marqués « à vérifier », avec leur
  source. Aucun prix du marché marocain n'est donné ici, car aucune source fiable n'en publie : vous le mesurerez
  vous-même sur vos premières campagnes.

## 1. Comment ça marche

1. Vous choisissez **ce que vous voulez obtenir** (des messages, des visites sur le site, des ventes…).
2. Vous dites **à qui** montrer la publicité et **combien** vous voulez dépenser par jour.
3. Meta montre la publicité aux personnes qui ont le plus de chances de faire l'action voulue, et vous facture selon la
   diffusion. Il compare les annonceurs qui visent les mêmes personnes : c'est une **enchère** automatique.

Vous ne payez pas une « place » fixe : vous payez la diffusion, et le prix varie selon la concurrence, la période et la
qualité de votre publicité.

## 2. Campagne, ensemble de publicités, publicité

| Niveau | Ce qu'on y règle | Exemple H MODE |
|---|---|---|
| **Campagne** | l'**objectif** (un seul par campagne) | « Messages WhatsApp — sweats novembre » |
| **Ensemble de publicités** | **qui** (lieu, âge, centres d'intérêt), **où** (Facebook, Instagram…), **combien** (budget), **quand** | Casablanca, 18–40 ans, 40 DH par jour, 7 jours |
| **Publicité** | ce que les gens **voient** : image ou vidéo, texte, bouton | Reel d'essayage du hoodie + bouton « Envoyer un message WhatsApp » |

Une campagne contient un ou plusieurs ensembles ; un ensemble contient une ou plusieurs publicités.

## 3. Choisir l'objectif

Meta propose six grandes familles d'objectifs : Notoriété, Trafic, Interactions, Prospects, Promotion d'application,
Ventes ([Ryze, 2026](https://www.get-ryze.ai/blog/meta-ads-campaign-types-explained-guide)).

| Objectif | Ce que Meta cherche | Pour H MODE ? |
|---|---|---|
| **Interactions → Messages** (WhatsApp, Messenger, Instagram) | des gens qui **écrivent** | **Recommandé au départ** : vos clients achètent après une conversation, et vous comptez les messages vous-même |
| **Trafic** | des gens qui **cliquent** vers le site | utile pour faire voir une catégorie ; le clic ne garantit pas l'achat |
| **Ventes** | des **achats** sur le site | demande un suivi des achats (le « pixel » de Meta, voir § 9) que le site n'a pas aujourd'hui |
| **Notoriété** | le plus de personnes possible | plus tard, pour une ouverture ou un événement |

Pourquoi **Messages** d'abord : la commande se confirme déjà sur WhatsApp, le paiement se fait à la livraison, et
chaque conversation se compte directement (vous voyez combien de messages une publicité a apportés).

## 4. Cibler les bonnes personnes

| Réglage | Proposition de départ | Pourquoi |
|---|---|---|
| Lieu | **Casablanca** (rayon autour de la ville) | vous ne livrez qu'à Casablanca : payer pour Rabat ne sert à rien |
| Âge | une tranche large au départ (ex. 18–40) | Meta affine tout seul ; resserrez ensuite d'après les résultats |
| Langue | français et arabe | selon la langue de vos textes |
| Centres d'intérêt | quelques-uns, larges (streetwear, sneakers, mode homme) | ou aucun, en laissant Meta chercher : comparez les deux |
| Placements | **automatiques** au départ | Meta répartit entre Facebook, Instagram, Stories, Reels |
| Audience « chaude » | personnes qui ont interagi avec la page ou le compte Instagram | ce sont les plus susceptibles d'écrire |

Ne multipliez pas les filtres : une audience trop petite coûte plus cher et apprend mal.

## 5. Utiliser vos photos et vidéos

- **Vidéo verticale courte** (les Reels et TikTok que vous tournez déjà) : souvent ce qui marche le mieux pour les
  vêtements. La pièce visible dès la première seconde.
- **Carrousel** : une pièce par image, ou plusieurs coloris (modèle 6 de [PROMPTS_IDENTITE.md](PROMPTS_IDENTITE.md)).
- Le texte : la pièce, la preuve de confiance (« Paiement à la livraison · Casablanca · Retour sous 24 h »), l'action.
- Testez **2 ou 3 publicités** dans le même ensemble (vidéo, carrousel, photo) : Meta donne plus de budget à celle qui
  marche.
- Le plus simple pour démarrer : **sponsoriser une publication qui a déjà bien marché** gratuitement (bouton
  « Booster »), avec l'objectif Messages.

## 6. Envoyer vers le site ou vers WhatsApp

| Destination | Quand | Réglage |
|---|---|---|
| **WhatsApp** | au départ, pour la plupart des campagnes | objectif Messages → application WhatsApp, numéro de `boutique.json` relié à la page (« publicités qui renvoient vers WhatsApp », [Meta](https://www.whatsappbusiness.com/products/business-app-features/)) |
| **Fiche produit** | pour une pièce précise avec prix affiché | objectif Trafic, lien `https://<site>/produit/<pièce>` (l'aperçu de la fiche est déjà prêt) |
| **Catégorie** | pour une collection | lien `https://<site>/boutique/sweats` |

N'envoyez jamais vers une pièce sans prix ou en rupture : le client repart déçu, et vous avez payé le clic.

## 7. Un budget de départ raisonnable

Aucun chiffre fiable n'existe pour le Maroc ; les guides publiés parlent en dollars et se contredisent
([Vizup](https://www.tryvizup.com/blog/meta-ads-minimum-budget-requirements-2026),
[Ryze](https://www.get-ryze.ai/blog/meta-ads-budget-planning-how-much-spend-2026)). La méthode, elle, est sûre :

1. **Calculez ce qu'une vente vous rapporte** : prix de vente − prix d'achat − frais de livraison = marge par pièce.
2. **Fixez le coût maximum d'une vente** que vous acceptez (par exemple la moitié de cette marge).
3. **Choisissez un budget de test** que vous acceptez de dépenser pour apprendre, réparti sur **7 jours** au moins
   (Meta a besoin de quelques jours pour trouver les bonnes personnes). Exemple de calcul, à adapter à votre marge :
   40 DH/jour × 7 jours = 280 DH.
4. **À la fin du test** : nombre de messages, nombre de commandes réelles (admin : Ventes → Commandes et Demandes),
   coût par commande = dépense ÷ commandes. En dessous de votre maximum : on garde et on augmente doucement
   (+20 % par semaine). Au-dessus : on change la publicité ou l'audience, pas seulement le budget.

Le minimum technique accepté par Meta et la devise du compte (dirham ou autre) se voient au moment de créer le
compte publicitaire : **à vérifier** dans le Gestionnaire de publicités.

## 8. Suivre les résultats : les indicateurs

| Indicateur | Définition | Ce qu'il vous dit |
|---|---|---|
| **Portée** | nombre de **personnes différentes** qui ont vu la publicité | jusqu'où elle est allée |
| **Impressions** | nombre total d'**affichages** (une personne peut la voir trois fois) | impressions ÷ portée = **répétition** ; au-delà de 3 ou 4, les gens se lassent |
| **Clics** | nombre de clics (sur le lien, le bouton, l'image…) | l'intérêt ; regardez surtout « clics sur le lien » |
| **CTR** (taux de clic) | clics ÷ impressions × 100 | si la publicité **accroche** ; bas = image ou texte à changer |
| **CPC** (coût par clic) | dépense ÷ clics | le prix d'un visiteur |
| **CPM** | coût pour 1 000 impressions | le prix de l'audience ; c'est ce chiffre qui vous donnera le niveau de prix marocain |
| **Conversions** | l'action voulue (message commencé, achat…) | le seul chiffre qui compte vraiment |
| **Coût par conversation** / **par achat** | dépense ÷ conversions | à comparer avec votre coût maximum (§ 7) |

Notez chaque semaine dans un tableau : dépense, messages, commandes réelles, coût par commande. C'est votre vrai
résultat, plus que les chiffres de Meta.

## 9. Ce que le site ne mesure pas encore (décision à prendre plus tard)

L'objectif **Ventes** demande que Meta sache qu'un achat a eu lieu, grâce au **pixel Meta** (un petit script du site)
ou à l'**API Conversions** (un envoi depuis la base). Le site n'en a pas aujourd'hui, volontairement :
- la sécurité du site interdit tout script externe (politique de sécurité stricte, voir le guide PDF de `DEPLOIEMENT_ET_SUPERVISION/`, chapitre 9) ;
- un pixel demande un **bandeau de consentement** aux cookies et une mise à jour de la page Confidentialité.

Quand les campagnes Messages seront rentables, ce sera une évolution à décider (développement, consentement, texte
juridique). En attendant, comptez les commandes dans l'admin.

## 10. Ne pas gaspiller son budget

- **Une seule variable à la fois** : changez l'image *ou* l'audience *ou* le texte, pas tout ensemble.
- **Attendre 3 à 4 jours** avant de juger un ensemble de publicités (la phase d'apprentissage de Meta).
- **Couper** une publicité qui ne donne aucun message après une dépense égale à votre coût maximum d'une vente.
- Ne pas cibler hors de Casablanca, ne pas annoncer une pièce sans stock, ne pas lancer sans pouvoir répondre aux messages
  le jour même (une publicité réussie mal suivie est de l'argent perdu).
- Vérifier le moyen de paiement et le plafond de dépense du compte (Paramètres de facturation) pour éviter une mauvaise
  surprise.

## 11. Les marques et les règles publicitaires — à lire avant la première campagne

H MODE vend des pièces de marques (Nike, Adidas, Puma, Dior, Prada…). Les règles publicitaires de Meta interdisent les
publicités qui portent atteinte aux **marques** d'autrui, et une publicité peut être refusée **sur signalement du
titulaire de la marque** ou si elle **semble** porter atteinte à ses droits
([politique de Meta](https://transparency.meta.com/en-gb/policies/ad-standards/intellectual-property-infringement/copyright-and-trademarks/),
[atteinte aux droits de tiers](https://transparency.meta.com/policies/ad-standards/intellectual-property-infringement/third-party-infringement)).
Les marques de luxe en particulier poursuivent les vendeurs non autorisés (exemple :
[Louboutin et Meta contre un revendeur](https://www.thefashionlaw.com/?p=94963)).

En pratique :
- gardez vos **justificatifs** d'achat ou d'agrément (décision D1 du plan) ;
- commencez par des publicités sur des pièces **sans logo dominant** ou sur la boutique elle-même (livraison,
  service, choix) plutôt que « Nike pas cher » ;
- n'utilisez jamais les photos officielles ni les slogans des marques, et ne présentez pas H MODE comme un magasin
  officiel de la marque ;
- si une publicité est refusée, lisez le motif dans le Gestionnaire et faites appel seulement si vous avez les
  justificatifs.

## 12. Améliorer pas à pas

| Semaine | Action |
|---|---|
| 1 | Booster 1 publication qui a déjà bien marché, objectif Messages, Casablanca, budget de test |
| 2 | Lire les chiffres ; garder la meilleure publicité ; en créer 2 nouvelles du même type |
| 3–4 | Audience « chaude » (personnes ayant interagi) contre audience large : garder la moins chère par commande |
| Ensuite | Augmenter de 20 % par semaine ce qui reste sous votre coût maximum ; renouveler les visuels toutes les 2 à 3 semaines |
