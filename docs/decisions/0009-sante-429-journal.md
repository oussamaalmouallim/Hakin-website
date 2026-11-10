# 0009 — Point de santé public, réponses 429, journal unifié, sauvegardes testées par script
- Date : 2026-11-10
- Contexte : avant l'ouverture au public, le développeur (seul responsable) veut être alerté en minutes si l'API tombe,
  distinguer un service lent d'un service en panne, consulter les incidents au même endroit, recevoir de vraies réponses
  HTTP quand une limite est atteinte, et prouver que ses sauvegardes se restaurent. Le site n'a toujours pas de serveur à
  nous (ADR 0007) ; la supervision existante (ADR 0008) ne passait que toutes les 30 min et ne gardait pas d'historique
  des déploiements ni des événements de sécurité.
- Décisions (validées par l'utilisateur, « go, recos ») :
  - **Point de santé public** `GET /rest/v1/rpc/sante` (fonction SQL stable, lit une table, ne renvoie aucune donnée de
    la boutique ; paramètre `apikey` accepté et ignoré pour les services qui passent la clé dans l'adresse). Interrogé par
    un **service externe gratuit** (UptimeRobot ou Better Stack, toutes les 3 à 5 min) que l'utilisateur crée lui-même.
    Le robot GitHub reste le contrôle complet (30 min, décalé à :07 et :37).
  - **HTTP 429 + Retry-After** par `set_config('response.status')` dans `passer_limite`, **sans lever d'erreur** :
    une erreur annulerait la trace du blocage. Le site traite le 429 de `passer_commande` comme avant le `null`.
  - **États calculés par la base** (`etat_supervision`) : inconnu (aucun contrôle depuis 75 min), indisponible (dernier
    échec), dégradé (au-dessus du seuil de lenteur, ou un échec dans les 6 h), opérationnel. Jamais de vert par défaut.
  - **Journal unifié** (`journal_technique`) au lieu d'une page par source ; nouvelles tables `evenements_techniques`
    (clé admin erronée et blocage par déclencheur, déploiements, sauvegardes par script) et `deploiements`.
  - **Une seule page Supervision à 5 onglets** (`?onglet=`) plutôt que 5 pages.
  - **Sauvegardes par la CLI Supabase** (`npm run sauvegarde`) et **restauration testée** dans un Supabase jetable
    (`npm run sauvegarde:tester`, ports 553xx), avec manifeste SHA-256 et comptes de lignes. Les scripts notent le
    résultat en base avec le jeton du robot.
  - **Hébergement inchangé** : Netlify Free + Supabase Free au lancement, Supabase Pro dès les ventes régulières,
    Cloudflare Pages en plan B (étude : `DEPLOIEMENT_ET_SUPERVISION/ETUDE_HEBERGEMENT.md`).
  - **Guide PDF** généré depuis HTML par Paged.js + Chromium (Playwright déjà présent), plutôt que WeasyPrint (Pango non
    installé) : sommaire paginé, en-têtes et pieds courants, charte du site. `GUIDE_HEBERGEMENT.md` archivé.
- Conséquences :
  - Migration `20261110120000_sante_et_journal.sql` à pousser en ligne (après `npm run sauvegarde`).
  - Le nombre total de requêtes à l'API reste lisible seulement dans le tableau de bord Supabase (clé secrète exigée).
  - Le point de santé est public : il ne doit jamais renvoyer de donnée ; toute évolution garde cette règle.
  - Nouvelle dépendance de développement : `pagedjs` (rendu du PDF seulement, jamais dans le site).
  - Les sauvegardes contiennent des données de clients : elles restent hors du dépôt public (`~/Documents/HMODE-sauvegardes/`, droits 700).
