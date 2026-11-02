# Design — H MODE, direction Original Fit

| | |
|---|---|
| Source | https://www.original-fit.ma/shop et https://www.original-fit.ma/ |
| Relevé le | 2026-11-01 |
| Droits | site commercial, aucune licence : on reprend la mise en page, le style et les interactions ; **aucun** texte, logo, nom ni image de la source |
| Largeurs de référence | 1440 · 1024 · 768 · 375 |
| Stack source | Next.js (Turbopack), Tailwind 4, rendu client (Relevé : `/_next/static/chunks`, classes `bg-(--bg-2)`) |
| Stack H MODE | Vite + React 18 + TypeScript + Tailwind 3.4 + framer-motion (inchangée) |
| Hors périmètre | vidéo d'intro, sélecteur EN/FR, « Connexion » serveur, Hommes/Femmes/Soldes (aucune donnée H MODE) |

## 0. Avancement de la refonte

| Lot | Contenu | Statut |
|---|---|---|
| 1 | Tokens (`tokens.css`, `palette.md`), polices, typographie de base | fait |
| 2 | Gabarit : en-tête, menu mobile, recherche, panier, boutons, bandeau noir, repère latéral, pied | fait |
| 3 | Carte produit (variantes boutique et « meilleures ventes »), prix, image détourée | fait |
| 4 | Boutique (C-10 filtres, C-11 tiroir mobile, C-12 page) : Jeans séparé de Pantalons, filtres Catégorie · Marque · Taille · Prix max · Couleur · Tags · Collection, tri, pagination 24 | fait (tiroir mobile à vérifier en direct) |
| 5 | Accueil (P-01, C-13 à C-18) : héros H MODE ré-habillé · bandeau noir · « Pièces du moment » · « Acheter par type » · bloc noir « Pourquoi H MODE » · carte « Suivre H MODE » · appel final « Parlons style ». Section « La Maison » conservée et ré-habillée (C-25). Retirées : « Collections », « Par signature », « La sélection » (demande utilisateur) ; « Notre regard », engagements, réseaux et contact rapide remplacés par « Pourquoi », « Suivre » et l'appel final | fait |
| 6 | Autres pages (P-03, C-19 à C-24) : fiche produit clonée, en-tête de page, champs, sélecteurs, états vides, 404 et confirmation ; panier, commande, compte et pages d'info héritent de ces composants | fait |
| 7 | Vérifications, non-régression | à faire |

## 1. Pages de la source et correspondance

| Page source | Route H MODE | Adaptation |
|---|---|---|
| `/` accueil | `/` | héros H MODE conservé, sections de la source avec contenu H MODE |
| `/shop` | `/boutique`, `/boutique/:categorie` | filtres catégorie → type de vêtement ; ajout filtre **Marque** |
| `/shop?g=men` · `?g=women` · `?sale=1` | — | non repris : aucune donnée genre ni solde |
| `/auth` | — | non repris : pas de comptes serveur (ADR 0001) |

## 2. Relevés de la source (à 1024 px)

### En-tête
- `header` padding `22px 56px`, hauteur 104 px, fond transparent (Mesuré).
- Logo : pastille noire ronde + nom Archivo Black + sous-ligne mono 11 px `#8a8a8a`, interlettrage 1.98 px (Mesuré).
- Liens : Space Grotesk 14 px / 500, capitales, interlettrage 2.24 px, padding `6px 0`, actif souligné (Mesuré).
- Pilule « Connexion » : mono 11 px, bordure `--ligne-forte`, padding `8px 16px`, rayon plein (Mesuré).

### Boutique
- Titre : Archivo Black 28 px / 42 px, capitales ; compteur mono 11 px gris (Mesuré).
- Tri : `select` mono 11 px capitales, bordure `--ligne`, padding `8px 16px`, rayon plein (Mesuré).
- Colonne filtres 220 px : titre « Filtres » Archivo Black 16 px ; groupes à intitulé mono 11 px gris, interlettrage 2.42 px ; cases + libellé Space Grotesk 14 px ; tailles en pilules mono 11 px, bordure `rgba(10,10,10,.2)`, padding `5px 12px` (Mesuré).
- Grille : 3 colonnes, écart 24 px (Mesuré).

