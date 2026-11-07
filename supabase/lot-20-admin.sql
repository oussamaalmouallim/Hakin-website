-- H MODE — lot 20 : administration. À coller une fois dans le SQL Editor du projet Supabase en ligne.
-- Sans danger à relancer (if not exists / create or replace / drop policy if exists). Même contenu que la section
-- « Administration » de schema.sql. Ensuite, nommer le premier admin (voir tout en bas).
--
-- Principe : aucune clé secrète dans le navigateur. Un admin est un compte client ordinaire inscrit dans `admins` ;
-- chaque droit d'écriture passe par la RLS et la fonction `est_admin()`.

-- ── Qui est admin ─────────────────────────────────────────────────────────────────────────────────
create table if not exists public.admins (
  utilisateur uuid primary key references auth.users (id) on delete cascade,
  ajoute_le timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins : se voir" on public.admins;
create policy "admins : se voir" on public.admins for select to authenticated using (utilisateur = (select auth.uid()));
revoke all on public.admins from anon;
revoke insert, update, delete on public.admins from authenticated; -- on ne devient pas admin depuis le site

create or replace function public.est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where utilisateur = (select auth.uid()))
$$;
revoke all on function public.est_admin() from public;
grant execute on function public.est_admin() to anon, authenticated;

-- ── Catalogue : une ligne par pièce (coloris, tailles, images en JSON, comme dans produits.json) ──────
create table if not exists public.produits (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  genre text check (genre in ('homme', 'femme', 'mixte')),
  nom text not null check (char_length(nom) between 1 and 200),
  marque text not null default '' check (char_length(marque) <= 80),
  categorie text not null check (char_length(categorie) between 1 and 60),
  collections text[] not null default '{}',
  prix_dh integer check (prix_dh is null or prix_dh between 1 and 1000000),
  prix_barre_dh integer check (prix_barre_dh is null or (prix_dh is not null and prix_barre_dh > prix_dh)),
  coloris jsonb not null default '[]'::jsonb check (jsonb_typeof(coloris) = 'array'),
  tailles jsonb not null default '[]'::jsonb check (jsonb_typeof(tailles) = 'array'),
  disponibilite text not null default 'a_confirmer' check (disponibilite in ('disponible', 'epuise', 'a_confirmer')),
  description text not null default '' check (char_length(description) <= 4000),
  matiere text check (char_length(matiere) <= 300),
  entretien text check (char_length(entretien) <= 300),
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  nouveau boolean not null default false,
  mis_en_avant boolean not null default false,
  a_confirmer text[] not null default '{}',
  publie boolean not null default true,
  ordre integer not null default 0,
  maj_le timestamptz not null default now()
);
alter table public.produits enable row level security;
drop policy if exists "produits : lecture" on public.produits;
create policy "produits : lecture" on public.produits for select to anon, authenticated using (publie or (select public.est_admin()));
drop policy if exists "produits : écriture admin" on public.produits;
create policy "produits : écriture admin" on public.produits for all to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));
grant select on public.produits to anon, authenticated;
grant insert, update, delete on public.produits to authenticated;
revoke insert, update, delete on public.produits from anon;

-- ── Réglages : coordonnées, livraison, retours (« boutique ») et textes des pages (« textes ») ───────
create table if not exists public.reglages (
  cle text primary key check (cle in ('boutique', 'textes')),
  valeur jsonb not null check (jsonb_typeof(valeur) = 'object'),
  maj_le timestamptz not null default now()
);
alter table public.reglages enable row level security;
drop policy if exists "réglages : lecture" on public.reglages;
create policy "réglages : lecture" on public.reglages for select to anon, authenticated using (true);
drop policy if exists "réglages : écriture admin" on public.reglages;
create policy "réglages : écriture admin" on public.reglages for all to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));
grant select on public.reglages to anon, authenticated;
grant insert, update on public.reglages to authenticated;
revoke insert, update, delete on public.reglages from anon;
revoke delete on public.reglages from authenticated;

