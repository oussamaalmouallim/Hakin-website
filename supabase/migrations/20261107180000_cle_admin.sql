-- H MODE — lot 21 : clé de sécurité de l'administration. À coller une fois dans le SQL Editor, APRÈS lot-20-admin.sql.
-- Sans danger à relancer. Ensuite : `cd web && npm run admin:sql` donne les deux lignes qui nomment l'admin et posent la clé.
--
-- Principe : le mot de passe ne suffit plus. Après la connexion, l'admin tape sa clé (texte libre, celle de ADMIN_CLE) ; la base la compare à
-- son empreinte bcrypt (la clé n'est jamais stockée ni envoyée au site en clair) et déverrouille CETTE session pour 12 h.
-- `est_admin()` exige ce déverrouillage : toutes les règles du lot 20 (RLS, fonctions, stockage, journal) en profitent.
-- 5 clés fausses de suite : la clé est refusée pendant 15 minutes.

create extension if not exists pgcrypto with schema extensions;

-- ── Empreinte de la clé (une seule ligne) ──────────────────────────────────────────────────────────
create table if not exists public.admin_cle (
  id smallint primary key default 1 check (id = 1),
  hash text not null check (hash like '$2a$%'),
  maj_le timestamptz not null default now()
);
-- ── Sessions déverrouillées, et essais ratés ───────────────────────────────────────────────────────
create table if not exists public.admin_sessions (
  session uuid primary key,
  utilisateur uuid not null references auth.users (id) on delete cascade,
  expire_le timestamptz not null
);
create table if not exists public.admin_essais (
  utilisateur uuid primary key references auth.users (id) on delete cascade,
  echecs smallint not null default 0,
  bloque_jusqua timestamptz
);
-- Aucune lecture ni écriture depuis le site : seules les fonctions ci-dessous y touchent.
alter table public.admin_cle enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_essais enable row level security;
revoke all on public.admin_cle, public.admin_sessions, public.admin_essais from anon, authenticated;

-- Session Supabase de la requête (même identifiant tant qu'on reste connecté, jeton rafraîchi ou non).
create or replace function public.session_courante() returns uuid
language sql stable set search_path = '' as $$
  select nullif((select auth.jwt()) ->> 'session_id', '')::uuid
$$;
revoke all on function public.session_courante() from public;

-- ── Admin = inscrit dans `admins` ET session déverrouillée par la clé ─────────────────────────────
create or replace function public.est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    join public.admin_sessions s on s.utilisateur = a.utilisateur
    where a.utilisateur = (select auth.uid()) and s.session = public.session_courante() and s.expire_le > now()
  )
$$;
revoke all on function public.est_admin() from public;
grant execute on function public.est_admin() to anon, authenticated;

-- État pour l'écran de connexion : compte admin ? clé posée ? session déjà déverrouillée ?
create or replace function public.admin_statut() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'admin', exists (select 1 from public.admins where utilisateur = (select auth.uid())),
    'cle', exists (select 1 from public.admin_cle),
    'deverrouille', public.est_admin()
  )
$$;
revoke all on function public.admin_statut() from public;
grant execute on function public.admin_statut() to authenticated;

-- Vérifie la clé. Ne lève pas d'erreur sur une clé fausse (sinon le compteur d'essais serait annulé) : renvoie
-- {ok, message}. Chaque connexion réussie et chaque blocage sont écrits dans le journal.
create or replace function public.deverrouiller_admin(cle text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  sess uuid := public.session_courante();
  empreinte text;
  essai public.admin_essais;
  email text;
begin
  if uid is null or not exists (select 1 from public.admins where utilisateur = uid) then
    raise exception 'Réservé à l''administration.' using errcode = '42501';
  end if;
  if sess is null then raise exception 'Session invalide : reconnectez-vous.' using errcode = '42501'; end if;
  select hash into empreinte from public.admin_cle where id = 1;
  if empreinte is null then return jsonb_build_object('ok', false, 'message', 'Aucune clé de sécurité n''est définie (npm run admin:sql).'); end if;

  select * into essai from public.admin_essais where utilisateur = uid;
  if essai.bloque_jusqua > now() then
    return jsonb_build_object('ok', false, 'message',
      format('Trop d''essais. Réessayez dans %s min.', ceil(extract(epoch from essai.bloque_jusqua - now()) / 60)));
  end if;
  select u.email into email from auth.users u where u.id = uid;

  if coalesce(cle, '') = '' or extensions.crypt(cle, empreinte) <> empreinte then
    insert into public.admin_essais (utilisateur, echecs) values (uid, 1)
      on conflict (utilisateur) do update set echecs = public.admin_essais.echecs + 1, bloque_jusqua = null;
    select * into essai from public.admin_essais where utilisateur = uid;
    if essai.echecs >= 5 then
      update public.admin_essais set echecs = 0, bloque_jusqua = now() + interval '15 minutes' where utilisateur = uid;
      insert into public.journal_admin (auteur, auteur_email, action, cible) values (uid, coalesce(email, ''), 'clé refusée 5 fois : bloquée 15 min', 'connexion');
      return jsonb_build_object('ok', false, 'message', 'Clé incorrecte. Trop d''essais : réessayez dans 15 min.');
    end if;
    return jsonb_build_object('ok', false, 'message', format('Clé incorrecte (%s essai%s restant%s).', 5 - essai.echecs,
      case when 5 - essai.echecs > 1 then 's' else '' end, case when 5 - essai.echecs > 1 then 's' else '' end));
  end if;

  delete from public.admin_essais where utilisateur = uid;
  delete from public.admin_sessions where expire_le < now();
  insert into public.admin_sessions (session, utilisateur, expire_le) values (sess, uid, now() + interval '12 hours')
    on conflict (session) do update set expire_le = excluded.expire_le, utilisateur = excluded.utilisateur;
  insert into public.journal_admin (auteur, auteur_email, action, cible) values (uid, coalesce(email, ''), 'connexion admin', 'connexion');
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.deverrouiller_admin(text) from public;
grant execute on function public.deverrouiller_admin(text) to authenticated;

-- Déconnexion : la session perd ses droits tout de suite.
create or replace function public.verrouiller_admin() returns void
language sql volatile security definer set search_path = '' as $$
  delete from public.admin_sessions where session = public.session_courante() and utilisateur = (select auth.uid())
$$;
revoke all on function public.verrouiller_admin() from public;
grant execute on function public.verrouiller_admin() to authenticated;

-- ── Nommer l'admin et poser la clé : `cd web && npm run admin:sql` (lit ADMIN_EMAIL et ADMIN_CLE dans web/.env) ──
-- Le compte se crée dans Authentication → Users → Add user (« Auto Confirm User » coché), pas sur le site.