### Carte produit (`article`)
- Fond `--fond`, bordure 1 px `--ligne`, rayon 20 px, `overflow:hidden` (Relevé).
- Zone image carrée, fond `--fond-2` ; disque décoratif 60 % derrière l'objet ; image 80 % `object-contain` (Relevé).
- Pastilles en haut à gauche : mono 10 px, interlettrage 1.6 px, fond `--accent`, padding `4px 8px`, rayon plein (Relevé).
- Cœur : 36 px, fond `rgba(245,244,240,.92)`, en haut à droite à 12 px (Relevé).
- Texte : padding `16px 18px 18px`, écart 4 px ; catégorie mono 10 px gris ; nom Archivo Black 15 px ; sous-ligne mono 10 px gris ; prix Archivo Black 15 px + prix barré 13 px gris (Relevé).
- Bouton d'ajout rapide noir, pleine largeur, en bas, visible au survol (Relevé `.ml-quick`).

### Accueil (sections dans l'ordre, Mesuré @1024)
1. Héros produits (padding `100px 120px 60px`) avec grand mot en filigrane `--filigrane`.
2. Bandeau noir défilant 65 px, padding `18px 0`, texte mono capitales.
3. « Meilleures ventes » : surtitre mono avec filet, titre Archivo Black plein + mot en creux, bouton pilule « Tout voir → », cartes numérotées.
4. « Acheter par style » sur `--fond-2`, padding `90px 56px`.
5. Bloc noir « Pourquoi » : titre plein + creux, 4 arguments numérotés en colonnes séparées par des filets, icônes en carré arrondi.
6. Inscription (accès anticipé) — **non repris** tel quel : pas d'envoi d'e-mail chez H MODE.
7. Grand appel final : réseaux en mono, titre plein + creux centré, bouton jaune pilule.
8. Pied : mono 11 px gris, padding `28px 56px`.

## 2 bis. Composants du gabarit (lot 2)

| ID | Composant | Fichier | Reprise de la source | Adaptation H MODE | Origine |
|---|---|---|---|---|---|
| C-01 | En-tête | `ui/src/components/EnTete.tsx`, `design-system/Marque.tsx` (logo) | fixe, `px-5 py-4` / `md:px-14 md:py-[22px]`, logo pastille -12° + nom 17 px + sous-ligne mono, liens 14 px/500 interlettrage .16em écart 42 px, boutons ronds 38 px, pilule mono à droite, burger 3 traits | liens : Accueil · Boutique · T-shirts · Sweats · Sneakers (au lieu de Hommes/Femmes/Soldes ; types visibles dès 1280 px) ; EN/FR remplacé par Favoris ; « Connexion » → « Compte » ; « H » de la pastille en Cormorant | Relevé + Mesuré |
| C-02 | Bandeau noir défilant | `ui/src/components/Ambiance.tsx` (`BandeauDefilant`) | fond encre, `py-[18px]`, Archivo Black 18 px capitales, pastille jaune 10 px, écart 48 px | faits réels : paiement à la livraison, WhatsApp, nombre de marques et de pièces lus dans le catalogue, Casablanca | Relevé |
| C-03 | Pied de page | `ui/src/components/PiedDePage.tsx` | ligne mono 11 px capitales gris, faits du centre en encre, liens à droite, `px-5 py-5` / `md:px-14 md:py-7` | seconde ligne ajoutée (aide, légal, réglage des animations) pour ne perdre aucune page | Relevé + Approximé |
| C-04 | Menu mobile | `ui/src/components/Panneaux.tsx` (`MenuMobile`) | plein écran, `pt-24 px-8 pb-8`, liens Archivo Black 36 px, liens secondaires mono en bas, croix en haut à droite | les 6 types de vêtements ; réseaux en bas | Relevé |
| C-05 | Recherche | `ui/src/components/Panneaux.tsx` (`Recherche`) | volet du haut, en-tête mono « Recherche / Échap », champ Archivo Black clamp(28–42 px) souligné 1,5 px, colonnes 1fr / 1.4fr | populaires = types de vêtements, remplacés pendant la saisie par les marques et types correspondants (avec compteur) ; à droite pièces mises en avant puis 6 résultats classés + « Voir les N résultats » vers `/recherche` ; état vide avec exemples | Relevé |
| C-06 | Panier latéral | `ui/src/design-system/Superposition.tsx` (`Tiroir`), `Panneaux.tsx` (`MiniPanier`) | 460 px, filet gauche, ombre portée, titre 20 px capitales, état vide centré (rond 64 px, titre 18 px, bouton pilule) | lignes du panier H MODE, sous-total, Commander | Relevé |
| C-07 | Repère latéral | `ui/src/components/Ambiance.tsx` (`RepereLateral`) | fixe à droite ≥ 1024 px, mono 10 px vertical, filet 60 px | « H MODE » / « Casa » | Relevé |
| C-08 | Boutons pilule | `ui/src/design-system/Bouton.tsx` | mono 11 px capitales .18em, rayon plein ; variante jaune Archivo Black | variantes H MODE conservées (whatsapp, texte) | Relevé |

