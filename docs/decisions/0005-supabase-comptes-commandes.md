# 0005 — Supabase pour les comptes, le panier et les commandes
- Date : 2026-11-02
- Contexte : la finalisation e-commerce demande de vrais comptes (inscription, connexion, session), un panier retrouvé après reconnexion, des commandes enregistrées et l'isolation des données entre clients. L'ADR 0001 gardait tout dans le navigateur, sans serveur. Le site reste hébergé en statique sur Netlify.
- Décision : Supabase (Auth + Postgres hébergés), choisi par l'utilisateur.
  - Le navigateur n'utilise que l'URL du projet et la clé **publique** (`web/.env`, non versionné ; modèle `web/.env.example`). La clé secrète n'est jamais côté site.
  - Schéma unique et rejouable : `supabase/schema.sql` (profils, adresses, paniers, commandes, lignes de commande).
  - **RLS** sur toutes les tables : chaque compte ne lit et n'écrit que ses lignes (`auth.uid()`). Les visiteurs n'ont accès à aucune table.
  - Les commandes ne s'écrivent que par la fonction `passer_commande` (une transaction, compte rattaché par `auth.uid()`, jamais par une valeur envoyée). Commande sans compte possible (`utilisateur` vide).
  - Paiement à la livraison uniquement (`mode_paiement = 'livraison'` imposé par la base). Aucun paiement en ligne.
  - WhatsApp reste le canal de confirmation : la commande est enregistrée **puis** le client l'envoie sur WhatsApp (décision utilisateur).
  - Sans variables d'environnement, le site garde le fonctionnement local de l'ADR 0001 (`supabase` vaut `null`).
  - Contrôle sans écriture : `cd web && node --env-file=.env scripts/verifier-supabase.mjs`.
- Conséquences :
  - Remplace l'ADR 0001 pour les comptes et l'enregistrement des commandes ; le message WhatsApp et le paiement à la livraison sont conservés.
  - Les prix des lignes viennent du catalogue statique du site : la base ne peut pas les vérifier. La boutique les contrôle à la confirmation WhatsApp. Une table de prix côté base sera nécessaire si les commandes sont un jour confirmées sans échange.
  - Une commande sans compte peut être envoyée par n'importe quel visiteur (comme le formulaire WhatsApp aujourd'hui) ; à surveiller, limiter si des abus apparaissent.
  - La boutique consulte et fait évoluer les commandes (`statut`) dans le tableau Supabase (Table Editor), en attendant un écran d'administration.
  - Netlify : ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans les variables d'environnement du site avant la mise en ligne.
  - Confirmation de l'e-mail à l'inscription : activée par défaut dans Supabase, à confirmer par l'utilisateur.

> **05/11/2026 (lot 19)** : les favoris rejoignent le compte (table `favoris`, même règle de fusion et de RLS que le panier). Ils ne restent sur l'appareil que pour un visiteur.
