# 0007 — Un seul site statique + Supabase ; dépôt rangé par rôle ; CI/CD GitHub Actions
- Date : 2026-11-07
- Contexte : le site doit être hébergé, avec une gestion de contenu (CMS) par un admin. Question posée : faut-il un
  hébergement à part pour l'admin, ou des microservices ? Le dépôt mélangeait l'application, l'ancien site, des outils
  internes lourds (151 Mo) et la documentation ; aucune CI ; la base se mettait à jour en collant des fichiers à la main.
- Décision :
  - Architecture « site statique + backend hébergé » : `web/` (site, boutique et `/admin` dans la même application,
    l'admin chargé à la demande) servi par Netlify ou par l'image Docker ; Supabase = base, comptes, photos et droits.
    Pas de serveur à nous, pas de microservice, pas d'hébergement séparé pour l'admin : les droits sont vérifiés par la
    base (RLS, `est_admin()`, clé), pas par l'hébergeur.
  - Dépôt rangé par rôle : `web/` (application ; la charte CloneMe à côté de son code), `supabase/migrations/`
    (migrations datées et rejouables), `infra/` (Docker, nginx), `.github/workflows/`, `docs/` (decisions, design,
    projet), `archive/` (ancien site, legacy). `Scrapping/` sort de git (reste sur le disque).
  - CI/CD : `ci.yml` (types, tests, build, Playwright, image de contrôle) à chaque push et pull request ;
    `supabase.yml` (Supabase local dans la CI, vrais comptes) sur `main` ; `image.yml` publie l'image sur ghcr.io ;
    `base.yml` applique les migrations en ligne, à la main seulement (essai à blanc par défaut, environnement
    « production »). Le compte admin n'est jamais créé par la CI.
  - Normes d'un site vitrine : CSP stricte et en-têtes de sécurité (identiques Netlify et nginx), vrai statut 404,
    `sitemap.xml` au build (`SITE_URL`), `/admin` en `noindex`, cache long des fichiers à empreinte, image nginx sans root
    avec contrôle de santé.
- Conséquences :
  - Un seul déploiement à faire ; l'admin suit chaque version du site.
  - Toute nouvelle route doit être déclarée dans `web/public/_redirects` et `infra/docker/nginx.conf` (test `routes.test.ts`).
  - Tout nouveau domaine externe (police, analytics, vidéo) doit être ajouté à la CSP des deux hébergements.
  - Séparer l'admin plus tard (`admin.` + 2ᵉ site Netlify du même code) reste possible sans réécrire.
  - `Scrapping/` et `archive/legacy/` restent dans l'historique git déjà poussé (le réécrire n'a pas été fait).
