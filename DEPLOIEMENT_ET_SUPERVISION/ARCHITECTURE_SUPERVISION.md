# Architecture de la supervision de H MODE

Complément technique du guide PDF (chapitres 10 à 14). Décrit ce qui est **en place et testé**, et ce qui reste **à
configurer après l'hébergement**. Décision : [`docs/decisions/0009-sante-429-journal.md`](../docs/decisions/0009-sante-429-journal.md) (suite de l'ADR 0008).

## 1. Principe

H MODE n'a **pas de serveur à nous**. Le site est un ensemble de fichiers servis par Netlify ; le backend est Supabase
(API REST PostgREST, Auth, Storage, PostgreSQL). La supervision suit donc trois règles :

1. **Mesurer de l'extérieur** ce que voit un client (site, API, comptes, photos, WhatsApp) : robot GitHub et service externe.
2. **Écrire les mesures dans la base**, protégées par la RLS et lisibles par le seul rôle `technique`.
3. **Ne jamais afficher vert sans contrôle récent** : sans contrôle depuis 75 min, l'état est « inconnu ».

```
 Service externe (UptimeRobot / Better Stack, 3-5 min) ──GET──▶ /rest/v1/rpc/sante ─┐      e-mail si panne
 Robot GitHub Actions (toutes les 30 min, :07 et :37)  ──────▶ site + API + Auth +  │      e-mail GitHub si échec
                                                               photos + WhatsApp     │
                                     └── enregistrer_controles(jeton) ──────────────▶│ Supabase
 Navigateurs des visiteurs ── signaler_erreur / compter_visite (limités, 429) ──────▶│  controles_sante, erreurs_site,
 Admin technique ── Contrôler maintenant ── noter_controles ────────────────────────▶│  visites, limites_evenements,
 Scripts de sauvegarde ── noter_sauvegarde_script(jeton) ──────────────────────────▶│  evenements_techniques,
                                                                                     │  deploiements, sauvegardes
 Admin → Technique → Supervision ◀── etat_supervision(), journal_technique() ───────┘  (lecture : rôle technique)
```

## 2. État d'avancement

| Élément | État | Preuve |
|---|---|---|
| Point de santé `GET /rest/v1/rpc/sante` | **en ligne** depuis le 10/11 (200, `ok: true`) | `npm run test:supabase` : 200, aucune donnée de la boutique |
| Réponse **HTTP 429** + `Retry-After` quand une limite est atteinte | **en ligne** depuis le 10/11 (testée en local), message clair côté site | test SQL : 204 puis 429, `Retry-After: 600`, blocage noté ; test unitaire de la page commande |
| États opérationnel / dégradé / indisponible / inconnu | **en place** | test SQL des cinq cas ; test d'écran : rien de vert sans contrôle |
| Journal technique filtrable (période, type, gravité) | **en place** | test SQL + test d'écran |
| Événements de sécurité (clé admin erronée, accès bloqué) | **en place** | test SQL : visibles dans le journal |
| Déploiements vus (version + date de build) | **en place** | test SQL : une seule ligne par version |
| Alerte de lenteur (3 passages lents de suite) | **en place** | test SQL |
| Rappel quotidien sauvegarde / restauration | **en place** (passage du robot de 9 h, heure du Maroc) | code relu ; déclenché seulement à cette heure |
| Sauvegarde par script `npm run sauvegarde` | **testée** sur la base en ligne le 10/11 (134 Ko, 62 produits) | dossier `~/Documents/HMODE-sauvegardes/2026-11-10_19h17` |
| Restauration testée `npm run sauvegarde:tester` | **testée** : 26 tables identiques, 62 pièces lues à travers la RLS | sortie du script ; refus d'une copie modifiée vérifié |
| Panne de la base | **testée en local** : robot en échec (code 1), point de santé sans réponse ; retour à la normale vu aussitôt | conteneur de base figé puis relancé |
| Robot GitHub en ligne | **à configurer** : variables et secret `SANTE_JETON` | guide, chapitre 10 |
| Service externe (alerte en minutes) | **à créer** par vous | guide, chapitre 11 |
| Migration `20261110120000_sante_et_journal.sql` en ligne | **appliquée le 10/11**, après sauvegarde | `npx supabase migration list` |

