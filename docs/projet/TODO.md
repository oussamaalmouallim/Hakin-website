# TODO — H MODE (à jour au 08/11/2026)

Le code est prêt pour la mise en ligne. Ce qui reste dépend surtout de la boutique et de réglages à faire une fois.
Détail des lots : [`plan.md`](plan.md). Architecture : [`../architecture.md`](../architecture.md).

## Mise en ligne (lot 14) — à faire une fois, étapes dans `README.md`
- [ ] Netlify : importer le dépôt, variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`.
- [ ] GitHub → Actions : variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`, `SUPABASE_PROJECT_REF`) et secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`).
- [ ] Base en ligne : `npx supabase link` puis `migration repair --status applied` sur les 4 migrations.
- [ ] Supabase → Authentication → URL Configuration : Site URL et Redirect URLs avec l'adresse finale.
- [ ] Premier push : vérifier que `ci.yml` et `supabase.yml` passent (jamais exécutés sur GitHub à ce jour).
- [ ] Supprimer les anciennes commandes `DEMO-…` de la base en ligne s'il en reste (lot 18).
- [ ] Nom de domaine (traité à part).

## À saisir dans `/admin` par la boutique
- [ ] **Prix** de chaque pièce (D16) : active le panier pour cette pièce.
- [ ] **Tailles** disponibles et coloris réellement en stock.
- [ ] Frais et délai de livraison à Casablanca (D17) ; « À confirmer » jusque-là.
- [ ] Matière et entretien, quand ils sont connus.
- [ ] Textes juridiques : mentions légales, CGV, confidentialité.

## À garder par la boutique
- [ ] Justificatifs d'agrément revendeur des marques, en cas de contrôle (D1).

## Technique, plus tard
- [ ] Balises Open Graph (aperçu du lien sur WhatsApp et Instagram) : absentes aujourd'hui.
- [ ] Finitions du lot 12 sur les pages compte et infos, en revue avec l'utilisateur.

## Fait depuis l'ancienne liste
- Logo : monogramme du héros (D5, 07/11). Photo de campagne : on garde le héros actuel (D6).
- Découpage du chargement par page, Lighthouse, Playwright, `robots.txt`, `sitemap.xml` (lots 13, 13 bis, 22).
- Ancien site retiré de la racine : `archive/ancien-site/` (lot 22), à supprimer seulement après la mise en ligne.