Comparaison par empreintes (`.cloneme/mesures/`, P-02 boutique, 4 largeurs) : hauteur d'en-tête identique à 1440, 1024 et 375 px (83 / 83 / 71 px).
Écarts expliqués : largeur du logo et des liens (textes différents), position du menu qui en découle ; à 768 px la source fait 104 px car son nom « ORIGINAL FIT » passe sur deux lignes.
Les couleurs `color(srgb …)` côté H MODE sont les mêmes valeurs écrites autrement (Tailwind passe par `color-mix`).

## 2 ter. Carte produit (lot 3)

| ID | Composant | Fichier | Reprise de la source | Adaptation H MODE | Origine |
|---|---|---|---|---|---|
| C-09 | Carte produit | `ui/src/components/CarteProduit.tsx`, `design-system/Prix.tsx`, `design-system/Image.tsx` | `article` : bordure 1 px `--ligne`, rayon 20 px, fond `--fond` ; zone image carrée `--fond-2` ; disque 60 % bicolore à 135° opacité .2 ; image 80 % `object-contain` ; pastilles mono 10 px à 10 px du bord, 28 px d'écart ; cœur 36 px à 12 px (survol rouge) ; texte `16px 18px 18px`, écart 4 px : catégorie mono 10 px, nom Archivo Black 15 px, sous-ligne mono 10 px, prix Archivo Black 15 px avec barré 13 px. Variante `numero` (`.ml-card`) : chiffre en creux 46 px, disque uni 62 % opacité .24, bouton noir en bas | ligne 1 = marque (filtre Marque), sous-ligne = type · nombre de coloris ; pastilles « Nouveau », « À la une », « Épuisé » (données réelles) ; pastilles de coloris à la place de la note (pas d'avis chez H MODE) ; « Prix sur demande » quand le prix manque (ADR 0002) ; bouton rapide « Choisir la taille » (on ne peut pas ajouter sans taille) | Relevé + Mesuré |

Image : la référence n'a que des chaussures détourées. Chez H MODE, seules les photos sur fond quasi blanc (coins ≥ 245, liste `ui/src/data/fonds-clairs.json` produite par `npm run images` : 15 sneakers, 1 sweat ; les 16 sneakers sont détourées par catégorie) sont posées sur le disque, en `mix-blend-multiply`. Les photos portées remplissent la zone image (Approximé : un portrait réduit à 80 % sur un disque rendait mal).
Mesuré à 1440 px sur `/boutique` : disque 60 %, image 80 %, cœur à 13 px du bord, pastille à 11 px, padding texte `16px 18px 18px` — mêmes proportions que la source (carte 199 px chez elle, la grille sera reprise au lot 4).

## 2 ter bis. Boutique (lot 4)

| ID | Élément | Fichier | Reprise de la source | Adaptation H MODE | Origine |
|---|---|---|---|---|---|
| P-02 | Boutique `/boutique`, `/boutique/:type` | `ui/src/features/catalogue/PageBoutique.tsx` | `/shop` : `pt-20`, bandeau `px-5 md:px-14 py-6` filet bas, titre 28 px, compteur mono, tri pilule | `/boutique/<type>` coche le type ; plusieurs types → `/boutique?categorie=…` | Mesuré 4 largeurs |
| C-10 | Colonne de filtres | `ui/src/features/catalogue/Filtres.tsx` | `aside` 220 px `gap-6` : « Filtres » + « Tout effacer », Catégorie (cases), Taille (pilules), Prix max (curseur), Tags | Catégorie = type de vêtement ; **Marque** ajoutée ; Couleur (pastilles de teinte 32 px, nom et nombre en info-bulle) et Collection conservées ; Taille et Prix max masqués sans données | Relevé |
| C-11 | Tiroir de filtres mobile | `PageBoutique.tsx` (`TiroirFiltres`) | voile encre 40 %, panneau gauche 300 px `p-8`, bouton « Appliquer les filtres » | — | Relevé |
| C-12 | Grille et pagination | `PageBoutique.tsx` | grille 2 / 3 colonnes écart 24 px, 24 cartes par page, « Préc. 1 2 Suiv. » | — | Mesuré |

