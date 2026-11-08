# TODO — H MODE (à jour au 08/11/2026)

Le code est prêt pour la mise en ligne. Ce qui reste dépend surtout de la boutique et de réglages à faire une fois.
Détail des lots : [`plan.md`](plan.md). Architecture : [`../architecture.md`](../architecture.md).

## Mise en ligne (lot 14) — à faire une fois, pas à pas dans `GUIDE_HEBERGEMENT.md` § C
- [ ] Désactiver GitHub Pages (sert encore l'ancien site sur `oussamaalmouallim.github.io/Hakin-website`).
- [ ] Supabase → Authentication → **SMTP** (Brevo) : sans lui, 2 à 3 e-mails par heure, inscriptions bloquées.
- [ ] Robot de surveillance : `SANTE_JETON` dans `web/.env`, `npm run sante:sql` (coller le SQL), secret GitHub `SANTE_JETON` ; facultatif `NETLIFY_BUILD_HOOK`.
- [ ] Netlify : importer le dépôt, variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`.
- [ ] GitHub → Actions : variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`, `SUPABASE_PROJECT_REF`) et secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`).
- [ ] Base en ligne : `npx supabase link`, `migration repair --status applied` sur les 4 premières migrations, puis `db push` pour les 4 du 08/11.
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
- [ ] Après la mise en ligne : vérifier sur Netlify qu'une fiche `/produit/<slug>` sert bien sa page d'aperçu (outil de débogage de Meta).
- [ ] Passer Supabase en Pro dès les ventes régulières (pas de mise en pause, sauvegardes).
- [ ] Suivi des achats pour Meta Ads (pixel ou API Conversions) : décision à prendre avec un bandeau de consentement (`marketing/META_ADS.md` § 9).
- [ ] Suppression de compte par le client lui-même (aujourd'hui : sur demande, par l'admin en SQL).

## Fait depuis l'ancienne liste
- Logo : monogramme du héros (D5, 07/11). Photo de campagne : on garde le héros actuel (D6).
- Découpage du chargement par page, Lighthouse, Playwright, `robots.txt`, `sitemap.xml` (lots 13, 13 bis, 22).
- Aperçus Open Graph, supervision, demandes WhatsApp, limites de la base, guide d'hébergement, dossier marketing (lots 24 à 31).
- Ancien site retiré de la racine : `archive/ancien-site/` (lot 22), à supprimer seulement après la mise en ligne.
