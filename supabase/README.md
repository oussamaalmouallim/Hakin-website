# Base de données Supabase

- `migrations/` : le schéma, dans l'ordre. Chaque fichier peut être rejoué sans danger (`if not exists`, `create or replace`).
  - `20261102120000_schema.sql` : comptes, profils, adresses, panier, favoris, commandes (`passer_commande`).
  - `20261105120000_favoris.sql` : favoris (déjà dans le schéma ; gardé pour les bases créées avant).
  - `20261107120000_administration.sql` : administration (catalogue, réglages, journal, photos, `passer_commande` v2).
  - `20261107180000_cle_admin.sql` : clé de sécurité de l'administration.
  - `20261108120000_limites_commandes.sql` : limites par visiteur et plafond global (`passer_limite`), commande v3 (pièce, coloris, taille, ville vérifiés en base).
  - `20261108130000_supervision.sql` : rôles `technique` / `commerce`, contrôles de santé (robot à jeton), erreurs du site, pages vues, sauvegardes notées, `statistiques_supervision()`.
  - `20261108140000_demandes_whatsapp.sql` : demandes WhatsApp notées au clic, suivies dans l'admin (jamais des commandes).
  - `20261108150000_republication.sql` : le robot relance un build Netlify quand le catalogue a changé (au plus toutes les 12 h).
  - `20261110120000_sante_et_journal.sql` : point de santé public `GET /rpc/sante`, HTTP 429 + `Retry-After` dans `passer_limite`, états des services (`etat_supervision`), journal technique filtrable, déploiements vus, événements (clé admin, sauvegardes par script). En ligne depuis le 10/11.
- `seed.sql` : base locale seulement, sans données.
- `config.toml` : Supabase local (`npx supabase start`).

Nouvelle évolution : `npx supabase migration new <nom>` puis écrire le SQL. En ligne, la CI l'applique
(`.github/workflows/base.yml`, `supabase db push`) — ou à la main dans le SQL Editor.

Le compte admin ne passe jamais par une migration : `cd web && npm run admin:sql` (valeurs de `web/.env`).
Le jeton du robot non plus : `cd web && npm run sante:sql`.

Mise en ligne pas à pas : guide PDF de [`../DEPLOIEMENT_ET_SUPERVISION/`](../DEPLOIEMENT_ET_SUPERVISION/) (chapitre 8) ; sauvegarde : `npm run sauvegarde` puis `npm run sauvegarde:tester` dans `web/` (chapitre 14).
