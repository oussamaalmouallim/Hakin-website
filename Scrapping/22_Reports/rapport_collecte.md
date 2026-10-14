# Rapport de collecte

Toutes les valeurs ci-dessous sont **observées** (comptées dans `20_Metadata/state.sqlite`). Aucune estimation.

## Par source

| Source | Marché | Pages/API visitées | Échecs | ok | à vérifier | rejetées | doublons exacts | erreurs |
|---|---|---|---|---|---|---|---|---|
| Kiabi Maroc | maroc | 25 | 23 | 26 | 0 | 0 | 0 | 0 |
| ASEY Shop | maroc | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Elbarouki Store | maroc | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| Jumia Maroc | maroc | 91 | 0 | 68 | 0 | 0 | 1 | 0 |
| Nike (site officiel, FR) | international | 8 | 0 | 36 | 0 | 4 | 0 | 0 |

## Sources identifiées non collectées

| Source | Raison |
|---|---|
| itsu.ma | La boutique mentionne une 'qualité premium 1:1' (vocabulaire des répliques). Exclue par prudence ; activable pour référence visuelle uniquement. |
| Openverse (CC / domaine public) | robots.txt de api.openverse.org : 'Disallow: /v1/images/' pour tous les agents (vérifié le 2026-10-10). |
| Wikimedia Commons | robots.txt : 'Disallow: /w/' (API incluse) et '/api/' pour tous les agents. |
| Adidas (site officiel) | HTTP 403 (protection anti-bot) sur site et robots.txt. |
| New Balance (site officiel) | HTTP 403 (protection anti-bot). |
| Avito Maroc | HTTP 403 sur les pages ; annonces de particuliers (données personnelles). |
| LC Waikiki Maroc | HTTP 403 (protection anti-bot). |
| DeFacto | HTTP 403 (protection anti-bot). |
| Decathlon Maroc | HTTP 403 (protection anti-bot). |
| Koton Maroc | robots.txt : 'User-agent: * / Disallow: /'. |
| Zara Maroc | HTTP 403 pour un user-agent de bot déclaré. |
| Celio Maroc | Page d'accueil = page JS minimale (1,4 Ko) ; pas de contenu exploitable sans navigateur. |
| Marjane Mall | Site Next.js accessible ; adaptateur non encore écrit (candidat lot 3). |
| Instagram | Connexion requise pour la navigation ; automatisation interdite par les CGU. |
| Facebook / Marketplace | Connexion requise ; automatisation interdite par les CGU. |
| Google Images | Scraping interdit par les CGU ; nécessiterait l'API Custom Search (clé payante). |
| Pexels | HTTP 403 sur le site ; API gratuite disponible avec clé (PEXELS_API_KEY) — non configurée. |
| Unsplash | HTTP 401 ; API disponible avec clé (UNSPLASH_ACCESS_KEY) — non configurée. |
| OTMAROC | Nom de domaine expiré (vérifié). |

## Couverture par catégorie / sous-catégorie (images conservées)

| Catégorie | Sous-catégorie | Images | Maroc | International |
|---|---|---|---|---|
| 01_Jeans_Pantalons | Jeans_Slim_Straight_Regular | 6 | 6 | 0 |
| 01_Jeans_Pantalons | Jeans_Baggy_Loose_Wide | 0 ⚠️ non couvert | 0 | 0 |
| 01_Jeans_Pantalons | Jeans_Cargo_Vintage | 0 ⚠️ non couvert | 0 | 0 |
| 01_Jeans_Pantalons | Cargos_Chinos | 5 | 3 | 2 |
| 01_Jeans_Pantalons | Joggers_Survetement | 3 (faible) | 3 | 0 |
| 01_Jeans_Pantalons | Velours_Hiver | 0 ⚠️ non couvert | 0 | 0 |
| 02_Hoodies | Kangourou_Classique | 6 | 6 | 0 |
| 02_Hoodies | Zippe_Demi_Zip | 6 | 6 | 0 |
| 02_Hoodies | Oversize_Baggy | 8 | 6 | 2 |
| 02_Hoodies | Uni_Minimaliste | 0 ⚠️ non couvert | 0 | 0 |
| 02_Hoodies | Imprime_Graphique_Logo | 2 (faible) | 2 | 0 |
| 02_Hoodies | Fleece_Double_Hiver | 6 | 0 | 6 |
| 02_Hoodies | Non_Precise | 11 | 11 | 0 |
| 03_Sweats_Sans_Capuche | Col_Rond | 5 | 5 | 0 |
| 03_Sweats_Sans_Capuche | Zippe_Demi_Zip_Quarter_Zip | 6 | 4 | 2 |
| 03_Sweats_Sans_Capuche | Col_Montant | 3 (faible) | 3 | 0 |
| 03_Sweats_Sans_Capuche | Imprime_Graphique_Logo | 6 | 6 | 0 |
| 03_Sweats_Sans_Capuche | Fleece_Molleton_Epais | 2 (faible) | 0 | 2 |
| 04_Pulls_Maille | — | 0 ⚠️ non couvert | 0 | 0 |
| 05_Vestes_Blousons | — | 6 | 0 | 6 |
| 06_Manteaux_Exterieur | — | 0 ⚠️ non couvert | 0 | 0 |
| 07_Chemises_Hauts | — | 4 (faible) | 2 | 2 |
| 08_Sneakers | Nike | 12 | 0 | 12 |
| 08_Sneakers | Adidas | 12 | 12 | 0 |
| 08_Sneakers | New_Balance | 12 | 12 | 0 |
| 08_Sneakers | Autres_References | 4 (faible) | 4 | 0 |
| 09_Ensembles_Survetements | — | 3 (faible) | 3 | 0 |
| 10_Accessoires | — | 2 (faible) | 0 | 2 |
| 11_Looks_Complets | Streetwear | 0 ⚠️ non couvert | 0 | 0 |
| 11_Looks_Complets | Casual | 0 ⚠️ non couvert | 0 | 0 |
| 11_Looks_Complets | Superposition_Hiver | 0 ⚠️ non couvert | 0 | 0 |
| 12_A_Verifier | — | 0 restant(s) à vérifier | | |

## Exécutions

| Début | Lot | Requêtes HTTP | Bloquées par robots.txt | Résultats par issue |
|---|---|---|---|---|
| 2026-10-10T18:00:52 | pilot | 13 | 6 |  |
| 2026-10-10T18:07:25 | pilot | 28 | 0 | a_verifier=9, ok=14 |
| 2026-10-10T18:11:15 | pilot | 129 | 0 | a_verifier=4, doublon_exact=1, hors_perimetre=2, ok=67, quota_sous_categorie=2, rejete=31 |
| 2026-10-10T18:15:12 | pilot | 44 | 0 | a_verifier=8, hors_perimetre=1, ok=32, quota_sous_categorie=3 |
| 2026-10-10T18:16:39 | pilot | 6 | 0 |  |
| 2026-10-10T18:24:21 | pilot | 10 | 0 |  |
| 2026-10-10T18:37:19 | pilot | 91 | 0 | deja_vu=41, hors_perimetre=10, ok=28, quota_categorie=8, quota_sous_categorie=13 |
