-- H MODE — schéma Supabase (comptes, adresses, panier, commandes)
-- À coller dans Supabase → SQL Editor → Run. Rejouable : chaque objet est créé « si absent » ou remplacé.
-- Sécurité : RLS sur toutes les tables ; chaque utilisateur ne lit et n'écrit que ses lignes (auth.uid()).
-- Les commandes ne s'écrivent que par la fonction passer_commande (contrôles + insertion atomique).
-- Décision : docs/decisions/0005-supabase-comptes-commandes.md

-- ── Profils : une ligne par compte, créée automatiquement à l'inscription ──────────────────────────
create table if not exists public.profils (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null default '' check (char_length(nom) <= 120),
  telephone text not null default '' check (char_length(telephone) <= 30),
  email text not null default '' check (char_length(email) <= 254),
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);

create or replace function public.creer_profil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profils (id, nom, telephone, email)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'nom', 120), ''),
          coalesce(left(new.raw_user_meta_data ->> 'telephone', 30), ''), coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists a_l_inscription on auth.users;
create trigger a_l_inscription after insert on auth.users for each row execute function public.creer_profil();

-- ── Adresses de livraison ───────────────────────────────────────────────────────────────────────
create table if not exists public.adresses (
  id uuid primary key default gen_random_uuid(),
  utilisateur uuid not null default auth.uid() references auth.users (id) on delete cascade,
  libelle text not null default '' check (char_length(libelle) <= 60),
  ville text not null check (char_length(ville) between 1 and 80),
  adresse text not null check (char_length(adresse) between 1 and 300),
  instructions text not null default '' check (char_length(instructions) <= 500),
  par_defaut boolean not null default false,
  cree_le timestamptz not null default now()
);
create index if not exists adresses_utilisateur on public.adresses (utilisateur);

-- ── Panier : une ligne par compte, lignes en JSON [{slug, coloris, taille, quantite}] ─────────────
create table if not exists public.paniers (
  utilisateur uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  lignes jsonb not null default '[]'::jsonb check (jsonb_typeof(lignes) = 'array' and jsonb_array_length(lignes) <= 50),
  maj_le timestamptz not null default now()
);

-- ── Favoris : une ligne par pièce aimée (lot 19) ──────────────────────────────────────────────────
create table if not exists public.favoris (
  utilisateur uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null check (char_length(slug) between 1 and 120),
  cree_le timestamptz not null default now(),
  primary key (utilisateur, slug)
);

-- ── Commandes et leurs lignes ───────────────────────────────────────────────────────────────────
create table if not exists public.commandes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (char_length(reference) between 4 and 40),
  utilisateur uuid references auth.users (id) on delete set null, -- null = commande sans compte
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'confirmee', 'expediee', 'livree', 'annulee')),
  mode_paiement text not null default 'livraison' check (mode_paiement = 'livraison'), -- paiement à la livraison uniquement
  nom text not null check (char_length(nom) between 2 and 120),
  telephone text not null check (char_length(telephone) between 6 and 30),
  email text not null default '' check (char_length(email) <= 254),
  ville text not null check (char_length(ville) between 1 and 80),
  adresse text not null check (char_length(adresse) between 1 and 300),
  instructions text not null default '' check (char_length(instructions) <= 500),
  sous_total_dh integer not null check (sous_total_dh >= 0),
  cree_le timestamptz not null default now()
);
create index if not exists commandes_utilisateur on public.commandes (utilisateur, cree_le desc);

create table if not exists public.lignes_commande (
  id bigint generated always as identity primary key,
  commande uuid not null references public.commandes (id) on delete cascade,
  slug text not null check (char_length(slug) between 1 and 120),
  nom text not null check (char_length(nom) between 1 and 200),
  coloris text not null check (char_length(coloris) between 1 and 60),
  taille text not null check (char_length(taille) between 1 and 20),
  quantite integer not null check (quantite between 1 and 10),
  prix_dh integer not null check (prix_dh >= 0)
);
create index if not exists lignes_commande_commande on public.lignes_commande (commande);

-- ── RLS : chacun ne voit que ses données ────────────────────────────────────────────────────────
alter table public.profils enable row level security;
alter table public.adresses enable row level security;
alter table public.paniers enable row level security;
alter table public.favoris enable row level security;
alter table public.commandes enable row level security;
alter table public.lignes_commande enable row level security;

