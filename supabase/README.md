# Base de données Supabase

- `migrations/` : le schéma, dans l'ordre. Chaque fichier peut être rejoué sans danger (`if not exists`, `create or replace`).
  - `20261102120000_schema.sql` : comptes, profils, adresses, panier, favoris, commandes (`passer_commande`).
  - `20261105120000_favoris.sql` : favoris (déjà dans le schéma ; gardé pour les bases créées avant).
  - `20261107120000_administration.sql` : administration (catalogue, réglages, journal, photos, `passer_commande` v2).
  - `20261107180000_cle_admin.sql` : clé de sécurité de l'administration.
- `seed.sql` : base locale seulement, sans données.
- `config.toml` : Supabase local (`npx supabase start`).

Nouvelle évolution : `npx supabase migration new <nom>` puis écrire le SQL. En ligne, la CI l'applique
(`.github/workflows/base.yml`, `supabase db push`) — ou à la main dans le SQL Editor.

Le compte admin ne passe jamais par une migration : `cd web && npm run admin:sql` (valeurs de `web/.env`).
