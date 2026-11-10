# TODO — H MODE (à jour au 10/11/2026)

Le code est prêt pour la mise en ligne. Ce qui reste dépend surtout de la boutique et de réglages à faire une fois.
Détail des lots : [`plan.md`](plan.md). Architecture : [`../architecture.md`](../architecture.md).

## Mise en ligne (lot 14) — à faire une fois, pas à pas dans le guide PDF de `DEPLOIEMENT_ET_SUPERVISION/` (checklist : `CHECKLIST_MISE_EN_PRODUCTION.md`)
- [ ] Désactiver GitHub Pages (sert encore l'ancien site sur `oussamaalmouallim.github.io/Hakin-website`).
- [ ] Supabase → Authentication → **SMTP** (Brevo) : sans lui, 2 à 3 e-mails par heure, inscriptions bloquées.
- [ ] Robot de surveillance : `SANTE_JETON` dans `web/.env`, `npm run sante:sql` (coller le SQL), secret GitHub `SANTE_JETON` ; facultatif `NETLIFY_BUILD_HOOK`.
- [x] Netlify (10/11) : variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL` ; site reconstruit avec la base, vraie 404, en-têtes de sécurité vérifiés.
- [ ] Netlify : vérifier qu'un `git push` sur `main` déclenche bien un build (le 10/11, un commit poussé n'avait pas été publié seul).
- [ ] Base en ligne : `npm run sauvegarde`, puis `npx supabase db push` de `20261110120000_sante_et_journal.sql` (santé, 429, journal).
- [ ] Service de surveillance externe (UptimeRobot ou Better Stack, conditions d'usage commercial à lire) : sondes site + `/rest/v1/rpc/sante` (guide, ch. 11).
- [ ] `SANTE_JETON` dans `web/.env` aussi pour que `npm run sauvegarde` note les sauvegardes dans l'admin.
- [ ] GitHub → Actions : variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL`, `SUPABASE_PROJECT_REF`) et secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`).
- [x] Base en ligne (09/11) : projet HMODE relié, 4 premières migrations notées appliquées, 4 du 08/11 poussées. Sauvegarde d'avant dans `~/Documents/HMODE-sauvegardes/` (hors dépôt).
- [x] Supabase → Authentication → URL Configuration (09/11) : Site URL `https://hmodeclothes.netlify.app/`, Redirect URLs `https://hmodeclothes.netlify.app/**` et `http://localhost:6013/**`. À refaire avec le nom de domaine final.
- [ ] Premier push : vérifier que `ci.yml` et `supabase.yml` passent (jamais exécutés sur GitHub à ce jour).
- [x] Anciennes commandes `DEMO-…` : la base en ligne n'a aucune commande (vérifié le 09/11).
- [ ] Nom de domaine (traité à part).

## À saisir dans `/admin` par la boutique
- [ ] **Prix** de chaque pièce (D16) : active le panier pour cette pièce.
- [ ] **Tailles** disponibles et coloris réellement en stock.
- [ ] Frais et délai de livraison à Casablanca (D17) ; « À confirmer » jusque-là.
- [ ] Matière et entretien, quand ils sont connus.
- [ ] Textes juridiques : mentions légales, CGV, confidentialité.

## À garder par la boutique
- [ ] Justificatifs d'agrément revendeur des marques, en cas de contrôle (D1).

## Exploitation, chaque semaine et chaque mois (guide, ch. 18)
- [ ] Chaque semaine : `npm run sauvegarde` (dans `web/`), copie sur un second support. Première faite le 10/11 (`~/Documents/HMODE-sauvegardes/2026-11-10_19h17`).
- [ ] Chaque mois : `npm run sauvegarde:tester`. Premier test réussi le 10/11 (26 tables identiques).

## Technique, plus tard
- [ ] Après la mise en ligne : vérifier sur Netlify qu'une fiche `/produit/<slug>` sert bien sa page d'aperçu (outil de débogage de Meta).
- [ ] Passer Supabase en Pro dès les ventes régulières (pas de mise en pause, sauvegardes).
- [ ] Suivi des achats pour Meta Ads (pixel ou API Conversions) : décision à prendre avec un bandeau de consentement (`marketing/META_ADS.md` § 9).
- [ ] Suppression de compte par le client lui-même (aujourd'hui : sur demande, par l'admin en SQL).

## Fait depuis l'ancienne liste
- Logo : monogramme du héros (D5, 07/11). Photo de campagne : on garde le héros actuel (D6).
- Découpage du chargement par page, Lighthouse, Playwright, `robots.txt`, `sitemap.xml` (lots 13, 13 bis, 22).
- Aperçus Open Graph, supervision, demandes WhatsApp, limites de la base, guide d'hébergement, dossier marketing (lots 24 à 31).
- Supervision en 5 onglets, point de santé, réponses 429, journal technique, sauvegarde et restauration testées par script, guide PDF `DEPLOIEMENT_ET_SUPERVISION/` (lots 32 à 38, 10/11).
- Ancien site retiré de la racine : `archive/ancien-site/` (lot 22), à supprimer seulement après la mise en ligne.
