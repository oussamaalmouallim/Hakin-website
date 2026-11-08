# 0008 — Supervision sans serveur, rôles admin, demandes WhatsApp, aperçus de partage
- Date : 2026-11-08
- Contexte : avant la mise en ligne, le développeur (seul sur le numérique) veut surveiller le site, séparer
  l'administration commerciale de la supervision technique, suivre les demandes WhatsApp et avoir des liens partagés
  propres. Le site n'a pas de serveur à nous (ADR 0007) : tout doit reposer sur Supabase, GitHub et l'hébergeur.
  L'audit a aussi montré que `passer_commande` était appelable sans limite et prenait le prix du navigateur pour une
  pièce absente de la base.
- Décisions (validées par l'utilisateur, « go, recos ») :
  - **Limitation des requêtes dans la base** (`passer_limite`) : maximum par visiteur (empreinte hachée et salée de
    l'adresse réseau, méthode de la doc Supabase) **et** plafond global, car l'en-tête d'adresse est falsifiable.
    Commande v3 : pièce publiée en base obligatoire, coloris, taille et ville livrée vérifiés.
  - **Deux rôles** dans `admins.role` : `technique` (tout) et `commerce` (sans supervision), vérifiés par
    `est_admin_technique()`. Clé de sécurité commune.
  - **Supervision** : robot GitHub Actions toutes les 30 min (jeton haché en base, alerte = échec du workflow = e-mail
    GitHub), contrôles depuis l'admin, erreurs du site et pages vues envoyées par les navigateurs (nettoyées, sans
    cookie, conservées 30 jours), version gravée au build. Aucun outil payant. Les journaux internes de Supabase
    restent dans son tableau de bord (illisibles sans clé secrète).
  - **Sauvegardes** : notées à la main dans l'admin au lancement (offre Free sans sauvegarde restaurable) ; passage à
    Supabase Pro recommandé dès les ventes régulières. Pas de copie automatique par GitHub Actions : les artefacts d'un
    dépôt public seraient exposés.
  - **Fréquentation** : compteur maison dans Supabase plutôt qu'un service externe (pas de nouveau domaine dans la CSP,
    pas de bandeau cookies).
  - **Demandes WhatsApp** : notées au clic, présentées comme contacts à traiter, jamais comme commandes.
  - **Aperçus de partage** : pages HTML par fiche et images JPEG 1200 × 630 générées au build ; republication par build
    hook quand le catalogue change, au plus toutes les 12 h (crédits Netlify).
- Conséquences :
  - 4 nouvelles migrations à appliquer en ligne ; secret `SANTE_JETON` (et `NETLIFY_BUILD_HOOK` facultatif) à poser.
  - Un aperçu de fiche peut avoir jusqu'à 12 h de retard sur l'admin.
  - Le robot s'arrête si le dépôt public reste 60 jours sans commit (règle GitHub) : le relancer à la main.
  - Pas de suivi des achats pour Meta Ads (pas de pixel) : à décider plus tard avec un bandeau de consentement.
