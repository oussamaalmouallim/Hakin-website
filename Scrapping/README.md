# Bibliothèque d'images — mode homme automne-hiver (H Mode)

Collecte automatisée et documentée d'images de référence (hoodies, sweats, jeans, maille, vestes, manteaux,
chemises, sneakers Nike / Adidas / New Balance, ensembles, accessoires, looks) pour préparer le catalogue
et la direction artistique du futur site. Priorité : sources du marché marocain.

> **Droits.** Une image collectée n'est pas une image publiable. Voir `22_Reports/inventaire_licences.md`.
> Seules les images de la classe 1 (licences CC / domaine public via Openverse) ont une licence vérifiable
> autorisant l'usage commercial, sous conditions (attribution ; ND = sans modification).
> Les visuels de marques et de boutiques sont des **références internes**.
> Une image de référence ne prouve pas qu'un produit est disponible ou demandé au Maroc.

## Structure

| Dossier | Contenu |
|---|---|
| `01_Jeans_Pantalons/` … `11_Looks_Complets/` | Images conservées, rangées par catégorie / sous-catégorie |
| `02_Hoodies/Non_Precise/` | *Ajout* : hoodie confirmé (capuche citée) mais sous-type non indiqué par la source |
| `12_A_Verifier/` | Classification incertaine (ex. « Sweat » sans mention de capuche ni de col) |
| `13_Rejets/` | *Ajout* : fichiers rejetés (miniatures < 400 px…), conservés pour traçabilité |
| `20_Metadata/` | `catalogue.csv`, `catalogue.json`, `rejets.csv`, `state.sqlite` (état de reprise) |
| `21_Logs/` | Un log par exécution + `runs.jsonl` (statistiques observées de chaque exécution) |
| `22_Reports/` | `galerie.html`, `rapport_collecte.md`, `matrice_sources_categories.md`, `rapport_doublons_rejets.md`, `inventaire_licences.md` |
| `23_Scripts/` | Code (`run.py`, `hmscrape/`), `config.yaml`, `requirements.txt` |

Le marché (maroc / international) et le type de source sont des **attributs** dans les métadonnées, pas des dossiers.
Une image n'existe physiquement qu'à un seul endroit.

**Ancienne structure** (`01_Jeans/`, `02_Sneakers/`…) : absente au démarrage (le dossier ne contenait que
`master_plan_scraper.html`, conservé tel quel). Si des images existent ailleurs dans `Scrapping/`, elles sont
**référencées sans être déplacées** au début de chaque collecte (statut `preexistant`) et servent à éviter les doublons.
Correspondance prévue : `01_Jeans/` → `01_Jeans_Pantalons/`, `02_Sneakers/` → `08_Sneakers/`.

## Installation (macOS)

```bash
cd Scrapping/23_Scripts
uv venv --python 3.12 .venv            # ou : python3 -m venv .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

## Exécution

```bash
.venv/bin/python run.py collect --batch pilot          # lot pilote (quotas réduits)
.venv/bin/python run.py collect --batch full           # collecte étendue
.venv/bin/python run.py collect --batch full --sources kiabi_ma,jumia_ma
.venv/bin/python run.py report                         # régénère exports et rapports, sans réseau
.venv/bin/python run.py status
```

**Reprise** : chaque URL d'image traitée est enregistrée dans `state.sqlite`. Relancer la même commande
reprend sans re-télécharger. Les quotas sont comptés depuis la base : ils sont cumulatifs entre exécutions.

## Configuration (`23_Scripts/config.yaml`)

- `quotas` : `max_per_source`, `max_per_category`, `max_per_subcategory`, `max_images_per_product`, `max_products_per_listing`.
- `batches` : surcharges par lot (`pilot`, `full`) + `max_pages_per_listing`.
- `quality` : seuils de rejet (côté min. < 400 px), « petite » (< 800 px), netteté, distance pHash des quasi-doublons.
- `sources` : une entrée par source ; `enabled: false` + `reason` pour les sources identifiées mais non collectées.
- `license_class` par source : `commercial_ok` | `autorisation_necessaire` | `reference_interne` | `inconnue`.

## Fonctionnement

1. **Découverte** par adaptateur : Shopify (`/products.json` public), Jumia (JSON-LD schema.org des listes + galerie
   produit), Nike (données `__NEXT_DATA__` des pages liste `/w/`), Openverse (API publique, licences CC).
2. **Politesse** : user-agent de bot déclaré (`HModeImageResearchBot`), `robots.txt` vérifié pour chaque URL
   (pages ET hôtes d'images, jokers `*`/`$`), délai ≥ 1,5 s par hôte, respect de `Retry-After` sur 429.
   Aucune connexion, aucun contournement de CAPTCHA / paywall / protection anti-bot.
3. **Meilleure résolution réellement présente dans la page** : Shopify = fichier original ; Jumia = 680×680
   (plus grande taille proposée par la page produit) ; Nike = URL `t_default` présente dans les données de la page.
   Aucune URL n'est forgée pour obtenir une taille non proposée.
4. **Classification** (`hmscrape/taxonomy.py`) : sur le titre du produit d'abord, puis type/tags/rubrique.
   Hoodie = capuche explicitement citée. Sweat sans capuche = indice explicite (col rond, sweat-shirt, crew,
   col montant, demi-zip…). Sinon → `12_A_Verifier`. Les produits hors périmètre (t-shirts manches courtes,
   shorts, femme/enfant, pyjamas…) ne sont pas téléchargés.
   `methode_classification` : `page_source` (textes de la page), `mixte` (couleur complétée par analyse visuelle),
   `visuel` (après vérification visuelle manuelle).
5. **Contrôles** : lecture/validation Pillow, SHA-256 (doublons exacts non re-téléchargés), pHash (quasi-doublons
   signalés, jamais supprimés : plusieurs vues d'un même modèle sont utiles), variance du laplacien (flou possible),
   ratio octets/pixel (compression), détection de fond neutre (photo produit vs portée/lifestyle), couleur dominante.

## Limites connues

- Adidas, New Balance, LC Waikiki, DeFacto, Decathlon, Zara, Avito : HTTP 403 pour un bot déclaré → non collectés.
  Les visuels Adidas / New Balance proviennent de revendeurs marocains (Jumia, ASEY Shop, Elbarouki).
- Koton Maroc : `robots.txt` interdit tout. Instagram / Facebook : connexion requise → exclus.
- Google Images : CGU ; nécessiterait l'API Custom Search (clé). Pexels / Unsplash : API avec clé gratuite, non configurée
  (ajout possible d'un adaptateur avec `PEXELS_API_KEY` / `UNSPLASH_ACCESS_KEY` en variable d'environnement).
- Jumia : pagination interdite par `robots.txt` sur les pages `/mlp-*` ; images limitées à 680 px.
- `type_photo` et `couleur_visuelle` sont des heuristiques (bordures uniformes claires = fond neutre).
- La « vue » (face/dos/profil) n'est renseignée que si le texte alternatif la mentionne ; sinon `inconnu`.
- itsu.ma est désactivé : la boutique mentionne une « qualité 1:1 » (vocabulaire des répliques).
