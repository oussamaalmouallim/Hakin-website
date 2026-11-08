-- H MODE — supervision technique (lot C, 08/11/2026). Rejouable.
-- Le site n'a pas de serveur à nous : tout ce que la supervision affiche vient d'ici, de données réellement mesurées.
--   · rôles : « technique » (le développeur : tout) et « commerce » (catalogue, commandes, demandes) ;
--   · contrôles de santé : écrits par le robot GitHub (jeton haché) et par l'admin quand il ouvre l'écran ;
--   · erreurs du site : envoyées par les navigateurs, nettoyées, limitées ;
--   · fréquentation : pages vues sans cookie, visiteur = empreinte hachée (jamais l'adresse IP) ;
--   · sauvegardes : notées à la main par l'admin (aucune sauvegarde automatique n'est configurée).
-- Rétention : 30 jours pour les erreurs, contrôles et visites (purge à chaque écriture).

-- ── Rôles ─────────────────────────────────────────────────────────────────────────────────────────
alter table public.admins add column if not exists role text not null default 'technique';
do $$ begin
  alter table public.admins add constraint admins_role check (role in ('technique', 'commerce'));
exception when duplicate_object then null; end $$;

create or replace function public.est_admin_technique() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.est_admin() and exists (select 1 from public.admins where utilisateur = (select auth.uid()) and role = 'technique')
$$;
revoke all on function public.est_admin_technique() from public;
grant execute on function public.est_admin_technique() to authenticated;

create or replace function public.admin_statut() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'admin', exists (select 1 from public.admins where utilisateur = (select auth.uid())),
    'cle', exists (select 1 from public.admin_cle),
    'deverrouille', public.est_admin(),
    'role', (select role from public.admins where utilisateur = (select auth.uid()))
  )
$$;
revoke all on function public.admin_statut() from public;
grant execute on function public.admin_statut() to authenticated;

-- Les limites et leurs événements relèvent de la supervision : lecture réservée au rôle technique.
drop policy if exists "limites : lecture admin" on public.limites;
create policy "limites : lecture admin" on public.limites for select to authenticated using ((select public.est_admin_technique()));
drop policy if exists "limites : événements admin" on public.limites_evenements;
create policy "limites : événements admin" on public.limites_evenements for select to authenticated using ((select public.est_admin_technique()));

insert into public.limites (action, maximum, fenetre_minutes, maximum_global, description) values
  ('controle_robot', 20, 10, 60, 'Envois du robot de surveillance (GitHub Actions)')
on conflict (action) do nothing;

-- ── Contrôles de santé ────────────────────────────────────────────────────────────────────────────
create table if not exists public.controles_sante (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  source text not null check (source in ('robot', 'admin')),
  cible text not null check (char_length(cible) between 1 and 60),
  ok boolean not null,
  statut_http integer check (statut_http between 0 and 999),
  duree_ms integer check (duree_ms between 0 and 600000),
  detail text not null default '' check (char_length(detail) <= 300)
);
create index if not exists controles_sante_date on public.controles_sante (cree_le desc);
alter table public.controles_sante enable row level security;
drop policy if exists "contrôles : lecture technique" on public.controles_sante;
create policy "contrôles : lecture technique" on public.controles_sante for select to authenticated using ((select public.est_admin_technique()));
revoke all on public.controles_sante from anon;
revoke insert, update, delete on public.controles_sante from authenticated;

-- Jeton du robot : seule son empreinte bcrypt est en base (posée par `npm run sante:sql`, comme la clé admin).
create table if not exists public.robot_jeton (
  id integer primary key default 1 check (id = 1),
  hash text not null check (hash like '$2_$%'),
  maj_le timestamptz not null default now()
);
alter table public.robot_jeton enable row level security;
revoke all on public.robot_jeton from anon, authenticated;

-- Nettoie un texte libre avant de le garder : e-mails, numéros (téléphone), jetons longs, paramètres d'adresse.
create or replace function public.nettoyer_texte(t text, n integer) returns text
language sql immutable set search_path = '' as $$
  select left(
    regexp_replace(regexp_replace(regexp_replace(regexp_replace(coalesce(t, ''),
      '[^\s@]+@[^\s@]+', '[e-mail]', 'g'),
      '[A-Za-z0-9_\-\.]{32,}', '[jeton]', 'g'),
      '\+?[0-9][0-9 .\-]{7,}[0-9]', '[numéro]', 'g'),
      '\?[^\s]*', '', 'g'),
    n)
$$;
revoke all on function public.nettoyer_texte(text, integer) from public, anon, authenticated;