-- ── Commandes : lecture de toutes par l'admin ; statut et suppression par fonctions contrôlées ────────
drop policy if exists "commandes : lecture admin" on public.commandes;
create policy "commandes : lecture admin" on public.commandes for select to authenticated using ((select public.est_admin()));
drop policy if exists "lignes : lecture admin" on public.lignes_commande;
create policy "lignes : lecture admin" on public.lignes_commande for select to authenticated using ((select public.est_admin()));

create or replace function public.changer_statut_commande(ref text, nouveau_statut text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.est_admin() then raise exception 'Réservé à l''administration.' using errcode = '42501'; end if;
  update public.commandes set statut = nouveau_statut where reference = ref;
  if not found then raise exception 'Commande introuvable.' using errcode = 'P0002'; end if;
end $$;
create or replace function public.supprimer_commande(ref text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.est_admin() then raise exception 'Réservé à l''administration.' using errcode = '42501'; end if;
  delete from public.commandes where reference = ref;
  if not found then raise exception 'Commande introuvable.' using errcode = 'P0002'; end if;
end $$;
revoke all on function public.changer_statut_commande(text, text) from public;
revoke all on function public.supprimer_commande(text) from public;
grant execute on function public.changer_statut_commande(text, text) to authenticated;
grant execute on function public.supprimer_commande(text) to authenticated;

-- ── passer_commande v2 : le prix vient de la base dès que la pièce y est ──────────────────────────
-- Pièce en base : prix de la base (le prix envoyé est ignoré) ; masquée ou sans prix : commande refusée.
-- Pièce absente de la base (catalogue pas encore importé) : prix envoyé, comme avant.
create or replace function public.passer_commande(commande jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := commande -> 'client';
  l jsonb;
  p record;
  prix integer;
  nouvel_id uuid;
  total integer := 0;
  lignes jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(commande -> 'lignes') <> 'array' or jsonb_array_length(commande -> 'lignes') not between 1 and 50 then
    raise exception 'Commande vide ou trop longue.' using errcode = '22023';
  end if;
  for l in select * from jsonb_array_elements(commande -> 'lignes') loop
    select pr.prix_dh, pr.publie into p from public.produits pr where pr.slug = l ->> 'slug';
    if found then
      if not p.publie or p.prix_dh is null then
        raise exception 'Pièce indisponible à la commande : %', l ->> 'slug' using errcode = '22023';
      end if;
      prix := p.prix_dh;
    else
      prix := (l ->> 'prix_dh')::integer;
    end if;
    total := total + (l ->> 'quantite')::integer * prix;
    lignes := lignes || jsonb_build_array(l || jsonb_build_object('prix_dh', prix));
  end loop;

  insert into public.commandes (reference, utilisateur, nom, telephone, email, ville, adresse, instructions, sous_total_dh)
  values (commande ->> 'reference', auth.uid(), trim(c ->> 'nom'), trim(c ->> 'telephone'), coalesce(trim(c ->> 'email'), ''),
          c ->> 'ville', trim(c ->> 'adresse'), coalesce(trim(c ->> 'instructions'), ''), total)
  returning id into nouvel_id;

  insert into public.lignes_commande (commande, slug, nom, coloris, taille, quantite, prix_dh)
  select nouvel_id, x ->> 'slug', x ->> 'nom', x ->> 'coloris', x ->> 'taille', (x ->> 'quantite')::integer, (x ->> 'prix_dh')::integer
  from jsonb_array_elements(lignes) x;

  return commande ->> 'reference';
end $$;
revoke all on function public.passer_commande(jsonb) from public;
grant execute on function public.passer_commande(jsonb) to anon, authenticated;

-- ── Journal : chaque changement fait dans l'administration, avec son auteur ───────────────────────
create table if not exists public.journal_admin (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  auteur uuid references auth.users (id) on delete set null,
  auteur_email text not null default '',
  action text not null,
  cible text not null default '',
  details jsonb not null default '{}'::jsonb
);
create index if not exists journal_admin_date on public.journal_admin (cree_le desc);
alter table public.journal_admin enable row level security;
drop policy if exists "journal : lecture admin" on public.journal_admin;
create policy "journal : lecture admin" on public.journal_admin for select to authenticated using ((select public.est_admin()));
revoke all on public.journal_admin from anon;
revoke insert, update, delete on public.journal_admin from authenticated; -- écrit seulement par les déclencheurs

create or replace function public.journaliser() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  email text := coalesce((select u.email from auth.users u where u.id = auth.uid()), '');
  cible text;
  details jsonb := '{}'::jsonb;
  action text;
begin
  if tg_table_name = 'produits' then
    cible := coalesce(new.slug, old.slug);
    action := case tg_op when 'INSERT' then 'produit créé' when 'UPDATE' then 'produit modifié' else 'produit supprimé' end;
    if tg_op = 'UPDATE' then
      select coalesce(jsonb_object_agg(n.key, jsonb_build_object('avant', o.value, 'apres', n.value)), '{}'::jsonb) into details
      from jsonb_each(to_jsonb(new)) n join jsonb_each(to_jsonb(old)) o using (key)
      where n.value is distinct from o.value and n.key <> 'maj_le';
      if details = '{}'::jsonb then return new; end if;
    elsif tg_op = 'INSERT' then
      details := jsonb_build_object('nom', new.nom, 'prix_dh', new.prix_dh);
    else
      details := jsonb_build_object('nom', old.nom);
    end if;
  elsif tg_table_name = 'reglages' then
    cible := new.cle;
    action := 'réglages modifiés';
  elsif tg_table_name = 'commandes' then
    cible := coalesce(new.reference, old.reference);
    if tg_op = 'DELETE' then
      action := 'commande supprimée';
      details := jsonb_build_object('nom', old.nom, 'sous_total_dh', old.sous_total_dh);
    else
      if new.statut is not distinct from old.statut then return new; end if;
      action := 'statut de commande';
      details := jsonb_build_object('avant', old.statut, 'apres', new.statut);
    end if;
  end if;
  -- Changement fait hors administration (fonction passer_commande d'un client, migration en SQL) : rien à journaliser.
  if not public.est_admin() then return coalesce(new, old); end if;
  insert into public.journal_admin (auteur, auteur_email, action, cible, details) values (auth.uid(), email, action, cible, details);
  return coalesce(new, old);
end $$;
revoke all on function public.journaliser() from public, anon, authenticated;

drop trigger if exists journal_produits on public.produits;
create trigger journal_produits after insert or update or delete on public.produits for each row execute function public.journaliser();
drop trigger if exists journal_reglages on public.reglages;
create trigger journal_reglages after insert or update on public.reglages for each row execute function public.journaliser();
drop trigger if exists journal_commandes on public.commandes;
create trigger journal_commandes after update or delete on public.commandes for each row execute function public.journaliser();

-- ── Photos des produits : espace « produits », public en lecture, admin en écriture ─────────────────
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('produits', 'produits', true, 2097152, array['image/webp'])
    on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/webp'];
    execute 'drop policy if exists "photos produits : écriture admin" on storage.objects';
    execute 'create policy "photos produits : écriture admin" on storage.objects for insert to authenticated with check (bucket_id = ''produits'' and (select public.est_admin()))';
    -- La suppression passe par une lecture des fichiers visés : droit de lecture (API) réservé à l'admin ;
    -- le public lit les photos par leur adresse publique, sans cette règle.
    execute 'drop policy if exists "photos produits : lecture admin" on storage.objects';
    execute 'create policy "photos produits : lecture admin" on storage.objects for select to authenticated using (bucket_id = ''produits'' and (select public.est_admin()))';
    execute 'drop policy if exists "photos produits : suppression admin" on storage.objects';
    execute 'create policy "photos produits : suppression admin" on storage.objects for delete to authenticated using (bucket_id = ''produits'' and (select public.est_admin()))';
  end if;
end $$;

-- ── Premier admin (à lancer une fois, avec l'e-mail d'un compte déjà inscrit et confirmé sur le site) ──
-- insert into public.admins (utilisateur) select id from auth.users where email = 'votre.email@exemple.ma' on conflict do nothing;