## 3. Contrôles et seuils

| Contrôle (`cible`) | Requête | Réussi si | Seuil « lent » |
|---|---|---|---|
| `site : accueil` | `GET /` | 200 et `id="racine"` dans la page | 3 000 ms |
| `site : boutique` | `GET /boutique` | 200 | 3 000 ms |
| `site : version` | `GET /version.json` | JSON avec `version` (notée comme déploiement) | 3 000 ms |
| `site : vrai 404` | `GET /adresse-inexistante-robot` | **404** (en production seulement ; le serveur de dev renvoie 200) | 3 000 ms |
| `base : santé (GET)` | `GET /rest/v1/rpc/sante` | 200 et `ok: true` | 2 000 ms |
| `base : API et données` | `GET /rest/v1/reglages?limit=1` | 200 | 2 000 ms |
| `base : comptes (Auth)` | `GET /auth/v1/health` | 200 (attention : répond même base arrêtée, vu en test) | 2 000 ms |
| `stockage : photos` | `HEAD` d'une photo du catalogue | 200 (sinon « non vérifié ») | 3 000 ms |
| `WhatsApp (wa.me)` | `HEAD https://wa.me/` | statut < 500 | 5 000 ms |

**Règles d'état** (fonction `etat_supervision`) :
- **inconnu** : dernier contrôle il y a plus de 75 min ;
- **indisponible** : le dernier contrôle a échoué ;
- **dégradé** : le dernier contrôle dépasse le seuil, ou au moins un échec dans les 6 dernières heures ;
- **opérationnel** : sinon. Une partie (site, API, Auth, photos, WhatsApp) prend le **pire** état de ses contrôles.

## 4. Limitation des requêtes

Toute écriture publique passe par `passer_limite(action)` : empreinte du visiteur (SHA-256 salé de la première adresse
de `X-Forwarded-For`, jamais l'adresse en clair) **et** plafond global (l'en-tête est falsifiable).

| Action | Par visiteur | Tous visiteurs | Pourquoi |
|---|---|---|---|
| `commande` | 5 / 60 min | 100 / 60 min | un client passe une ou deux commandes ; le plafond arrête un envoi en masse |
| `erreur_client` | 30 / 10 min | 2 000 / 10 min | une page qui plante en boucle ne remplit pas la base |
| `demande_whatsapp` | 30 / 10 min | 3 000 / 10 min | quelques conversations par visiteur |
| `visite` | 120 / 10 min | 50 000 / 10 min | au-delà de quelques pages par minute, c'est un robot |
| `controle_robot` | 20 / 10 min | 60 / 10 min | robot, admin et scripts de sauvegarde |
| clé admin (`deverrouiller_admin`) | 5 erreurs → 15 min de blocage | — | force brute sur la clé |
| comptes (Supabase Auth) | limites de Supabase | — | réglables : Authentication → Rate Limits |

Au-delà : **HTTP 429** + `Retry-After` (secondes), **sans erreur SQL** (`set_config('response.status', '429')`) :
le blocage reste écrit dans `limites_evenements`. Le site affiche « Trop de commandes envoyées depuis cet appareil… ».
Modifier une limite : `update public.limites set maximum = … where action = '…';` dans le SQL Editor.

**Ce que la limitation ne fait pas** : elle ne garantit pas la disponibilité. Contre une surcharge réelle, ce sont le
CDN de Netlify (fichiers), l'infrastructure de Supabase, les délais d'expiration côté site (le robot coupe à 15 s) et la
surveillance qui protègent. Une attaque massive se traite chez Supabase (support) et par le plafond global.

## 5. Journal technique

`journal_technique(p_heures, p_categorie, p_gravite)` rassemble, 300 lignes au plus :