-- Écrit par le robot : {jeton, resultats: [{cible, ok, statut_http, duree_ms, detail}]}.
-- Renvoie les alertes à remonter (le robot échoue s'il y en a : GitHub prévient alors par e-mail).
create or replace function public.enregistrer_controles(jeton text, resultats jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  empreinte text;
  r jsonb;
  alertes jsonb := '[]'::jsonb;
  n integer;
begin
  if not public.passer_limite('controle_robot') then
    return jsonb_build_object('ok', false, 'message', 'Trop d''envois.');
  end if;
  select hash into empreinte from public.robot_jeton where id = 1;
  if empreinte is null or coalesce(jeton, '') = '' or extensions.crypt(jeton, empreinte) <> empreinte then
    return jsonb_build_object('ok', false, 'message', 'Jeton refusé.');
  end if;
  if jsonb_typeof(resultats) is distinct from 'array' or jsonb_array_length(resultats) > 20 then
    return jsonb_build_object('ok', false, 'message', 'Résultats invalides.');
  end if;
  delete from public.controles_sante where cree_le < now() - interval '30 days';
  for r in select * from jsonb_array_elements(resultats) loop
    insert into public.controles_sante (source, cible, ok, statut_http, duree_ms, detail)
    values ('robot', left(coalesce(r ->> 'cible', '?'), 60), coalesce((r ->> 'ok')::boolean, false),
            nullif(r ->> 'statut_http', '')::integer, nullif(r ->> 'duree_ms', '')::integer, public.nettoyer_texte(r ->> 'detail', 300));
    if not coalesce((r ->> 'ok')::boolean, false) then
      alertes := alertes || jsonb_build_array(format('%s en échec : %s', r ->> 'cible', coalesce(r ->> 'detail', '')));
    end if;
  end loop;
  -- Activité suspecte depuis 30 min : blocages de limite, erreurs du site en rafale.
  select count(*) into n from public.limites_evenements where bloque and cree_le > now() - interval '30 minutes';
  if n >= 10 then alertes := alertes || jsonb_build_array(format('%s requêtes bloquées par les limites en 30 min', n)); end if;
  select count(*) into n from public.erreurs_site where cree_le > now() - interval '30 minutes';
  if n >= 50 then alertes := alertes || jsonb_build_array(format('%s erreurs du site en 30 min', n)); end if;
  return jsonb_build_object('ok', true, 'alertes', alertes);
end $$;
revoke all on function public.enregistrer_controles(text, jsonb) from public;
grant execute on function public.enregistrer_controles(text, jsonb) to anon, authenticated; -- le robot appelle avec la clé publique, le jeton fait foi

-- Écrit par l'admin technique quand il ouvre la supervision (contrôles faits depuis son navigateur).
create or replace function public.noter_controles(resultats jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare r jsonb;
begin
  if not public.est_admin_technique() then raise exception 'Réservé à la supervision technique.' using errcode = '42501'; end if;
  if jsonb_typeof(resultats) is distinct from 'array' or jsonb_array_length(resultats) > 20 then raise exception 'Résultats invalides.' using errcode = '22023'; end if;
  for r in select * from jsonb_array_elements(resultats) loop
    insert into public.controles_sante (source, cible, ok, statut_http, duree_ms, detail)
    values ('admin', left(coalesce(r ->> 'cible', '?'), 60), coalesce((r ->> 'ok')::boolean, false),
            nullif(r ->> 'statut_http', '')::integer, nullif(r ->> 'duree_ms', '')::integer, public.nettoyer_texte(r ->> 'detail', 300));
  end loop;
end $$;
revoke all on function public.noter_controles(jsonb) from public;
grant execute on function public.noter_controles(jsonb) to authenticated;

-- ── Erreurs du site (navigateurs des visiteurs) ───────────────────────────────────────────────────
create table if not exists public.erreurs_site (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  type text not null check (type in ('script', 'promesse', 'rendu', 'api', 'chargement')),
  gravite text not null check (gravite in ('erreur', 'avertissement')),
  message text not null check (char_length(message) between 1 and 500),
  page text not null default '' check (char_length(page) <= 200),
  source text not null default '' check (char_length(source) <= 200),
  version text not null default '' check (char_length(version) <= 60),
  navigateur text not null default '' check (char_length(navigateur) <= 60),
  empreinte text not null
);
create index if not exists erreurs_site_date on public.erreurs_site (cree_le desc);
alter table public.erreurs_site enable row level security;
drop policy if exists "erreurs : lecture technique" on public.erreurs_site;
create policy "erreurs : lecture technique" on public.erreurs_site for select to authenticated using ((select public.est_admin_technique()));
revoke all on public.erreurs_site from anon;
revoke insert, update, delete on public.erreurs_site from authenticated;

create or replace function public.signaler_erreur(erreur jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  t text := erreur ->> 'type';
  m text := public.nettoyer_texte(erreur ->> 'message', 500);
begin
  if t not in ('script', 'promesse', 'rendu', 'api', 'chargement') or coalesce(trim(m), '') = '' then return; end if;
  if not public.passer_limite('erreur_client') then return; end if;
  delete from public.erreurs_site where cree_le < now() - interval '30 days';
  insert into public.erreurs_site (type, gravite, message, page, source, version, navigateur, empreinte)
  values (t, case when erreur ->> 'gravite' = 'avertissement' then 'avertissement' else 'erreur' end, m,
          public.nettoyer_texte(erreur ->> 'page', 200), public.nettoyer_texte(erreur ->> 'source', 200),
          left(coalesce(erreur ->> 'version', ''), 60), left(coalesce(erreur ->> 'navigateur', ''), 60), public.empreinte_visiteur());
end $$;
revoke all on function public.signaler_erreur(jsonb) from public;
grant execute on function public.signaler_erreur(jsonb) to anon, authenticated;

-- ── Fréquentation : pages vues, sans cookie ───────────────────────────────────────────────────────
create table if not exists public.visites (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  page text not null check (char_length(page) between 1 and 200),
  empreinte text not null,
  lcp_ms integer check (lcp_ms between 0 and 120000)
);
create index if not exists visites_date on public.visites (cree_le desc);
alter table public.visites enable row level security;
drop policy if exists "visites : lecture technique" on public.visites;
create policy "visites : lecture technique" on public.visites for select to authenticated using ((select public.est_admin_technique()));
revoke all on public.visites from anon;
revoke insert, update, delete on public.visites from authenticated;

create or replace function public.compter_visite(page text, lcp_ms integer default null) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare p text := public.nettoyer_texte(page, 200);
begin
  if coalesce(p, '') = '' or p like '/admin%' then return; end if;
  if not public.passer_limite('visite') then return; end if;
  delete from public.visites where cree_le < now() - interval '30 days';
  insert into public.visites (page, empreinte, lcp_ms)
  values (p, public.empreinte_visiteur(), case when lcp_ms between 0 and 120000 then lcp_ms end);
end $$;
revoke all on function public.compter_visite(text, integer) from public;
grant execute on function public.compter_visite(text, integer) to anon, authenticated;

-- Chiffres agrégés pour la supervision (aucune ligne brute ni empreinte n'en sort).
create or replace function public.statistiques_supervision() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare res jsonb;
begin
  if not public.est_admin_technique() then raise exception 'Réservé à la supervision technique.' using errcode = '42501'; end if;
  select jsonb_build_object(
    'visites', jsonb_build_object(
      'aujourdhui', (select count(*) from public.visites where cree_le >= date_trunc('day', now())),
      'visiteurs_aujourdhui', (select count(distinct empreinte) from public.visites where cree_le >= date_trunc('day', now())),
      'sept_jours', (select count(*) from public.visites where cree_le > now() - interval '7 days'),
      'visiteurs_sept_jours', (select count(distinct empreinte) from public.visites where cree_le > now() - interval '7 days'),
      'trente_jours', (select count(*) from public.visites),
      'lcp_median_ms', (select percentile_cont(0.5) within group (order by lcp_ms)::integer from public.visites where lcp_ms is not null and cree_le > now() - interval '7 days'),
      'lcp_mesures', (select count(*) from public.visites where lcp_ms is not null and cree_le > now() - interval '7 days'),
      'pages', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select page, count(*) as vues from public.visites where cree_le > now() - interval '7 days' group by page order by 2 desc limit 8) x),
      'par_jour', (select coalesce(jsonb_agg(x order by x.jour), '[]'::jsonb) from (select date_trunc('day', cree_le)::date as jour, count(*) as vues, count(distinct empreinte) as visiteurs from public.visites where cree_le > now() - interval '14 days' group by 1) x)
    ),
    'limites', jsonb_build_object(
      'regles', (select coalesce(jsonb_agg(l order by l.action), '[]'::jsonb) from public.limites l),
      'bloques_24h', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select action, count(*) as bloques, count(distinct empreinte) as visiteurs from public.limites_evenements where bloque and cree_le > now() - interval '24 hours' group by action) x),
      'bloques_7j', (select count(*) from public.limites_evenements where bloque and cree_le > now() - interval '7 days'),
      'suspects', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select left(empreinte, 10) as visiteur, action, count(*) as bloques, max(cree_le) as dernier from public.limites_evenements where bloque and cree_le > now() - interval '7 days' group by 1, 2 having count(*) >= 5 order by 3 desc limit 10) x),
      'historique', (select coalesce(jsonb_agg(x order by x.cree_le desc), '[]'::jsonb) from (select cree_le, action, left(empreinte, 10) as visiteur from public.limites_evenements where bloque order by cree_le desc limit 30) x)
    ),
    'erreurs', jsonb_build_object(
      'vingt_quatre_heures', (select count(*) from public.erreurs_site where cree_le > now() - interval '24 hours'),
      'sept_jours', (select count(*) from public.erreurs_site where cree_le > now() - interval '7 days')
    )
  ) into res;
  return res;
end $$;
revoke all on function public.statistiques_supervision() from public;
grant execute on function public.statistiques_supervision() to authenticated;

-- ── Sauvegardes notées à la main ──────────────────────────────────────────────────────────────────
create table if not exists public.sauvegardes (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  auteur uuid references auth.users (id) on delete set null default auth.uid(),
  type text not null check (type in ('manuelle', 'restauration_testee')),
  note text not null default '' check (char_length(note) <= 300)
);
alter table public.sauvegardes enable row level security;
drop policy if exists "sauvegardes : technique" on public.sauvegardes;
create policy "sauvegardes : technique" on public.sauvegardes for all to authenticated
  using ((select public.est_admin_technique())) with check ((select public.est_admin_technique()));
revoke all on public.sauvegardes from anon;
revoke update on public.sauvegardes from authenticated;
grant select, insert, delete on public.sauvegardes to authenticated;
