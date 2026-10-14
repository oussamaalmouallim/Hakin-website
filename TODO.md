# TODO — H MODE

## À fournir par la boutique (bloquant pour la mise en ligne)
- [ ] **Prix** de chaque produit (`ui/src/data/produits.json` → `prixDH`) : active le panier.
- [ ] **Tailles disponibles** par produit et coloris réellement en stock.
- [ ] Matière et entretien (actuellement « À confirmer »).
- [ ] Adresse, horaires, zones, délais et frais de livraison, politique d'échange/retour (`ui/src/data/boutique.json`).
- [ ] Fichier source du **logo** (le monogramme actuel est redessiné d'après `Template/hero.png`).
- [ ] Photo de campagne **sans texte incrusté**, en haute définition (le recadrage actuel fait 560 px de large).
- [ ] Textes juridiques : mentions légales, CGV, confidentialité.
- [ ] Justificatifs d'agrément revendeur des marques, à conserver en cas de contrôle.

## Technique (plan.md, lots 12 à 14)
- [ ] Finitions visuelles page par page, en revue avec toi.
- [ ] Lighthouse (performance ≥ 90 mobile, accessibilité ≥ 95), Playwright sur le parcours complet.
- [ ] Découpage du bundle par route (`React.lazy`), actuellement 138 Ko gzip.
- [ ] Open Graph, sitemap, robots.txt.
- [ ] Retirer l'ancien site (`index.html`, `css/`, `js/`) au moment de la mise en ligne de `ui/`.
