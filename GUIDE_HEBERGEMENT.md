# Guide d'hébergement et de suivi de H MODE

Pour mettre le site en ligne, le surveiller et le maintenir, seul. Écrit pour un développeur qui le fait pour la
première fois.

**Comment lire ce guide.** Chaque mot technique est expliqué la première fois qu'il apparaît, en **gras** suivi de sa
définition. Les étapes sont numérotées : suivez-les dans l'ordre. Les prix et limites des services changent souvent :
ils sont donnés avec leur source et la date de lecture (08/11/2026). Vérifiez-les sur la page officielle avant de payer.

Documents liés : [`README.md`](README.md) (commandes), [`docs/architecture.md`](docs/architecture.md) (le code en
détail), [`marketing/INDEX.md`](marketing/INDEX.md) (réseaux sociaux).

---

## A. Préparer la mise en production

### A.1 L'architecture, vue d'ensemble

H MODE est fait de **deux pièces seulement**, plus quelques services autour.

- **Site statique** : des fichiers (HTML, JavaScript, CSS, images) produits une fois par la commande `npm run build`
  dans `web/dist/`, puis envoyés tels quels au navigateur. Il n'y a aucun programme à nous qui tourne sur un serveur.
- **Hébergeur** : le service qui stocke ces fichiers et les envoie aux visiteurs. Ici **Netlify** (recommandé) ou une
  **image Docker** (un paquet qui contient nginx et les fichiers du site, prêt à tourner sur n'importe quel serveur).
- **Supabase** : le **backend**, c'est-à-dire la partie qui garde les données et vérifie les droits. Il fournit :
  - une **base de données PostgreSQL** (les tables : produits, commandes, comptes, réglages…) ;
  - **Auth**, le service de comptes (inscription, connexion, e-mails de confirmation) ;
  - **Storage**, le stockage des photos téléversées depuis l'admin ;
  - une **API REST** : une adresse web par table et par fonction, que le site appelle directement depuis le navigateur.
- **RLS** (*Row Level Security*, sécurité ligne par ligne) : des règles écrites **dans la base** qui décident, pour
  chaque ligne, qui peut la lire ou la modifier. C'est elle qui empêche un client de voir la commande d'un autre, même
  s'il connaît la clé publique.

```
  Visiteur / client            Admin (e-mail + mot de passe + clé)
         │                              │
         ▼                              ▼
  ┌───────────────────────────────────────────────┐
  │  Netlify : fichiers du site (web/dist)         │   ← le même site pour tous, /admin compris
  └───────────────┬───────────────────────────────┘
                  │ API REST + clé publique + session
                  ▼
  ┌───────────────────────────────────────────────┐
  │  Supabase : base PostgreSQL + RLS, Auth,       │
  │  Storage (photos), fonctions (commande, admin) │
  └───────────────────────────────────────────────┘
        ▲                         ▲
        │ toutes les 30 min       │ e-mails de compte
  GitHub Actions (robot)      Brevo (SMTP)          WhatsApp (wa.me) : message prêt, ouvert par le client
```

Les autres pièces :
- **GitHub Actions** : des tâches automatiques lancées par GitHub. Ici : vérifier chaque modification (CI), publier
  l'image Docker, appliquer les migrations sur demande, et le **robot de surveillance** toutes les 30 minutes.
- **CI** (*intégration continue*) : à chaque envoi de code, GitHub lance les types, les tests et le build. Si quelque
  chose casse, vous le voyez avant la mise en ligne.
- **Migration** : un fichier SQL daté (`supabase/migrations/`) qui fait évoluer la base. On les applique dans l'ordre ;
  la base garde la liste de celles déjà passées.
- **SMTP** : le protocole d'envoi d'e-mails. Supabase en a un intégré, mais très limité (voir A.5).

### A.2 Un échange réel : un client passe commande

1. Le navigateur charge le site depuis Netlify, puis lit le catalogue dans Supabase : `GET /rest/v1/produits?publie=eq.true`.
2. Le client remplit `/commande`. Le site appelle la fonction de la base `passer_commande` :
   ```
   POST https://<projet>.supabase.co/rest/v1/rpc/passer_commande
   apikey: <clé publique>
   { "commande": { "reference": "HM-…", "client": { "nom": "…", "ville": "Casablanca", … },
                   "lignes": [ { "slug": "hoodie-solo-fleece-nike", "coloris": "noir", "taille": "M", "quantite": 1 } ] } }
   ```
3. La base vérifie tout elle-même : la limite par visiteur, la ville livrée, la pièce publiée, son **prix lu en base**
   (celui du navigateur est ignoré), le coloris et la taille. Puis elle enregistre la commande en une seule fois.
4. Le site ouvre WhatsApp avec le message de commande. La commande apparaît dans l'admin, **Ventes → Commandes**.

À retenir : **le navigateur n'est jamais cru sur parole**. Tout ce qui compte (prix, droits, limites) est vérifié par la
base.

### A.3 Prérequis

| Il faut | Pourquoi | Où |
|---|---|---|
| Un compte **GitHub** avec le dépôt `Hakin-website` | le code, la CI, le robot | github.com |
| Un compte **Netlify** | héberger le site | netlify.com (connexion avec GitHub) |
| Le projet **Supabase** déjà créé | la base en ligne existe déjà (lots 16 à 21) | supabase.com/dashboard |
| Un compte **Brevo** (ou autre fournisseur SMTP) | e-mails de compte au-delà de la limite de Supabase | brevo.com |
| Un **nom de domaine** (ex. `hmode.ma`) | adresse propre ; facultatif au premier jour | un registrar agréé `.ma` (voir B.4) |
| Node 22 et Docker sur votre poste | build local, tests | déjà installés |

### A.4 Les variables d'environnement

Une **variable d'environnement** est une valeur donnée au programme au moment où il tourne ou se construit, au lieu
d'être écrite dans le code. On s'en sert pour les adresses et les clés.

Une règle de sécurité : toute variable qui commence par `VITE_` est **copiée dans le JavaScript du site**, donc
publique. N'y mettez jamais un secret.

| Variable | Publique ? | Où la définir | Rôle |
|---|---|---|---|
| `VITE_SUPABASE_URL` | oui | `web/.env`, Netlify, GitHub (variable) | adresse du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | oui (clé publique) | idem | clé publique ; les droits restent vérifiés par la RLS |
| `SITE_URL` | oui | Netlify, GitHub (variable) | adresse finale du site : `sitemap.xml`, aperçus de partage |
| `ADMIN_EMAIL`, `ADMIN_MOT_DE_PASSE`, `ADMIN_CLE` | **secret** | `web/.env` seulement | compte admin, via `npm run admin:sql` |
| `ADMIN_ROLE` | — | ligne de commande, facultatif | `technique` (vous) ou `commerce` (ex. votre frère) |
| `SANTE_JETON` | **secret** | `web/.env` + GitHub (secret) | jeton du robot de surveillance |
| `SUPABASE_PROJECT_REF` | non sensible | GitHub (variable) | identifiant du projet, visible dans son adresse |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` | **secret** | GitHub (secret) | appliquer les migrations depuis GitHub |
| `NETLIFY_BUILD_HOOK` | **secret** | GitHub (secret), facultatif | relancer un build quand le catalogue change |

`web/.env` n'est jamais envoyé dans git (le dépôt est **public**). La clé `service_role` de Supabase (clé qui ignore la
RLS) ne sert nulle part dans ce projet : ne la copiez jamais.

### A.5 Configuration du frontend et du « backend »

- **Frontend** (le site) : rien à modifier dans le code. `netlify.toml` dit à Netlify de construire `web/` et ajoute les
  en-têtes de sécurité ; `web/public/_redirects` dit quelles adresses existent (les autres renvoient une vraie erreur
  **404**, « page introuvable »).
- **Backend** (Supabase), à régler dans le tableau de bord du projet :
  - **Authentication → URL Configuration** : *Site URL* = l'adresse du site ; *Redirect URLs* = `https://<adresse>/**`.
    Sans cela, le lien de confirmation d'un e-mail renvoie vers la mauvaise adresse.
  - **Authentication → SMTP Settings** : brancher Brevo. Sans SMTP à vous, Supabase n'envoie que **2 à 3 e-mails par
    heure** et seulement aux membres de l'équipe du projet ; avec un SMTP à vous, la limite de départ est de 30 par
    heure, réglable ([doc Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
    [limites](https://supabase.com/docs/guides/auth/rate-limits), [guide Brevo](https://developers.brevo.com/docs/supabase-smtp-integration)).
    **Sans cette étape, vos clients ne peuvent pas confirmer leur inscription.** La commande sans compte, elle,
    marche sans e-mail.

### A.6 La base de données

La base en ligne a été créée à la main (fichiers SQL collés en novembre). Elle correspond aux **4 premières
migrations**. Il en reste **4 nouvelles** à appliquer :

| Migration | Ce qu'elle ajoute |
|---|---|
| `20261108120000_limites_commandes.sql` | limite des commandes par visiteur et plafond global, commande v3 (pièce, coloris, taille, ville vérifiés) |
| `20261108130000_supervision.sql` | rôles technique / commerce, contrôles de santé, erreurs du site, fréquentation, sauvegardes notées |
| `20261108140000_demandes_whatsapp.sql` | demandes WhatsApp, distinctes des commandes |
| `20261108150000_republication.sql` | relance automatique du build quand le catalogue change |

Votre compte admin actuel reçoit automatiquement le rôle `technique` (valeur par défaut) : inutile de relancer
`admin:sql`. Les étapes exactes sont en C.2.

### A.7 Sécurité en place

| Protection | Où | Ce qu'elle bloque |
|---|---|---|
| RLS sur chaque table | base | lecture ou écriture des données d'un autre |
| Admin à trois facteurs (e-mail, mot de passe, clé) + blocage 15 min après 5 erreurs | base | accès à l'admin |
| Rôles `technique` / `commerce` | base | la supervision réservée au développeur |
| Prix, pièce, taille, ville vérifiés en base | `passer_commande` | commande truquée |
| **Limitation des requêtes** (*rate limiting* : compter les appels et refuser au-delà d'un seuil) par visiteur + plafond global | base | fausses commandes en masse, spam d'erreurs |
| **CSP** (*Content Security Policy* : liste des sources que le navigateur a le droit de charger) | `netlify.toml`, `infra/docker/securite.conf` | script injecté, site externe inconnu |
| **HTTPS** (connexion chiffrée) + **HSTS** (le navigateur refuse ensuite le HTTP simple) | Netlify | lecture du trafic |
| `/admin` non indexé | en-tête `X-Robots-Tag`, `robots.txt` | l'admin dans Google |

### A.8 Vérifications avant la mise en production

Dans `web/` :

```bash
npm run lint && npm test && SITE_URL=https://exemple.invalid npm run build
```
- `lint` : vérifie les types TypeScript.
- `test` : 85 tests unitaires et d'intégration (sans la vraie base).
- `build` : construit le site, le `sitemap.xml` et les aperçus de partage.

Puis les tests avec une vraie base, **locale** (jamais la base en ligne) :

```bash
cd .. && npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,realtime,postgres-meta,supavisor
```
```bash
cd web && npm run test:supabase && npm run test:e2e && npm run test:e2e:admin
```
```bash
cd .. && npx supabase stop
```

---

## B. Choisir l'hébergement

### B.1 Ce dont H MODE a besoin

- Servir des fichiers statiques vite, en HTTPS, avec des en-têtes de sécurité et des réécritures d'adresse.
- Peu de trafic au départ (une boutique locale).
- Un coût proche de zéro tant qu'il n'y a pas de ventes.
- Aucun serveur à maintenir soi-même.

### B.2 Les solutions comparées

| Solution | Ce qu'elle fait | Avantages | Limites | Coût de départ |
|---|---|---|---|---|
| **Netlify** (recommandé) | hébergement de site statique relié à GitHub | **déjà configuré** (`netlify.toml`, `_redirects`) ; HTTPS automatique ; aperçu pour chaque pull request ; retour arrière en un clic | l'offre gratuite est un quota de **crédits** : au-delà, le site est **mis en pause** jusqu'au mois suivant | gratuit (300 crédits/mois) ; Personal 9 $/mois (1 000 crédits) ; Pro 20 $/mois ([Netlify](https://www.netlify.com/pricing/), résumés : [Flexprice](https://flexprice.io/blog/complete-guide-to-netlify-pricing-and-plans), [Costbench](https://costbench.com/software/cloud-infrastructure/netlify/)) |
| **Cloudflare Pages** | idem, sur le réseau Cloudflare | requêtes vers les fichiers statiques illimitées sur l'offre gratuite selon les guides | à configurer : il faudrait un fichier `_headers` pour la CSP, et retester les règles | gratuit ([limites officielles](https://developers.cloudflare.com/pages/platform/limits/), [guide](https://temps.sh/blog/cloudflare-pages-free-tier-limits-2026)) |
| **Serveur virtuel + Docker** | louer une petite machine et y lancer l'image Docker du projet | contrôle total ; l'image est prête (`infra/docker/`) | vous gérez tout : mises à jour du système, HTTPS, pannes, sauvegardes de la machine | payant chaque mois (prix selon le fournisseur) |
| Vercel | hébergement de sites | rapide | l'offre gratuite « Hobby » est réservée à un usage non commercial (à vérifier sur leurs conditions) ; non configuré | — |

Pour la base, **Supabase** est déjà en place :

| Offre | Ce qu'elle inclut | La limite qui compte pour vous | Prix |
|---|---|---|---|
| **Free** | 500 Mo de base par projet, 50 000 utilisateurs actifs/mois | le projet est **mis en pause après une semaine d'inactivité** ; pas de sauvegarde restaurable | 0 $ ([Supabase](https://supabase.com/pricing)) |
| **Pro** | 8 Go de disque, 100 000 utilisateurs actifs, pas de pause ; sauvegardes quotidiennes selon les guides (à vérifier sur la page officielle) | — | à partir de 25 $/mois ([Supabase](https://supabase.com/pricing), [UI Bakery](https://uibakery.io/blog/supabase-pricing)) |

### B.3 Combien de visites tient l'offre gratuite de Netlify ?

Selon les guides 2026 : un déploiement coûte **15 crédits**, 1 Go de trafic **20 crédits**, 10 000 requêtes **2 crédits**
([Flexprice](https://flexprice.io/blog/complete-guide-to-netlify-pricing-and-plans)).

Mesuré sur le build actuel : la première visite d'une page télécharge de l'ordre de **0,6 à 1 Mo** (JavaScript et CSS
compressés, polices, image du héros, vignettes). Estimation, à confirmer avec l'onglet Réseau du navigateur une fois
en ligne :
- 8 déploiements par mois = 120 crédits ;
- il reste 180 crédits = 9 Go, soit **environ 9 000 à 15 000 premières visites** par mois.

C'est largement assez pour démarrer. Surveillez **Netlify → Usage** chaque semaine ; si la jauge dépasse 70 % avant
la fin du mois, passez à l'offre Personal **avant** la mise en pause.

### B.4 Le nom de domaine

Un **nom de domaine** est l'adresse lisible du site (`hmode.ma`). Le **DNS** (*Domain Name System*) est l'annuaire qui
traduit cette adresse en serveur ; on le règle chez le **registrar** (la société qui vous loue le domaine).

Un `.ma` se loue chez un registrar agréé ; les guides marocains donnent environ **100 à 200 DH HT par an**, avec un prix
de renouvellement parfois plus élevé que la première année
([HébergeurMarocain](https://www.hebergeurmarocain.com/blog/prix-officiel-nom-domaine-ma-maroc/),
[Heberfacile](https://www.heberfacile.com/nom-de-domaine/domaine-ma/)). Vérifiez que le registrar figure sur la liste
officielle de l'ANRT (registre.ma) et lisez le **prix de renouvellement**, pas seulement celui de la première année.

### B.5 Recommandation pour H MODE

| Phase | Hébergement | Base | Coût mensuel |
|---|---|---|---|
| **Lancement** (premières semaines) | Netlify Free | Supabase Free | 0 $ + le domaine (environ 10 à 17 DH par mois, lissé sur l'année) |
| **Dès les premières ventes régulières** | Netlify Free (ou Personal si les crédits passent 70 %) | **Supabase Pro** : plus de mise en pause, sauvegardes | 25 $ (+ 9 $ si Netlify Personal) |

Pourquoi passer Supabase en Pro tôt : une boutique dont la base se met en pause, ou dont on ne peut pas restaurer les
commandes, perd des ventes. C'est la première dépense utile, avant la publicité.

---

## C. Mise en production, étape par étape

Comptez une demi-journée. Cochez au fur et à mesure.

### C.1 Préparer les services

1. **Pousser le code** : vos derniers commits sur `main` (vous les faites vous-même).
2. **Désactiver GitHub Pages** : le dépôt sert encore l'ancien site sur `oussamaalmouallim.github.io/Hakin-website`.
   GitHub → dépôt → **Settings → Pages** → *Unpublish site* (ou *Source : None*). Sinon une deuxième « boutique »
   périmée reste en ligne.
3. **Vérifier la CI** : GitHub → **Actions** → le workflow « CI » du dernier commit doit être vert. S'il est rouge,
   ouvrez-le, lisez l'étape en échec, corrigez avant de continuer.

### C.2 Configurer la base de production

1. Ouvrez le projet dans Supabase et notez son identifiant (*project ref*) : la partie `xxxx` de
   `https://supabase.com/dashboard/project/xxxx`.
2. Sur votre poste, à la racine du dépôt :
   ```bash
   npx supabase link --project-ref <ref>
   ```
   `link` relie le dossier `supabase/` à votre projet en ligne. Le mot de passe de la base est demandé (Supabase →
   Project Settings → Database).
3. Indiquez que les 4 premières migrations sont **déjà** appliquées (elles ont été collées à la main) :
   ```bash
   npx supabase migration repair --status applied 20261102120000 20261105120000 20261107120000 20261107180000
   ```
   `migration repair` n'exécute rien : il écrit seulement dans l'historique de la base que ces fichiers sont passés.
4. Regardez ce qui reste à appliquer, sans rien changer :
   ```bash
   npx supabase db push --dry-run
   ```
   La liste doit montrer exactement les 4 migrations du 08/11 (A.6). Rien d'autre.
5. Appliquez-les :
   ```bash
   npx supabase db push
   ```
   Ou depuis GitHub : **Actions → Base de données → Run workflow**, case « essai à blanc » cochée d'abord, puis
   décochée (il faut avoir rempli les secrets de C.3).
6. Vérifiez dans **SQL Editor** :
   ```sql
   select version from supabase_migrations.schema_migrations order by 1;
   select action, maximum, maximum_global from public.limites order by 1;
   ```
   8 versions, et 5 limites (commande, controle_robot, demande_whatsapp, erreur_client, visite).

### C.3 Configurer les variables

**Netlify** (Site configuration → Environment variables) :
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL` (l'adresse finale, ex. `https://hmode.ma` ; au premier
jour, l'adresse `https://<nom>.netlify.app`).

**GitHub** (dépôt → Settings → Secrets and variables → Actions) :

| Onglet | Nom | Valeur |
|---|---|---|
| Variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL` | les mêmes que Netlify |
| Variables | `SUPABASE_PROJECT_REF` | l'identifiant du projet |
| Secrets | `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access tokens → créer |
| Secrets | `SUPABASE_DB_PASSWORD` | mot de passe de la base |
| Secrets | `SANTE_JETON` | voir C.8 |
| Secrets | `NETLIFY_BUILD_HOOK` | facultatif, voir C.8 |

**GitHub → Settings → Environments → production** : ajoutez-vous comme *required reviewer*. Ainsi, le workflow
« Base de données » attend votre accord avant de toucher à la base en ligne.

### C.4 Déployer le frontend

1. Netlify → **Add new site → Import an existing project → GitHub** → choisir `Hakin-website`.
2. Netlify lit `netlify.toml` : dossier `web`, commande `npm run build`, publication de `dist`. Ne changez rien.
3. **Deploy**. Le build dure une à deux minutes. Ouvrez l'adresse `https://<nom>.netlify.app`.
4. Le journal du build doit contenir `sitemap : … adresses` et `partage : 62 fiches (catalogue : base)`.

### C.5 « Déployer le backend »

Il n'y a **rien à déployer** côté serveur : Supabase est déjà en ligne et la base vient d'être mise à jour (C.2). Il
reste les réglages de A.5 :
1. **Authentication → URL Configuration** : Site URL et Redirect URLs (avec l'adresse Netlify, puis le domaine).
2. **Authentication → SMTP Settings** : identifiants SMTP de Brevo (Brevo → SMTP & API), expéditeur
   `noreply@<votre-domaine>` quand le domaine sera branché.
3. **Authentication → Rate Limits** : vérifiez la limite d'e-mails par heure après le branchement du SMTP.

### C.6 Connecter le domaine

1. Netlify → **Domain management → Add a domain** → `hmode.ma` (et `www.hmode.ma`).
2. Netlify affiche les **enregistrements DNS** à créer. Un **enregistrement DNS** est une ligne de l'annuaire : par
   exemple un `A` (domaine → adresse IP) ou un `CNAME` (sous-domaine → autre nom). Recopiez **exactement** les valeurs
   données par Netlify chez votre registrar.
3. Attendez la **propagation** (le temps que l'annuaire se mette à jour partout) : de quelques minutes à 48 h.
4. Changez `SITE_URL` (Netlify et GitHub) pour l'adresse finale, puis relancez un déploiement (Deploys → Trigger deploy).
5. Mettez à jour Site URL et Redirect URLs dans Supabase (C.5).

### C.7 HTTPS et certificat

Un **certificat TLS** (souvent appelé SSL) prouve au navigateur que le site est bien le vôtre et permet le chiffrement.
Netlify en crée un automatiquement (Let's Encrypt) une fois le DNS correct : **Domain management → HTTPS** doit afficher
le certificat actif. Activez *Force HTTPS* s'il est proposé. L'en-tête HSTS est déjà dans `netlify.toml`.

### C.8 Le robot de surveillance

1. Générez un jeton : `openssl rand -hex 24`. Ajoutez la ligne `SANTE_JETON=<le jeton>` dans `web/.env`.
2. Dans `web/` : `npm run sante:sql`. Collez le SQL affiché dans le **SQL Editor** de Supabase (seule l'empreinte du
   jeton part en base).
3. Ajoutez le **même** jeton dans GitHub, secret `SANTE_JETON`.
4. GitHub → **Actions → Surveillance → Run workflow**. Le résultat doit être vert, puis visible dans l'admin
   (**Technique → Supervision**, « Dernier passage du robot »).
5. Facultatif : Netlify → **Site configuration → Build & deploy → Build hooks** → créer un hook, copier l'adresse dans
   le secret GitHub `NETLIFY_BUILD_HOOK`. Le robot relancera un build (au plus une fois toutes les 12 h) quand une pièce
   change dans l'admin, pour mettre à jour les aperçus de partage.
6. Recevoir les alertes : github.com → **Settings → Notifications → Actions** : *Only notify for failed workflows*
   (e-mail). Un échec du robot = une alerte.

### C.9 Vérifier les routes et les API

| Adresse | Attendu |
|---|---|
| `/`, `/boutique`, `/produit/<une-pièce>` | la page s'affiche |
| `/adresse-qui-n-existe-pas` | la page 404 du site |
| `/version.json` | `{"version":"…","construit_le":"…"}` |
| `/sitemap.xml`, `/robots.txt` | présents ; `robots.txt` interdit `/admin` |
| `/produit/<une-pièce>` vue par un robot | titre et image de la pièce : testez avec l'[outil de débogage du partage de Meta](https://developers.facebook.com/tools/debug/) |
| `/admin` | l'écran de connexion à trois champs |

Puis dans l'admin, **Technique → Supervision → Contrôler maintenant** : tout doit être « OK ».

### C.10 Une commande réelle de test, contrôlée

1. Dans l'admin, choisissez une vraie pièce **avec son vrai prix** (saisi par la boutique), publiée, à Casablanca.
2. Depuis un téléphone, en navigation privée : ajoutez-la au panier, passez commande avec **vos** coordonnées.
3. Vérifiez : WhatsApp s'ouvre avec le message ; la commande est dans **Ventes → Commandes** avec les bonnes lignes,
   le bon total, l'adresse et la date.
4. Passez son statut à « Annulée », puis supprimez-la. Notez dans le journal que c'était un test.
5. Testez aussi un bouton WhatsApp d'une fiche : la demande apparaît dans **Ventes → Demandes WhatsApp** ; marquez-la
   « Sans suite ».

### C.11 Vérifier les e-mails et WhatsApp

- **E-mail** : créez un compte client avec une adresse à vous ; l'e-mail de confirmation arrive (expéditeur Brevo),
  le lien ramène sur le site, la connexion marche. Testez aussi « mot de passe oublié ».
- **WhatsApp** : le numéro de `web/src/data/boutique.json` (ou des Réglages de l'admin) reçoit bien les messages ;
  ouvrez un lien depuis un téléphone qui n'a pas ce contact.

---

## D. Maintenance et supervision

### D.1 Vérifier que le site fonctionne

- Le **robot** contrôle toutes les 30 minutes : site, boutique, `version.json`, vraie 404, base (API), comptes (Auth),
  photos, WhatsApp. Un échec = e-mail de GitHub.
- L'admin **Technique → Supervision** montre l'état, le dernier passage du robot et les incidents des 30 derniers jours.
- Limite à connaître : GitHub suspend les tâches planifiées d'un dépôt public **sans commit pendant 60 jours**. Si vous
  ne touchez pas au code pendant deux mois, relancez le workflow « Surveillance » à la main pour le réactiver.

### D.2 Consulter les journaux

Un **journal** (*log*) est la liste horodatée de ce qui s'est passé.

| Journal | Où | Ce qu'on y trouve |
|---|---|---|
| Actions de l'admin | admin → Boutique → Journal | qui a changé quel prix, quel statut, connexions admin |
| Erreurs du site | admin → Technique → Supervision → Erreurs du site | erreurs vues par les visiteurs (nettoyées, sans données personnelles) |
| Robot et CI | GitHub → Actions | chaque passage, chaque build |
| Builds et déploiements | Netlify → Deploys | journal complet de chaque build |
| Base, Auth, Storage | Supabase → Logs | requêtes refusées, erreurs SQL, e-mails envoyés |

### D.3 Surveiller les erreurs

Chaque semaine, ouvrez **Erreurs du site**. Une même erreur répétée sur la même page = un défaut à corriger. Le
détail donne la page, la version du site et le navigateur. Une erreur de type « chargement » juste après une mise en
ligne est normale (un visiteur avait l'ancienne page ouverte) : le site se recharge tout seul.

### D.4 Contrôler les performances

- **LCP** (*Largest Contentful Paint*) : le temps d'affichage du plus gros élément de la page, la mesure de vitesse que
  Google utilise ; bon en dessous de 2,5 s. La Supervision affiche la médiane mesurée chez vos visiteurs.
- Une fois par mois : `npm run qualite:lighthouse` dans `web/` (rapport dans `web/rapports/`), ou l'outil PageSpeed
  Insights de Google sur l'adresse en ligne.

### D.5 Les sauvegardes

Une **sauvegarde** (*backup*) est une copie des données qu'on peut remettre en place après une erreur ou une panne.

Sur l'offre Free, Supabase n'en propose aucune à restaurer : c'est à vous de la faire
([SimpleBackups](https://simplebackups.com/blog/backup-supabase-postgres)). Une fois par semaine :

```bash
mkdir -p ~/HMODE-sauvegardes
```
```bash
npx supabase db dump --linked -f ~/HMODE-sauvegardes/schema-$(date +%F).sql
```
```bash
npx supabase db dump --linked --data-only -f ~/HMODE-sauvegardes/donnees-$(date +%F).sql
```
- `db dump` : exporte la base en SQL (`pg_dump` derrière). `--linked` : le projet relié en C.2. `--data-only` : les
  données seules, sans la structure.
- Rangez le dossier **hors du dépôt** (il contient les coordonnées des clients : le dépôt est public), de préférence
  sur un disque chiffré ou un stockage personnel protégé.
- Les photos téléversées depuis l'admin sont dans Storage, pas dans ces fichiers : téléchargez-les depuis Supabase →
  Storage → `produits` une fois par mois (les photos d'origine du catalogue importé sont déjà dans `web/medias/`).
- Notez chaque sauvegarde dans l'admin (**Supervision → Sauvegardes → Noter**) : la Supervision vous prévient au-delà
  de 7 jours.

Avec l'offre Pro, des sauvegardes quotidiennes sont annoncées par les guides ; vérifiez-le dans Supabase → Database →
Backups après le passage en Pro.

### D.6 Restaurer une sauvegarde

1. **Ne restaurez jamais directement sur la base de production sans test.** Créez un projet Supabase de test (gratuit).
2. Récupérez la *connection string* du projet de test (Project Settings → Database).
3. ```bash
   psql "<connection string du projet de test>" -f ~/HMODE-sauvegardes/schema-<date>.sql
   ```
   ```bash
   psql "<connection string du projet de test>" -f ~/HMODE-sauvegardes/donnees-<date>.sql
   ```
   `psql` est le client en ligne de commande de PostgreSQL : il exécute le fichier SQL.
4. Vérifiez les tables (commandes, produits) dans le projet de test. Si c'est bon, et seulement en cas de perte réelle,
   faites la même chose sur la production, ou pointez le site vers le projet restauré (variables `VITE_SUPABASE_*`).
5. Notez « Restauration testée » dans la Supervision. Faites cet exercice **une fois par trimestre** : une sauvegarde
   jamais restaurée n'est pas une sauvegarde fiable.

### D.7 Gérer les mises à jour

- **Contenu** (prix, photos, textes, livraison) : dans l'admin, sans déploiement.
- **Code** : une branche, une pull request, la CI verte, puis fusion dans `main` : Netlify déploie tout seul.
- **Base** : nouvelle migration (`npx supabase migration new <nom>`), testée en local, puis C.2 étapes 4 à 6.
- **Dépendances** (bibliothèques npm) : une fois par mois, `npm outdated` dans `web/` ; mettez à jour par petits
  groupes, avec la CI comme filet.

### D.8 Diagnostiquer une panne

| Ce que vous voyez | Première vérification | Cause probable |
|---|---|---|
| Le site ne s'affiche plus du tout | Netlify → Deploys et Usage | crédits épuisés (site en pause) ; déploiement raté |
| Le site s'affiche mais sans produits de la base | Supervision → Contrôler maintenant ; Supabase → état du projet | base Supabase en pause (offre Free) ou en panne |
| Les commandes échouent | Supervision → Erreurs du site (type « api ») ; Limitation des requêtes | limite atteinte, pièce sans prix, ville non livrée |
| Les inscriptions ne reçoivent pas d'e-mail | Supabase → Logs → Auth ; SMTP | SMTP non branché ou quota Brevo atteint |
| L'aperçu de partage est ancien | outil de débogage de Meta → « Récupérer à nouveau » | cache de Facebook/WhatsApp ; build pas encore relancé |
| Le robot échoue toutes les 30 min | GitHub → Actions → Surveillance | lire la ligne `✗` : elle nomme le service en panne |

### D.9 Revenir à une version précédente

Le **retour arrière** (*rollback*) remet en ligne une version précédente du site.
- **Netlify** : Deploys → choisir un déploiement précédent qui marchait → **Publish deploy**. Effet immédiat.
- **Docker** : relancer l'image du tag précédent (`ghcr.io/<compte>/hmode-web:sha-<commit>`).
- **Base** : une migration ne s'annule pas toute seule. On écrit une nouvelle migration qui corrige. D'où la règle :
  sauvegarde (D.5) **avant** chaque `db push`.

---

## E. Coûts et responsabilités

### E.1 Coûts récurrents

| Poste | Gratuit | Payant | Dépend de l'usage | Source |
|---|---|---|---|---|
| Hébergement Netlify | Free : 300 crédits/mois | Personal 9 $, Pro 20 $ /mois | oui : déploiements et trafic | [Netlify](https://www.netlify.com/pricing/), [Flexprice](https://flexprice.io/blog/complete-guide-to-netlify-pricing-and-plans) |
| Base Supabase | Free (pause après 1 semaine d'inactivité, pas de sauvegarde) | Pro dès 25 $/mois | oui au-delà des quotas (ex. 0,125 $/Go de base en plus) | [Supabase](https://supabase.com/pricing) |
| Nom de domaine `.ma` | — | environ 100 à 200 DH HT/an | non | [HébergeurMarocain](https://www.hebergeurmarocain.com/blog/prix-officiel-nom-domaine-ma-maroc/) |
| E-mails (Brevo) | offre gratuite avec quota quotidien (à vérifier sur leur page tarifs) | si le volume dépasse | oui | [Brevo](https://developers.brevo.com/docs/supabase-smtp-integration) |
| GitHub (code, CI, robot) | dépôt public : minutes Actions gratuites | — | non | GitHub |
| WhatsApp Business (application) | gratuite | — | non | [WhatsApp Business](https://www.whatsappbusiness.com/products/business-app-features/) |
| Surveillance | incluse (robot GitHub + Supervision) | aucun outil payant nécessaire | non | — |
| Publicité Meta | — | budget que vous fixez | oui | [`marketing/META_ADS.md`](marketing/META_ADS.md) |

Résumé : **au lancement**, seul le domaine est payant. **En croisière**, prévoir 25 $/mois (Supabase Pro), plus 9 $ si
le trafic dépasse l'offre gratuite de Netlify, plus le budget publicitaire.

### E.2 Qui fait quoi

| Responsabilité | Qui |
|---|---|
| Site, base, sécurité, sauvegardes, supervision, mises à jour | vous (rôle `technique`) |
| Prix, tailles, photos, textes, statut des commandes, demandes WhatsApp | la boutique (rôle `commerce` ou `technique`) |
| Réponse aux clients sur WhatsApp et les réseaux | la boutique, chaque jour |
| Disponibilité de Netlify et Supabase | les fournisseurs (vous surveillez, vous ne réparez pas leurs pannes) |
| Données des clients (noms, téléphones, adresses) | vous : ne les copiez nulle part ailleurs que dans les sauvegardes protégées |

Pour créer un compte admin `commerce` (ex. votre frère), dans `web/` :

```bash
ADMIN_EMAIL=frere@exemple.ma ADMIN_MOT_DE_PASSE='un-mot-de-passe-long' ADMIN_ROLE=commerce npm run admin:sql
```
Les valeurs écrites devant la commande l'emportent sur celles de `web/.env` ; la clé de sécurité (`ADMIN_CLE`) reste
celle du fichier, car elle est **commune à tous les admins**. Collez le SQL affiché dans le SQL Editor. Ne laissez pas
ce mot de passe dans l'historique du terminal : transmettez-le à votre frère en personne, il le change ensuite par
« mot de passe oublié ».

---

## F. Checklists

### Avant le lancement

- [ ] CI verte sur `main`.
- [ ] GitHub Pages désactivé.
- [ ] 4 migrations du 08/11 appliquées (C.2), 8 versions en base.
- [ ] Variables Netlify et GitHub remplies (C.3), environnement `production` protégé.
- [ ] Site déployé sur Netlify, build avec `partage : … (catalogue : base)`.
- [ ] Supabase : Site URL, Redirect URLs, SMTP Brevo.
- [ ] Domaine branché, HTTPS actif.
- [ ] Robot « Surveillance » vert ; alertes e-mail GitHub activées.
- [ ] Vrais prix et tailles saisis dans l'admin pour les pièces à vendre.
- [ ] Frais et délai de livraison saisis (Réglages) ; mentions légales, CGV, confidentialité remplies (Textes).
- [ ] Commande de test réalisée puis supprimée (C.10) ; e-mail de compte testé (C.11).
- [ ] Première sauvegarde faite et notée (D.5).

### Le jour du lancement

- [ ] Supervision → Contrôler maintenant : tout « OK ».
- [ ] Ouvrir le site sur un téléphone en 4G, hors Wi-Fi.
- [ ] Partager une fiche sur WhatsApp : l'aperçu montre la pièce.
- [ ] Publier l'annonce sur les réseaux (voir `marketing/`).
- [ ] Regarder l'admin toutes les 2 à 3 heures : commandes, demandes WhatsApp, erreurs.

### Chaque semaine

- [ ] Commandes et demandes WhatsApp toutes traitées.
- [ ] Supervision : erreurs du site, blocages, incidents.
- [ ] Netlify → Usage : crédits sous 70 %.
- [ ] Sauvegarde de la base (D.5), notée dans la Supervision.

### Chaque mois

- [ ] Photos de Storage téléchargées.
- [ ] `npm outdated`, mises à jour par petits groupes avec CI verte.
- [ ] Lighthouse ou PageSpeed : LCP sous 2,5 s.
- [ ] Factures et quotas : Netlify, Supabase, domaine (date de renouvellement).
- [ ] Une restauration de test par trimestre (D.6).

### Après chaque mise à jour importante

- [ ] CI verte avant la fusion.
- [ ] Sauvegarde **avant** toute migration.
- [ ] Après le déploiement : Supervision → Contrôler maintenant, version en ligne = version attendue.
- [ ] Une commande de test si le parcours de commande a changé.
- [ ] Si quelque chose casse : retour arrière Netlify (D.9) d'abord, diagnostic ensuite.

---

## Sources (lues le 08/11/2026)

- Supabase : [tarifs](https://supabase.com/pricing), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
  [limites Auth](https://supabase.com/docs/guides/auth/rate-limits), [sécuriser l'API (limite par IP)](https://supabase.com/docs/guides/api/securing-your-api),
  [UI Bakery](https://uibakery.io/blog/supabase-pricing), [sauvegardes (SimpleBackups)](https://simplebackups.com/blog/backup-supabase-postgres).
- Netlify : [tarifs](https://www.netlify.com/pricing/), [Flexprice](https://flexprice.io/blog/complete-guide-to-netlify-pricing-and-plans),
  [Costbench](https://costbench.com/software/cloud-infrastructure/netlify/),
  [règles de réécriture et fichiers existants](https://answers.netlify.com/t/support-guide-making-redirects-work-for-you-troubleshooting-and-debugging/13433).
- Cloudflare Pages : [limites](https://developers.cloudflare.com/pages/platform/limits/), [guide](https://temps.sh/blog/cloudflare-pages-free-tier-limits-2026).
- Domaine `.ma` : [HébergeurMarocain](https://www.hebergeurmarocain.com/blog/prix-officiel-nom-domaine-ma-maroc/),
  [Heberfacile](https://www.heberfacile.com/nom-de-domaine/domaine-ma/).
- E-mails : [Brevo + Supabase](https://developers.brevo.com/docs/supabase-smtp-integration).
- Aperçus de partage : [Meta, outil de débogage](https://developers.facebook.com/tools/debug/) ; taille 1200 × 630 et
  JPEG de moins de 300 Ko : recommandations convergentes de [Krumzi](https://www.krumzi.com/blog/og-image-size-cheat-sheet-1200x630)
  et [Screenhance](https://screenhance.com/blog/og-image-size-guide).
