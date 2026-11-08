-- H MODE — limitation des requêtes publiques et commande v3 (lot A, 08/11/2026). Rejouable.
-- Pourquoi : passer_commande est appelable sans compte avec la clé publique. Sans limite, n'importe qui peut
-- remplir la base de fausses commandes. La limite se fait ici, dans la base, car le site n'a pas de serveur à nous.

-- ── Empreinte du visiteur : adresse IP hachée avec un sel secret (l'adresse elle-même n'est jamais gardée) ──
-- Méthode de la doc Supabase (« Securing your API ») : 1ʳᵉ adresse de X-Forwarded-For. Cet en-tête peut être falsifié :
-- la limite par visiteur est un frein, pas une barrière. D'où aussi un plafond global, tous visiteurs confondus.
create table if not exists public.sel_empreinte (
  id boolean primary key default true check (id),
  sel bytea not null default extensions.gen_random_bytes(32)
);
insert into public.sel_empreinte (id) values (true) on conflict do nothing;
alter table public.sel_empreinte enable row level security;
revoke all on public.sel_empreinte from anon, authenticated;

create or replace function public.empreinte_visiteur() returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  entetes json := nullif(current_setting('request.headers', true), '')::json;
  ip text := trim(split_part(coalesce(entetes ->> 'x-forwarded-for', entetes ->> 'x-real-ip', ''), ',', 1));
  base text;
begin
  base := case when ip <> '' then 'ip:' || ip
               when auth.uid() is not null then 'compte:' || auth.uid()::text
               else 'inconnu' end;
  return encode(extensions.digest(convert_to(base, 'UTF8') || (select s.sel from public.sel_empreinte s), 'sha256'), 'hex');
end $$;
revoke all on function public.empreinte_visiteur() from public, anon, authenticated;

-- ── Limites configurées : modifiables en SQL, lues par la supervision ──────────────────────────────
create table if not exists public.limites (
  action text primary key check (char_length(action) between 1 and 40),
  maximum integer not null check (maximum between 1 and 100000),
  fenetre_minutes integer not null check (fenetre_minutes between 1 and 1440),
  maximum_global integer check (maximum_global is null or maximum_global between 1 and 1000000),
  description text not null default ''
);
alter table public.limites add column if not exists maximum_global integer check (maximum_global is null or maximum_global between 1 and 1000000);
insert into public.limites (action, maximum, fenetre_minutes, maximum_global, description) values
  ('commande', 5, 60, 100, 'Commandes enregistrées par visiteur (et pour tous les visiteurs)'),
  ('erreur_client', 30, 10, 2000, 'Erreurs du site envoyées par visiteur'),
  ('demande_whatsapp', 30, 10, 3000, 'Demandes WhatsApp enregistrées par visiteur'),
  ('visite', 120, 10, 50000, 'Pages vues comptées par visiteur')
on conflict (action) do update set maximum_global = coalesce(public.limites.maximum_global, excluded.maximum_global);
alter table public.limites enable row level security;
drop policy if exists "limites : lecture admin" on public.limites;
create policy "limites : lecture admin" on public.limites for select to authenticated using ((select public.est_admin()));
revoke all on public.limites from anon;
revoke insert, update, delete on public.limites from authenticated;

-- ── Événements : chaque passage compté ; « bloque » = refusé par la limite ────────────────────────
create table if not exists public.limites_evenements (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  action text not null,
  empreinte text not null,
  bloque boolean not null default false
);
create index if not exists limites_evenements_cle on public.limites_evenements (action, empreinte, cree_le desc);
create index if not exists limites_evenements_date on public.limites_evenements (cree_le desc);
alter table public.limites_evenements enable row level security;
drop policy if exists "limites : événements admin" on public.limites_evenements;
create policy "limites : événements admin" on public.limites_evenements for select to authenticated using ((select public.est_admin()));
revoke all on public.limites_evenements from anon;
revoke insert, update, delete on public.limites_evenements from authenticated;

-- Renvoie vrai si l'action est permise (et la compte), faux si la limite est atteinte (et note le blocage).
-- Ne lève jamais d'erreur : une erreur annulerait aussi la trace du blocage.
create or replace function public.passer_limite(p_action text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  l public.limites;
  e text := public.empreinte_visiteur();
  n integer;
  total integer := 0;
begin
  select * into l from public.limites where action = p_action;
  if not found then return true; end if;
  delete from public.limites_evenements where cree_le < now() - interval '30 days';
  select count(*) into n from public.limites_evenements
   where action = p_action and empreinte = e and not bloque and cree_le > now() - make_interval(mins => l.fenetre_minutes);
  if l.maximum_global is not null then
    select count(*) into total from public.limites_evenements
     where action = p_action and not bloque and cree_le > now() - make_interval(mins => l.fenetre_minutes);
  end if;
  insert into public.limites_evenements (action, empreinte, bloque)
  values (p_action, e, n >= l.maximum or (l.maximum_global is not null and total >= l.maximum_global));
  return n < l.maximum and (l.maximum_global is null or total < l.maximum_global);
end $$;
revoke all on function public.passer_limite(text) from public, anon, authenticated;

-- ── passer_commande v3 ─────────────────────────────────────────────────────────────────────────────
-- Changements sur la v2 :
--   · limite par visiteur : renvoie null quand elle est atteinte (le site affiche « trop de commandes ») ;
--   · une pièce absente du catalogue en base est refusée (avant : le prix envoyé par le navigateur était pris) ;
--   · nom de la pièce lu en base, coloris et taille vérifiés quand la fiche les liste ;
--   · la ville doit être une ville livrée (Réglages), si la liste est définie.
create or replace function public.passer_commande(commande jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  c jsonb := commande -> 'client';
  l jsonb;
  p record;
  villes jsonb;
  nouvel_id uuid;
  total integer := 0;
  lignes jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(commande -> 'lignes') is distinct from 'array' or jsonb_array_length(commande -> 'lignes') not between 1 and 50 then
    raise exception 'Commande vide ou trop longue.' using errcode = '22023';
  end if;
  if not public.passer_limite('commande') then
    return null;
  end if;

  select r.valeur -> 'livraison' -> 'villes' into villes from public.reglages r where r.cle = 'boutique';
  if jsonb_typeof(villes) = 'array' and not (villes ? coalesce(c ->> 'ville', '')) then
    raise exception 'Ville non livrée : %', c ->> 'ville' using errcode = '22023';
  end if;

  for l in select * from jsonb_array_elements(commande -> 'lignes') loop
    select pr.nom, pr.prix_dh, pr.publie, pr.coloris, pr.tailles into p from public.produits pr where pr.slug = l ->> 'slug';
    if not found or not p.publie or p.prix_dh is null then
      raise exception 'Pièce indisponible à la commande : %', l ->> 'slug' using errcode = '22023';
    end if;
    if jsonb_array_length(p.coloris) > 0 and not exists (select 1 from jsonb_array_elements(p.coloris) x where x ->> 'nom' = l ->> 'coloris') then
      raise exception 'Coloris inconnu pour %', l ->> 'slug' using errcode = '22023';
    end if;
    if jsonb_array_length(p.tailles) > 0 and not exists (select 1 from jsonb_array_elements(p.tailles) x where x ->> 'taille' = l ->> 'taille' and coalesce((x ->> 'disponible')::boolean, true)) then
      raise exception 'Taille indisponible pour %', l ->> 'slug' using errcode = '22023';
    end if;
    total := total + (l ->> 'quantite')::integer * p.prix_dh;
    lignes := lignes || jsonb_build_array(l || jsonb_build_object('prix_dh', p.prix_dh, 'nom', p.nom));
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