| Type | Source | Gravité |
|---|---|---|
| `site` | `erreurs_site` (script, promesse, rendu, chargement) | erreur / avertissement |
| `api` | `erreurs_site` de type `api` | erreur / avertissement |
| `sante` | `controles_sante` en échec ou lents | **critique** (base en échec), erreur, avertissement (lent) |
| `securite` | requêtes bloquées ; clé admin erronée ; accès bloqué | avertissement ; **critique** pour un blocage |
| `deploiement` | nouvelle version vue | info |
| `sauvegarde` | sauvegarde, restauration testée, échec | info / erreur |

Nettoyage avant écriture (`nettoyer_texte`) : e-mails, numéros, jetons longs et paramètres d'adresse retirés.
Rétention : 30 jours (contrôles, erreurs, visites, blocages), 90 jours (événements techniques).

## 6. Alertes

| Situation | Qui alerte | Délai | Coût |
|---|---|---|---|
| Site ou API ne répond plus | service externe sur `/` et `/rest/v1/rpc/sante` | 3 à 5 min | gratuit (conditions à vérifier) |
| Base inaccessible, comptes, photos, WhatsApp | robot GitHub → e-mail | ≤ 30 min (retards possibles de GitHub) | gratuit |
| Lenteur répétée (3 × au-dessus du seuil) | robot | ≤ 1 h 30 | gratuit |
| Erreurs en rafale (≥ 50 en 30 min), blocages (≥ 10 en 30 min) | robot | ≤ 30 min | gratuit |
| Accès admin bloqué après 5 clés erronées | robot | ≤ 30 min | gratuit |
| Sauvegarde > 8 jours, restauration non testée > 35 jours | robot, passage de 9 h | 1 fois par jour | gratuit |
| Quotas Netlify / Supabase, mise en pause | e-mails des fournisseurs | selon eux | gratuit |

Réglage indispensable : github.com → Settings → Notifications → Actions → **Only notify for failed workflows**.
GitHub suspend les tâches planifiées d'un dépôt public après **60 jours sans commit** : relancez « Surveillance » à la main.

## 7. Sauvegardes

| | |
|---|---|
| Fréquence | **chaque semaine** sur Free (et avant chaque `db push`) ; sur Pro, Supabase en fait une par jour (7 jours) **en plus** |
| Contenu | `roles.sql`, `schema.sql`, `donnees.sql` (format COPY), `photos/` (bucket `produits`), `manifeste.json` (SHA-256 et lignes par table) |
| Emplacement | `~/Documents/HMODE-sauvegardes/<date>/`, droits 700, **hors du dépôt public** ; copie sur un second support (disque externe ou cloud chiffré) |
| Conservation | 8 dernières semaines + 1 par mois sur 12 mois (rotation à la main) |
| Validité | `npm run sauvegarde:tester` : empreintes, restauration complète dans un Supabase jetable (ports 553xx), mêmes lignes par table, lecture à travers la RLS |
| Restauration réelle | guide, chapitre 14 : d'abord dans un projet de test, puis seulement en cas de perte réelle |
| Test périodique | **une fois par mois** (le robot le rappelle après 35 jours) |

## 8. Écrans (Admin → Supervision)

Cinq pages indépendantes dans la barre latérale (ADR 0010) : **Vue d'ensemble** `/admin/supervision` (état par partie,
8 indicateurs, graphiques performance 48 h et activité 30 j, limites 24 h, derniers incidents, fréquentation),
**Santé et disponibilité** `/sante` (contrôles : disponibilité 24 h / 7 j, moyenne, p95, seuil ; historique filtrable ;
« Contrôler maintenant » ; qui alerte), **Journaux et incidents** `/journaux` (filtres période, type, gravité, recherche,
détail d'un événement), **Sécurité et API** `/securite` (endpoints `POST /rpc/…` limités, acceptés et bloqués, activité
anormale, événements de sécurité, protections), **Maintenance et sauvegardes** `/maintenance` (tâches à jour ou non,
version, déploiements, republications, historique des sauvegardes, liens). Les anciennes adresses `?onglet=` y renvoient.

Ce qui n'est **pas** affiché, faute de mesure possible sans clé secrète : nombre total de requêtes à l'API, journaux
internes de Supabase. La page Maintenance renvoie vers leurs tableaux de bord.
