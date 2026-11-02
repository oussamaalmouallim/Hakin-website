# Rapport de clonage — H MODE, direction Original Fit

## En bref
- **Source** : https://www.original-fit.ma (`/`, `/shop`, `/product`, `/auth` pour les formulaires) · relevé du 2026-11-01 au 2026-11-02 · site commercial, sans licence.
- **Principe** : le layout est repris à 100 %, sauf le héros H MODE, qui est conservé. Le contenu, les produits et le fonctionnement restent ceux de H MODE, avec une touche de beige H MODE.
- **Méthode** : skill CloneMe, 7 lots validés un par un. Fichiers de référence : `design.md`, `palette.md`, `animation.md`.
- **Chaîne** : tsc ✅ · vitest ✅ 17 tests · build ✅ · synchro ✅ 41 / 41 identifiants, 37 / 37 tokens.
- **Lancer** : `./start.sh` → http://localhost:6011 · démo avec prix fictifs : `./start.sh demo` → http://localhost:6012.

## Pages

| ID | Page source | Page H MODE | Statut | Remarque |
|---|---|---|---|---|
| P-01 | `/` | `/` | clonée | Héros H MODE conservé (C-13). « Meilleures ventes » devient « Pièces du moment », « Acheter par style » devient « Acheter par type ». Section H MODE « La Maison » conservée (C-25). |
| P-02 | `/shop` | `/boutique`, `/boutique/:type` | clonée | Mesurée à 4 largeurs. Filtre Marque ajouté. |
| P-03 | `/product` | `/produit/:slug` | clonée | Onglets sans « Avis ». Commande sur WhatsApp. |
| — | `/shop?g=men`, `?g=women`, `?sale=1` | — | non reprise | Aucune donnée genre ni solde chez H MODE. |
| P-04 | `/auth` | `/connexion` | clonée (02/11) | Comptes Supabase (ADR 0005). Sans Google ni inscription aux « drops » ; panneau noir aux contenus réels. |
| — | (panier, commande, compte, infos) | `/panier`, `/commande`, `/compte`, `/contact`, `/maison`, `/faq`… | adaptées | Composants partagés de la référence (C-06, C-19, C-22, C-23, C-24). Leurs pages de commande et de compte ne sont pas visibles sans connexion. |

## Ce qui a été testé

| Vérification | Comment | Résultat |
|---|---|---|
| Empreintes de la boutique | source mesurée sur le vrai site (pas d'iframe ni de relais : leur API refuse localhost), H MODE en iframe, 4 largeurs | titre, colonne de filtres (x 56 / l 220), grille (x 316, écart 24 px) identiques |
| Empreintes de l'en-tête | relais CloneMe, 4 largeurs | hauteur identique à 1440, 1024 et 375 px |
| En-tête au défilement | styles calculés après 50 px | voile 0,72, flou 18 px, saturation 1,4, filet 8 %, marges 14 px : identiques |
| Carte produit | géométrie interne | disque 60 %, image 80 %, cœur à 13 px, padding `16/18/18` : identiques |
| Filtres | clics réels | Jeans → 2 · Jeans + Pantalons → 5 · + Nike → 1 · Tout effacer → 62 · page 3 → 14 cartes |
| Parcours d'achat (démo) | fiche → taille obligatoire → quantité 2 → panier → commande (erreurs puis saisie) → WhatsApp (intercepté) → confirmation | message WhatsApp correct, panier vidé seulement à la confirmation, commande enregistrée dans le compte (donnée de test effacée ensuite) |
| Tests automatiques | `npm test` | 17 / 17, dont le nouveau test des filtres catégorie, étiquette, prix max et URL |
| Débordement mobile | 18 routes à 320 px | aucun |
| Menu mobile, recherche, panier | DOM et styles calculés | conformes aux relevés |

## Écarts restants (expliqués)

| Où | Écart | Raison | Gravité |
|---|---|---|---|
| En-tête | largeur du logo et du menu | « H MODE » est plus court que « ORIGINAL FIT », et nos libellés sont différents | faible |
| En-tête à 768 px | 83 px contre 104 px | leur nom passe sur deux lignes | faible |
| Colonne de filtres | plus haute | 16 marques, plus Couleur et Collection (fonctions H MODE conservées) | voulu |
| Tri | plus étroit | pas d'option de prix tant qu'aucun prix n'est saisi | voulu |
| Pied de page | deuxième ligne | pages d'aide et légales, réglage des animations | voulu |
| Images | photos portées en plein cadre | la source n'a que des chaussures détourées ; seules nos photos sur fond blanc (16) sont posées sur le disque | voulu |
| Couleurs | `color(srgb …)` dans les mesures | même valeur, écrite via `color-mix` par Tailwind | aucun |

## Limites
- **Approximé** :
  - cartes « par type » (1re et dernière sur deux colonnes) ;
  - vignettes de coloris (pas de photo par coloris) ;
  - en-tête des pages intérieures ;
  - pages 404 et confirmation.
- **Non relevé** : leur commande et leur compte (connexion requise), leur intro vidéo et leur choix de langue (exclus à la demande).
- **À regarder en direct**, car le panneau caché du navigateur fige les animations :
  - glissement du menu, de la recherche et du panier (A-09, A-10) ;
  - défilement du bandeau et du filigrane (A-05, A-06) ;
  - survols des cartes (A-01 à A-03, A-12).
- **Non utilisés** : les composants Lightswind `seasonal-hover-cards`, `marquee-menu`, `scroll-reveal` et `shiny-text`. Ils sont conservés en attendant une décision. `ui/src/lightswind.css` est un reste de l'installeur, importé nulle part.

## Dépendances ajoutées

| Paquet | Pourquoi |
|---|---|
| `@fontsource/archivo-black` | police des titres de la référence |
| `@fontsource/space-grotesk` | police du texte de la référence |
| `@fontsource/jetbrains-mono` | police des étiquettes de la référence |

`@fontsource/jost` n'est plus importé ; il est encore listé dans `package.json`. Cormorant reste utilisé pour le logo H MODE.

## Droits
- Original Fit ne publie aucune licence. On reprend la mise en page, le style et les interactions, qui ne sont pas protégés en tant que tels.
- **Rien n'est repris** de leur nom, logo, textes, images ni vidéo. Les polices sont libres (SIL OFL).
- Tous les textes, photos, marques et chiffres affichés viennent des données H MODE (`ui/src/data/`).