Mesures source / H MODE identiques à 1440, 1024, 768 et 375 px : titre à 104 px, colonne de filtres x 56 / l 220, grille x 316, écart 24 px. Écarts expliqués : hauteur des filtres (16 marques), largeur du tri (pas d'option de prix sans prix), hauteur du pied (2e ligne).

## 2 quinquies. Fiche produit et pages intérieures (lot 6)

| ID | Élément | Fichier | Reprise de la source | Adaptation H MODE | Origine |
|---|---|---|---|---|---|
| P-03 | Fiche produit `/produit/:slug` | `ui/src/features/produit/PageProduit.tsx` | `/product` : `pt-20`, fil d'Ariane mono `py-4`, grille 1.2fr / 1fr écart 64 px, titre clamp(36–56 px) + catégorie en creux, prix 32 px, description 15 px gris, « Couleur — », « Taille — Choisir », quantité + bouton plein + favori 48 px, bouton secondaire `--fond-2`, onglets, « Vous aimerez aussi » 4 colonnes | marque en surtitre ; bouton secondaire = « Commander sur WhatsApp » ; sans prix → bouton principal WhatsApp (ADR 0002) ; onglets Description · Caractéristiques · Matière & entretien · Livraison & paiement (pas d'avis) ; barre d'achat mobile conservée ; achat (02/11, Relevé) : « Ajouter au panier — prix » fond filet / texte gris sans taille, puis « Commander · Paiement à la livraison » (fond `--fond-2`, filet fort, 40 % sans taille) → commande directe `/commande?article=…` | Relevé |
| P-04 | Connexion `/connexion`, `/connexion/nouveau-mot-de-passe` | `ui/src/features/compte/PageConnexion.tsx` | `/auth` : plein écran sans en-tête ni pied, 2 colonnes ; formulaire 400 px `px-6 py-12 md:px-16`, logo `mb-10`, onglets pilule `bg-fond-2 p-1` (actif encre), titre 32 px, sous-titre 14 px gris `mb-8`, champs C-26 `gap-4`, « Se souvenir de moi » + « Mot de passe oublié ? » mono 11 px, bouton encre `py-4` (+2 % au survol, 60 % en envoi) ; inscription Prénom/Nom en 2 colonnes, e-mail, mot de passe (œil), confirmation, case CGU ; panneau noir C-27 masqué en mobile | pas de bouton Google ni de case « drops » (aucune fonction derrière) ; vues ajoutées : mot de passe oublié, « vérifiez vos e-mails », nouveau mot de passe, alertes serveur (Approximé) ; lien « Continuer sans compte » ; Supabase Auth (ADR 0005) | Relevé + Approximé |
| P-05 | Checkout `/commande` (panier ou `?article=…`) | `ui/src/features/commande/PageCommande.tsx` | `/checkout` : `pt-20`, `px-5 md:px-14 py-8`, lien retour mono pleine largeur, « Commander » 32 px interligne 1,5 `mb-8`, grille 1fr / 440 px écart 48 px (dès 1024 px chez H MODE : la référence déborde à 768 px) ; sections C-28 (adresse : champs C-26 ; livraison : carte filet encre rayon 14 px `--fond-2` ; paiement : carte filet 2 px rayon 18 px, icône sur carré encre 48 px, radio plein, coches jaunes) ; récapitulatif C-29 ; erreurs « Requis » en mono rouge | pas d'avance ni de code promo (inexistants chez H MODE) ; frais et délai « À confirmer » (`boutique.json`) ; e-mail et instructions facultatifs repliés derrière « + E-mail ou instructions » ; encart intérieur du paiement = confirmation WhatsApp (au lieu de l'avance) ; case CGV à la place du code promo ; adresses enregistrées en pilules + « Enregistrer cette adresse » (connecté) ; case CGV gardée dans le récapitulatif ; commande enregistrée par `passer_commande` puis WhatsApp ; démo : référence `DEMO-…` | Relevé |
| P-06 | Panier `/panier` | `ui/src/features/panier/PagePanier.tsx` | — (la référence n'a qu'un tiroir, C-06) : mise en page du checkout P-05 — lien retour mono, « Panier » 32 px, compteur mono, grille 1fr / 440 px dès 1024 px ; articles en cartes `--fond-2` rayon 20 px (vignette 120 px rayon 14 px, marque et détail mono 10 px, nom Archivo Black 16 px, quantité en pilule, « Retirer » souligné, total 18 px) ; récapitulatif noir C-29 avec encart jaune et bouton jaune « Commander » | annulation du retrait conservée ; frais « À confirmer » | Approximé |
| C-19 | Sélecteurs taille, coloris, quantité | `ui/src/design-system/Selecteurs.tsx` | tailles en grille 4 / 6 colonnes rayon 10 px mono 12 px ; vignettes coloris carrées ; quantité en pilule | coloris = carré teinté (pas de photo par coloris), sans nom affiché ; `PastilleCouleur` remplace le nom de couleur dans le panier, la commande et le compte | Relevé + Approximé |
| C-20 | Galerie | `PageProduit.tsx` (`Galerie`) | carrés `--fond-2` rayon 20 px, 2 colonnes écart 12 px, vignettes 4 colonnes, pastille « Nouveau » avec point animé | 1 photo → grand carré ; clic = agrandir | Relevé |
| C-21 | Onglets | `PageProduit.tsx` | mono 12 px .18em, actif souligné 2 px, contenu `py-10` 640 px, tableau à filets (intitulé mono 140 px) | — | Relevé |
| C-22 | En-tête des pages intérieures | `ui/src/components/EnTetePage.tsx`, `design-system/Navigation.tsx` (`FilAriane`) | fil d'Ariane mono de la fiche, titre de la fiche, filet bas du bandeau `/shop` | utilisé par panier, commande, compte, contact, maison, collections, recherche, pages d'info | Relevé + Approximé |
| C-23 | Champs de formulaire | `ui/src/design-system/Champ.tsx` | `/auth` : bordure `--ligne-forte`, rayon 10 px, `px-4 py-3`, libellé mono 10 px, case native teintée encre | erreurs en mono rouge | Relevé |
| C-24 | Pages d'état | `ui/src/features/infos/Page404.tsx`, `features/commande/PageConfirmation.tsx` | vocabulaire de l'appel final : géant en creux, titre plein, boutons pilule | textes H MODE conservés | Approximé |

