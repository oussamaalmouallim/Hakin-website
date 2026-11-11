# Checklist de mise en production de H MODE

À cocher dans l'ordre. Le détail de chaque ligne est dans le guide PDF (numéro de chapitre entre parenthèses).
État au **10/11/2026** : `[x]` fait et vérifié, `[ ]` à faire.

## 1. Déjà fait

- [x] Base en ligne reliée, 8 migrations appliquées (09/11), sauvegarde d'avant gardée hors du dépôt (ch. 8)
- [x] Supabase → Authentication → URL Configuration : `https://hmodeclothes.netlify.app/` et `/**`, plus `http://localhost:6013/**` (ch. 8)
- [x] Netlify : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL` ; site reconstruit le 10/11 avec l'adresse de la base (ch. 9)
- [x] En ligne : `/` 200, `/boutique` 200, adresse inconnue **404**, `/sitemap.xml` 200, en-têtes CSP, HSTS, X-Frame-Options présents (ch. 9)
- [x] Première sauvegarde par script et **restauration testée** (10/11) (ch. 14)

## 2. Avant d'ouvrir au public

### Code et base
- [ ] Pousser les derniers commits sur `main` ; CI verte sur GitHub → Actions (ch. 7)
- [x] Migration `20261110120000_sante_et_journal.sql` appliquée le 10/11, après sauvegarde (ch. 8)
- [x] `https://<projet>.supabase.co/rest/v1/rpc/sante?apikey=<clé publique>` répond `{"ok": true, …}` (vérifié le 10/11) (ch. 11)
- [ ] Désactiver GitHub Pages (l'ancien site y est encore publié) (ch. 7)

### E-mails
- [ ] Supabase → Authentication → **SMTP** (Brevo) : sans lui, 2 à 3 e-mails par heure, inscriptions bloquées (ch. 8)
- [ ] Créer un compte client avec votre adresse ; confirmer ; tester « mot de passe oublié » (ch. 17)

### Surveillance
- [ ] `SANTE_JETON` : `openssl rand -hex 24` → `web/.env` → `npm run sante:sql` → SQL Editor → secret GitHub `SANTE_JETON` (ch. 10)
- [ ] GitHub → Actions → variables `SITE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (ch. 10)
- [ ] GitHub → Actions → **Surveillance → Run workflow** : vert, puis visible dans l'admin (ch. 10)
- [ ] github.com → Settings → Notifications → Actions → *Only notify for failed workflows* (ch. 13)
- [ ] Service externe (UptimeRobot ou Better Stack, conditions d'usage commercial lues) : 2 sondes, site et `rpc/sante` (ch. 11)
- [ ] Facultatif : build hook Netlify → secret `NETLIFY_BUILD_HOOK` (ch. 10)

### Boutique
- [ ] Prix, tailles et coloris saisis dans `/admin` pour les pièces vendues (ch. 17)
- [ ] Frais et délai de livraison saisis (Réglages) (ch. 17)
- [ ] Textes juridiques : mentions légales, CGV, confidentialité (ch. 17)
- [ ] Une commande réelle de test, de bout en bout, puis annulée et supprimée (ch. 17)
- [ ] Un bouton WhatsApp d'une fiche : la demande apparaît dans **Ventes → Demandes WhatsApp** (ch. 17)
- [ ] Une fiche partagée dans l'[outil de débogage de Meta](https://developers.facebook.com/tools/debug/) : titre et image corrects (ch. 17)

## 3. Nom de domaine (quand il est acheté)

- [ ] Acheter le domaine (`.ma` chez un registrar agréé ANRT, ou `.com`) ; lire le **prix de renouvellement** (ch. 6)
- [ ] Netlify → Domain management → Add a domain → `<domaine>` et `www.<domaine>` (ch. 6)
- [ ] Chez le registrar : enregistrements DNS donnés par Netlify, recopiés **exactement** (ch. 6)
- [ ] Netlify → HTTPS : certificat actif ; *Force HTTPS* (ch. 9)
- [ ] `SITE_URL` = `https://<domaine>` dans Netlify **et** GitHub, puis Trigger deploy (ch. 9)
- [ ] Supabase → URL Configuration : Site URL et Redirect URLs avec le domaine (ch. 8)
- [ ] Service externe et robot : adresse du site mise à jour (ch. 11)
- [ ] Brevo : expéditeur `noreply@<domaine>` et domaine authentifié (SPF, DKIM) (ch. 8)

## 4. Le jour de l'ouverture

- [ ] `npm run sauvegarde` (ch. 14)
- [ ] Admin → Supervision → **Contrôler maintenant** : tout « Opérationnel » (ch. 10)
- [ ] Netlify → Usage : jauge de crédits notée (ch. 15)
- [ ] Prévenir la boutique : où voir les commandes et les demandes WhatsApp

## 5. Dès les ventes régulières

- [ ] Supabase **Pro** (25 $/mois ≈ 244 DH) : plus de mise en pause, sauvegardes quotidiennes (ch. 5)
- [ ] Après le passage : Supabase → Database → Backups, vérifier qu'une sauvegarde du jour existe