drop policy if exists "profil : lecture" on public.profils;
drop policy if exists "profil : mise à jour" on public.profils;
create policy "profil : lecture" on public.profils for select to authenticated using (id = (select auth.uid()));
create policy "profil : mise à jour" on public.profils for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "adresses : tout sur les siennes" on public.adresses;
create policy "adresses : tout sur les siennes" on public.adresses for all to authenticated
  using (utilisateur = (select auth.uid())) with check (utilisateur = (select auth.uid()));

drop policy if exists "panier : tout sur le sien" on public.paniers;
create policy "panier : tout sur le sien" on public.paniers for all to authenticated
  using (utilisateur = (select auth.uid())) with check (utilisateur = (select auth.uid()));

drop policy if exists "favoris : tout sur les siens" on public.favoris;
create policy "favoris : tout sur les siens" on public.favoris for all to authenticated
  using (utilisateur = (select auth.uid())) with check (utilisateur = (select auth.uid()));

-- Commandes : lecture seule de ses propres commandes ; aucune écriture directe (voir passer_commande).
drop policy if exists "commandes : lecture des siennes" on public.commandes;
create policy "commandes : lecture des siennes" on public.commandes for select to authenticated using (utilisateur = (select auth.uid()));
drop policy if exists "lignes : lecture des siennes" on public.lignes_commande;
create policy "lignes : lecture des siennes" on public.lignes_commande for select to authenticated
  using (exists (select 1 from public.commandes c where c.id = commande and c.utilisateur = (select auth.uid())));

-- Droits de table : les visiteurs (anon) n'accèdent à aucune table ; les comptes n'ont que ce que la RLS filtre.
revoke all on public.profils, public.adresses, public.paniers, public.favoris, public.commandes, public.lignes_commande from anon;
revoke update on public.favoris from authenticated; -- un favori s'ajoute ou se retire, il ne se modifie pas
revoke insert, update, delete on public.commandes, public.lignes_commande from authenticated;

-- ── passer_commande : contrôle et enregistre une commande en une transaction ──────────────────────
-- Version 1. Remplacée par la v2 de lot-20-admin.sql (prix lu dans la table produits), chargé juste après ce fichier.
-- Entrée : { reference, client: {nom, telephone, email, ville, adresse, instructions},
--            lignes: [{slug, nom, coloris, taille, quantite, prix_dh}] }
-- Le compte connecté (s'il y en a un) est rattaché par auth.uid(), jamais par une valeur envoyée.
create or replace function public.passer_commande(commande jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := commande -> 'client';
  l jsonb;
  nouvel_id uuid;
  total integer := 0;
begin
  if jsonb_typeof(commande -> 'lignes') <> 'array' or jsonb_array_length(commande -> 'lignes') not between 1 and 50 then
    raise exception 'Commande vide ou trop longue.' using errcode = '22023';
  end if;
  for l in select * from jsonb_array_elements(commande -> 'lignes') loop
    total := total + (l ->> 'quantite')::integer * (l ->> 'prix_dh')::integer;
  end loop;

  insert into public.commandes (reference, utilisateur, nom, telephone, email, ville, adresse, instructions, sous_total_dh)
  values (commande ->> 'reference', auth.uid(), trim(c ->> 'nom'), trim(c ->> 'telephone'), coalesce(trim(c ->> 'email'), ''),
          c ->> 'ville', trim(c ->> 'adresse'), coalesce(trim(c ->> 'instructions'), ''), total)
  returning id into nouvel_id;

  insert into public.lignes_commande (commande, slug, nom, coloris, taille, quantite, prix_dh)
  select nouvel_id, x ->> 'slug', x ->> 'nom', x ->> 'coloris', x ->> 'taille', (x ->> 'quantite')::integer, (x ->> 'prix_dh')::integer
  from jsonb_array_elements(commande -> 'lignes') x;

  return commande ->> 'reference';
end $$;

revoke all on function public.passer_commande(jsonb) from public;
grant execute on function public.passer_commande(jsonb) to anon, authenticated;
revoke all on function public.creer_profil() from public, anon, authenticated;

-- Suite du schéma : lot-20-admin.sql (administration, catalogue et réglages en base, journal, photos).