Non relevé (derrière un panier rempli ou une connexion chez la source) : page de commande et compte. Ils reprennent les composants ci-dessus (Approximé).

## 2 quater. Accueil (lot 5)

| ID | Section | Reprise de la source | Adaptation H MODE | Origine |
|---|---|---|---|---|
| P-01 | Accueil `/` | ordre des sections de `/` | voir ci-dessous | Relevé |
| C-13 | Héros | — (exception : héros H MODE conservé) | typographie de la référence : titre Archivo Black interligne .88 ; « Casablanca » entre deux filets puis l'accroche (ligne pleine + ligne en creux), centrés sous le nom ; boutons pilule ; personnage remplacé (02/11) par photomontage : la photo fournie est posée sur la scène d'origine à la place de l'ancien personnage, masque fondu sur la silhouette (`ui/scripts/montage-heros.mjs` → `medias/campagne/hero4-scene.jpg`) ; scène, flou, cadrage, portrait mobile et grille inchangés | Approximé |
| C-14 | « Pièces du moment » | section « Les plus aimés / Meilleures ventes » : `py-12 px-5` / `md:py-[90px] md:px-14`, en-tête surtitre + titre clamp(48–96 px) plein + creux, pilule « Tout voir → », grille 2 / 4 colonnes écart 24 px, cartes numérotées | les 8 pièces `misEnAvant` ; pas de « meilleures ventes » (aucune donnée de vente) | Relevé |
| C-15 | « Acheter par type » | « Acheter par style » `.style-card` : fond `--fond-2` filets haut/bas, cartes 340 / 480 px rayon 24 px, disque, mot géant en creux, pastille + flèche jaune 46 px, image inclinée -12°, nom clamp(28–42 px) + compteur mono | 7 types de vêtements ; teintes encre, jaune, **beige H MODE** ; 1re et dernière carte sur 2 colonnes (Approximé) ; photos en vignette arrondie (pas de détourage) | Relevé + Approximé |
| C-16 | « Pourquoi H MODE » | bloc noir « Pourquoi OF » (disque jaune 10 % retiré : rendu jugé buggé par l'utilisateur), titre clair plein + creux italique, 4 colonnes filets 12 %, numéro jaune, icône dans carré 54 px rayon 14 px | 4 arguments réels : revendeur agréé (D1), conseil WhatsApp, paiement à la livraison, commande confirmée sur WhatsApp (ADR 0001) | Relevé |
| C-17 | « Suivre H MODE » | carte noire 780 px rayon 28 px sur filigrane géant défilant (« GET YOURS ») | pas d'e-mail chez H MODE : 3 lignes Instagram, Facebook, WhatsApp avec bouton jaune « Suivre » ; filigrane « H MODE » | Relevé + Approximé |
| C-25 | « La Maison » | — (section H MODE conservée) | écrin noir rayon 28 px avec marques qui défilent (LoopingWords), titre plein + creux, chiffres réels (CountUp), pilule « Découvrir la maison » ; placée entre « par type » et « pourquoi » | Approximé |
| C-26 | Champ d'authentification | `PageConnexion.tsx` (`ChampAuth`) | libellé mono 10 px .2em gris `mb-1`, champ `px-4 py-3` rayon 10 px 15 px, filet fort → encre au focus ; erreur : filet `--danger` + message mono 10 px .15em capitales | messages : « Requis », « Entrez un email valide », « Min 8 caractères » (Relevé) ; « Les mots de passe ne correspondent pas », conditions (Approximé) | Relevé |
| C-27 | Panneau membre | `PageConnexion.tsx` (`PanneauMembre`) | fond encre `p-16`, filigrane 200 px à 6 % qui défile (A-06), pastille jaune mono 10 px, titre clamp(40–64 px) interligne .9, carte `bg-fond/6%` rayon 20 px vignette 80 px, avantages à coches jaunes 2 colonnes | aucun « drop », prix ni nombre de membres inventés : fonctions réelles du compte, pièce à la une réelle, paiement de `boutique.json` | Relevé |
| C-28 | Section numérotée du checkout | `PageCommande.tsx` (`Section`) | titre Archivo Black 18 px .04em, pastille jaune 28 px, chiffre mono 12 px, `mb-6` | — | Relevé |
| C-29 | Récapitulatif du checkout | `PageCommande.tsx` (`aside`) | fond encre rayon 24 px `p-8`, collant à 100 px ; vignettes 56 px rayon 10 px ; nom 13 px, détail mono 10 px à 50 % ; totaux 13 px à 60 % à filets 10 %, total 26 px ; encart jaune rayon 18 px ; bouton jaune `py-4` (+2 %, survol jaune doux) ; mention mono 9 px à 40 % | encart « À payer à la livraison » au lieu de l'avance ; pastilles de couleur | Relevé |
| C-18 | Appel final | « Aller plus loin » : filet 80 px, réseaux mono, titre clamp(48–160 px) plein + creux, texte gris, bouton jaune 14 px avec point noir | « Parlons style », bouton « Écrire sur WhatsApp » | Relevé |

Vérifié : 1440 px (captures), 375 px sans débordement horizontal. Les 6 composants Lightswind (`ui/src/components/lightswind/`) ne sont plus utilisés nulle part ; conservés (règle : ne supprimer aucun fichier) — à décider.

## 3. Organisation du catalogue H MODE

Par type de vêtement, d'après `ui/src/data/produits.json` (62 produits) :
T-shirts (10) · Sweats & hoodies (27) · Vestes (3) · Jeans (2) · Pantalons (3) · Sneakers (16) · Accessoires (1).
Aucune catégorie « Ensembles » ni « Survêtements » : aucun produit réel ne les remplit.
Les 16 marques restent accessibles par le filtre **Marque**.

## 4. Limites

- Aucun prix n'est renseigné dans les données : les cartes affichent « À confirmer » à la place du prix.
- Les relevés sont faits à 1024 px ; les autres largeurs sont complétées lot par lot.
