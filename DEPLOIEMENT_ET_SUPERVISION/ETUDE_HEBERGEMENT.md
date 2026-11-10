# Étude d'hébergement de H MODE

Complément technique du guide PDF [`GUIDE_DEPLOIEMENT_HEBERGEMENT_MAINTENANCE_HMODE.pdf`](GUIDE_DEPLOIEMENT_HEBERGEMENT_MAINTENANCE_HMODE.pdf), chapitres 3 à 5.
Prix lus le **10/11/2026** sur les pages des fournisseurs ou, quand la page officielle n'était pas lisible, sur des
comparatifs datés (signalés comme tels). **Vérifiez le prix sur la page officielle avant de payer** : ces offres changent
souvent.

**Taux de conversion utilisé : 1 USD = 9,76 DH** (taux médian du marché, [XE](https://www.xe.com/en-us/currencyconverter/convert/?Amount=1&From=USD&To=MAD), 10/11/2026 ;
il a varié entre 9,23 et 9,99 DH sur les 90 derniers jours). Une carte bancaire marocaine payée en dollars ajoute en plus
des **frais de change de votre banque** : demandez leur montant à votre agence, ils ne sont pas comptés ici.

---

## 1. Ce que H MODE demande vraiment

| Besoin | Pourquoi | Conséquence pour l'hébergeur |
|---|---|---|
| Servir des **fichiers statiques** (`web/dist`) en HTTPS | le site n'a aucun serveur à nous | n'importe quel hébergeur statique convient ; pas de serveur à louer |
| **En-têtes de sécurité** (CSP, HSTS, X-Frame-Options) et **réécritures** (`_redirects`) | sécurité et vraies 404 | déjà écrits pour Netlify (`netlify.toml`, `web/public/_redirects`) |
| Un **build** à chaque modification (`npm run build`, Node 22) | génère le site, le sitemap et les aperçus de partage | build intégré à l'hébergeur, relié à GitHub |
| La **base, les comptes, les photos, l'API** | commandes, admin, catalogue | **Supabase**, quel que soit l'hébergeur du site |
| Peu de trafic au départ, coût proche de zéro | boutique locale qui démarre | offres gratuites d'abord, payant au premier vrai besoin |

Le « backend » n'est donc **pas** à choisir : c'est Supabase (API REST, Auth, Storage, PostgreSQL). La comparaison porte
sur l'hébergement du site, et sur l'offre Supabase.

---

## 2. Les trois offres étudiées

### 2.1 Netlify (hébergement actuel)

| Rubrique | Détail |
|---|---|
| Offre | **Free** (lancement) → **Personal** si les crédits ne suffisent plus |
| Services inclus | hébergement statique sur CDN, build relié à GitHub, aperçu par pull request, retour arrière en un clic, HTTPS automatique, formulaires et fonctions (non utilisés) |
| Frontend | oui : `netlify.toml` et `_redirects` **déjà configurés et en ligne** (`https://hmodeclothes.netlify.app`) |
| Backend / API | aucun : Supabase |
| Base de données | aucune : Supabase |
| Fichiers et images | les images du catalogue sont dans le site (`/images/…`) ; les photos ajoutées depuis l'admin sont dans Supabase Storage |
| SSL / HTTPS | certificat **Let's Encrypt** automatique et gratuit, aussi sur un domaine à vous |
| Domaine et DNS | domaine externe accepté (enregistrements DNS chez le registrar) ou DNS géré par Netlify |
| Sauvegardes | le code est dans GitHub ; chaque déploiement reste republiable (retour arrière) |
| Monitoring et logs | journal de chaque build ; jauge d'usage (crédits) ; pas de surveillance de disponibilité incluse |
| Limites | modèle à **crédits** : Free 300 crédits/mois, **site mis en pause** quand ils sont épuisés ; 1 build à la fois ; d'après un exemple tiers, environ 15 crédits par déploiement et 20 crédits par Go servi (non confirmé par Netlify) |
| Évolution | Personal 1 000 crédits, Pro 3 000 crédits et membres illimités |
| Prix | Free 0 · **Personal 9 $/mois ≈ 88 DH** (≈ 1 054 DH/an au mois) · Pro 20 $/mois ≈ 195 DH (≈ 2 342 DH/an) |
| Coûts possibles en plus | packs de crédits ; selon Dupple, 5 $ les 500 crédits sur Personal (source tierce) |
| Avantages | déjà en place et vérifié ; aucun changement de code ; retour arrière immédiat ; CSP déjà testée |
| Inconvénients | site **mis en pause** si les crédits sont épuisés sur l'offre gratuite ; coût lié au trafic, difficile à prévoir exactement |

Sources : [Netlify, tarifs](https://www.netlify.com/pricing/) ; comparatifs datés 2026 : [Stork](https://www.stork.ai/blog/netlify-pricing-2026), [Costbench](https://costbench.com/software/cloud-infrastructure/netlify/), [Dupple](https://dupple.com/pricing/netlify).

### 2.2 Cloudflare Pages

| Rubrique | Détail |
|---|---|
| Offre | **Free** |
| Services inclus | hébergement statique sur le réseau Cloudflare, build relié à GitHub, aperçus, HTTPS, DNS Cloudflare gratuit |
| Frontend | oui, mais à **adapter** : les en-têtes de `netlify.toml` passent dans un fichier `_headers`, à retester (CSP, HSTS) |
| Backend / API | aucun : Supabase (les Workers existent mais ne servent pas ici) |
| Base de données | aucune : Supabase |
| Fichiers et images | comme Netlify ; limite de 20 000 fichiers et 25 Mio par fichier |
| SSL / HTTPS | automatique et gratuit |
| Domaine et DNS | DNS Cloudflare gratuit ; **Cloudflare Registrar** vend les `.com` au prix coûtant (pas de `.ma`) |
| Sauvegardes | code dans GitHub ; déploiements précédents republiables |
| Monitoring et logs | statistiques de trafic de base ; pas de surveillance de disponibilité |
| Limites | **500 builds par mois**, 1 build à la fois, 20 min par build ; trafic statique **non facturé** selon les comparatifs |
| Évolution | Pro 20 $/mois (5 000 builds) selon les comparatifs |
| Prix | **0** ; un domaine `.com` au prix coûtant ≈ 11,17 $/an ≈ 109 DH (hausse du registre au 01/11/2026, source tierce) |
| Coûts possibles en plus | aucun pour un site statique |
| Avantages | pas de mise en pause liée au trafic ; DNS et domaine au même endroit ; gratuit durablement |
| Inconvénients | **migration à faire et à retester** (en-têtes, réécritures, aperçus de partage) ; pas de `.ma` chez leur registrar |

Sources : [Cloudflare Pages, limites officielles](https://developers.cloudflare.com/pages/platform/limits/) ; [Hostfleet, comparatif avril 2026](https://hostfleet.pages.dev/cf-pages-vs-vercel-vs-netlify-2026/) ;
[Costgoat, prix .com](https://costgoat.com/pricing/cloudflare-domains).

### 2.3 Vercel

| Rubrique | Détail |
|---|---|
| Offre | **Pro** (obligatoire pour une boutique) |
| Services inclus | hébergement statique et fonctions, aperçus, HTTPS, statistiques |
| Frontend | oui, à adapter (`vercel.json` pour les en-têtes et réécritures) |
| Backend / API | aucun : Supabase |
| Base de données | aucune : Supabase |
| Fichiers et images | comme les autres |
| SSL / HTTPS | automatique |
| Domaine et DNS | domaine externe accepté |
| Sauvegardes | déploiements précédents republiables |
| Monitoring et logs | journaux et statistiques inclus |
| Limites | l'offre gratuite **Hobby est réservée à un usage personnel et non commercial** ([Vercel](https://vercel.com/docs/plans/hobby)) : une boutique doit prendre Pro |
| Évolution | Enterprise sur devis |
| Prix | **20 $ par membre et par mois ≈ 195 DH** (≈ 2 342 DH/an), avec 20 $ d'usage inclus |
| Coûts possibles en plus | usage au-delà du crédit inclus, facturé à la demande |
| Avantages | outil soigné, très bonnes performances |
| Inconvénients | **payant dès le premier jour** pour un usage commercial ; migration à faire ; aucun besoin de ses fonctions serveur ici |

Sources : [Vercel, offre Hobby](https://vercel.com/docs/plans/hobby) ; [Vercel, tarifs](https://vercel.com/pricing) ; résumé : [Livemy](https://livemy.app/blog/vercel-pricing).

---

## 3. La base : Supabase Free ou Pro

| | **Free** | **Pro** |
|---|---|---|
| Prix | 0 | **25 $/mois ≈ 244 DH** (≈ 2 928 DH/an) |
| Mise en pause | **après 1 semaine d'inactivité** | jamais |
| Sauvegardes | **aucune** restaurable | **quotidiennes, gardées 7 jours** |
| Retour à une minute précise (PITR) | non | option payante en plus |
| Quotas | 500 Mo de base, 50 000 utilisateurs actifs/mois | 8 Go de disque, 100 000 utilisateurs actifs, dépassements facturés |

Sources : [Supabase, tarifs](https://supabase.com/pricing) ; [Supabase, mise en pause](https://supabase.com/docs/guides/platform/free-plan-pausing).

Conséquence : sur Free, **la sauvegarde est à votre charge** (`npm run sauvegarde`, puis `npm run sauvegarde:tester`, chapitre 14 du guide).

---

## 4. Surveillance externe (alerte en quelques minutes)

| Service | Offre gratuite | Usage commercial | Source |
|---|---|---|---|
| **UptimeRobot** | 50 sondes, contrôle toutes les **5 min**, alerte e-mail | **à vérifier** : les sources se contredisent depuis la mise à jour des conditions du 26/05/2026 | [Notifier](https://notifier.so/guides/uptimerobot-pricing-2026/), [Hyperping](https://hyperping.com/blog/uptimerobot-pricing) |
| **Better Stack** | 10 sondes, contrôle toutes les **3 min**, alerte e-mail | **à vérifier** : sa page tarifs parle de projets personnels | [Better Stack, fréquence](https://betterstack.com/docs/uptime/check-frequency/), [Notifier](https://notifier.so/guides/better-stack-vs-uptimerobot/) |

Lisez les conditions d'utilisation du service choisi avant de l'utiliser pour la boutique. Le robot GitHub (toutes les
30 min, gratuit) reste en place dans tous les cas.

---

## 5. Coûts comparés (hors frais bancaires)

| Scénario | Site | Base | Domaine | **Total / mois** | **Total / an** |
|---|---|---|---|---|---|
| **A. Lancement** (recommandé) | Netlify Free 0 | Supabase Free 0 | `.ma` 100 à 200 DH HT/an | **≈ 8 à 17 DH** | **100 à 200 DH HT** |
| **B. Ventes régulières** (recommandé ensuite) | Netlify Free 0 | Supabase Pro 244 DH | idem | **≈ 252 à 261 DH** | **≈ 3 030 à 3 130 DH** |
| C. Gros trafic sur Netlify | Netlify Personal 88 DH | Supabase Pro 244 DH | idem | ≈ 340 à 349 DH | ≈ 4 080 à 4 180 DH |
| D. Cloudflare Pages | 0 | Supabase Pro 244 DH | `.com` ≈ 109 DH/an | ≈ 253 DH | ≈ 3 040 DH |
| E. Vercel Pro | 195 DH | Supabase Pro 244 DH | idem | ≈ 448 à 456 DH | ≈ 5 370 à 5 470 DH |

Calculs : 9 $ × 9,76 = 87,8 DH ; 20 $ × 9,76 = 195,2 DH ; 25 $ × 9,76 = 244 DH. Domaine `.ma` : 100 à 200 DH HT/an
selon les guides marocains ([HébergeurMarocain](https://www.hebergeurmarocain.com/blog/prix-officiel-nom-domaine-ma-maroc/),
[Heberfacile](https://www.heberfacile.com/nom-de-domaine/domaine-ma/)), renouvellement parfois plus cher : lisez-le avant d'acheter.

Les e-mails (Brevo, offre gratuite à quota quotidien), GitHub (dépôt public) et WhatsApp Business ne coûtent rien au
départ. La publicité Meta est un budget à part (`marketing/META_ADS.md`).

---

## 6. Recommandation

**Rester sur Netlify Free + Supabase Free pour lancer**, avec un domaine `.ma`, puis **passer Supabase en Pro dès les
ventes régulières**. C'est la première dépense utile.

Pourquoi :
1. **Netlify est déjà en ligne et vérifié** : vraie 404, en-têtes de sécurité, sitemap, aperçus de partage. Changer
   d'hébergeur ne réglerait aucun problème réel aujourd'hui, et en créerait (tout retester).
2. Le **vrai risque** n'est pas l'hébergement du site : c'est la **base**. Sur Free, elle se met en pause après une
   semaine sans activité et n'a pas de sauvegarde restaurable. Le Pro règle les deux pour 244 DH/mois.
3. **Vercel** coûte 195 DH/mois dès le premier jour, sans rien apporter à un site statique.
4. **Cloudflare Pages** est le **plan B** : si la jauge Netlify dépasse 70 % plusieurs mois de suite, migrer vers
   Cloudflare (gratuit, trafic non facturé) coûte moins que Netlify Personal. Prévoir une demi-journée pour porter les
   en-têtes dans `_headers` et retester.

Signal de passage : **Netlify → Usage** chaque semaine ; **Supabase → Pro** dès la première commande réelle régulière,
ou avant toute campagne publicitaire.
