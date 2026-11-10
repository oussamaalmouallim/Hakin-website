-- H MODE — santé, journal technique et réponses 429 (lots 33 à 35, 10/11/2026). Rejouable.
-- Complète 20261108130000_supervision.sql sans rien retirer :
--   · `sante()` : point de contrôle public en GET, pour un service de surveillance externe (UptimeRobot, Better Stack) ;
--   · `passer_limite` répond désormais HTTP 429 (+ Retry-After) quand une limite est atteinte, sans lever d'erreur
--     (une erreur annulerait la trace du blocage) ;
--   · déploiements vus par le robot et l'admin (version + date de build) ;
--   · événements techniques : clé admin erronée, compte admin bloqué, déploiement, sauvegarde faite par script ;
--   · état par service (opérationnel, dégradé, indisponible, inconnu) et journal unifié avec filtres ;
--   · alertes du robot : lenteur répétée, sauvegarde trop ancienne, restauration jamais testée.
-- Aucune donnée personnelle n'est ajoutée : messages nettoyés, visiteurs réduits à une empreinte tronquée.

-- ── Seuils de lenteur (ms) : au-delà, le service est « dégradé » même s'il répond ─────────────────
-- Mesures faites depuis GitHub Actions (États-Unis) ou depuis le navigateur de l'admin : le seuil garde de la marge.
create or replace function public.seuil_lent_ms(cible text) returns integer
language sql immutable set search_path = '' as $$
  select case
    when cible like 'site :%' then 3000      -- une page statique servie par le CDN répond d'habitude en moins d'1 s
    when cible like 'base :%' then 2000      -- API REST et Auth de Supabase
    when cible like 'stockage :%' then 3000  -- une photo du catalogue
    else 5000                                -- services externes (WhatsApp)
  end
$$;
revoke all on function public.seuil_lent_ms(text) from public, anon, authenticated;

-- ── Point de santé public, en GET : /rest/v1/rpc/sante?apikey=<clé publique> ──────────────────────
-- Prouve en une requête que l'API répond ET que la base lit une table. Ne renvoie aucune donnée de la boutique.
-- Si la base est arrêtée, l'API renvoie une erreur 5xx : le service externe le voit et alerte.
drop function if exists public.sante();
-- `apikey` est accepté et ignoré : un service de surveillance passe souvent la clé publique dans l'adresse.
create or replace function public.sante(apikey text default null) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', true, 'base', 'ok', 'reglages_lisibles', (select count(*) from (select 1 from public.reglages limit 1) x) >= 0, 'heure', now())
$$;
revoke all on function public.sante(text) from public;
grant execute on function public.sante(text) to anon, authenticated;

-- ── Limites : même comptage qu'avant, mais réponse HTTP 429 quand c'est bloqué ────────────────────
-- `response.status` et `response.headers` sont lus par l'API (PostgREST) à la fin de la transaction.
create or replace function public.passer_limite(p_action text) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  l public.limites;
  e text := public.empreinte_visiteur();
  n integer;
  total integer := 0;
  est_bloque boolean;
begin
  select * into l from public.limites where action = p_action;
  if not found then return true; end if;
  delete from public.limites_evenements where cree_le < now() - interval '30 days';
  select count(*) into n from public.limites_evenements
   where action = p_action and empreinte = e and not limites_evenements.bloque and cree_le > now() - make_interval(mins => l.fenetre_minutes);
  if l.maximum_global is not null then
    select count(*) into total from public.limites_evenements
     where action = p_action and not limites_evenements.bloque and cree_le > now() - make_interval(mins => l.fenetre_minutes);
  end if;
  est_bloque := n >= l.maximum or (l.maximum_global is not null and total >= l.maximum_global);
  insert into public.limites_evenements (action, empreinte, bloque) values (p_action, e, est_bloque);
  if est_bloque then
    perform set_config('response.status', '429', true);
    perform set_config('response.headers', format('[{"Retry-After": "%s"}]', l.fenetre_minutes * 60), true);
  end if;
  return not est_bloque;
end $$;
revoke all on function public.passer_limite(text) from public, anon, authenticated;

-- ── Événements techniques ─────────────────────────────────────────────────────────────────────────
create table if not exists public.evenements_techniques (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  categorie text not null check (categorie in ('securite', 'deploiement', 'sauvegarde', 'base')),
  gravite text not null check (gravite in ('info', 'avertissement', 'erreur', 'critique')),
  message text not null check (char_length(message) between 1 and 300),
  detail text not null default '' check (char_length(detail) <= 500)
);
create index if not exists evenements_techniques_date on public.evenements_techniques (cree_le desc);
alter table public.evenements_techniques enable row level security;
drop policy if exists "événements : lecture technique" on public.evenements_techniques;
create policy "événements : lecture technique" on public.evenements_techniques for select to authenticated using ((select public.est_admin_technique()));
revoke all on public.evenements_techniques from anon;
revoke insert, update, delete on public.evenements_techniques from authenticated;

create or replace function public.noter_evenement(p_categorie text, p_gravite text, p_message text, p_detail text default '') returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  delete from public.evenements_techniques where cree_le < now() - interval '90 days';
  insert into public.evenements_techniques (categorie, gravite, message, detail)
  values (p_categorie, p_gravite, left(public.nettoyer_texte(p_message, 300), 300), public.nettoyer_texte(p_detail, 500));
end $$;
revoke all on function public.noter_evenement(text, text, text, text) from public, anon, authenticated;

-- Clé admin erronée, puis compte bloqué 15 min : visibles dans le journal (sans l'identité du compte).
create or replace function public.evenement_cle_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.bloque_jusqua is not null and (tg_op = 'INSERT' or old.bloque_jusqua is distinct from new.bloque_jusqua) then
    perform public.noter_evenement('securite', 'critique', 'Accès admin bloqué 15 min après 5 clés erronées');
  elsif new.echecs > coalesce(case when tg_op = 'UPDATE' then old.echecs end, 0) then
    perform public.noter_evenement('securite', 'avertissement', format('Clé de sécurité admin erronée (essai %s sur 5)', new.echecs));
  end if;
  return new;
end $$;
drop trigger if exists evenement_cle_admin on public.admin_essais;
create trigger evenement_cle_admin after insert or update on public.admin_essais for each row execute function public.evenement_cle_admin();

-- ── Déploiements : chaque nouvelle version vue en ligne ───────────────────────────────────────────
create table if not exists public.deploiements (
  version text primary key check (char_length(version) between 1 and 60),
  construit_le timestamptz,
  vu_le timestamptz not null default now()
);
alter table public.deploiements enable row level security;
drop policy if exists "déploiements : lecture technique" on public.deploiements;
create policy "déploiements : lecture technique" on public.deploiements for select to authenticated using ((select public.est_admin_technique()));
revoke all on public.deploiements from anon;
revoke insert, update, delete on public.deploiements from authenticated;

create or replace function public.noter_version(r jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v text := left(coalesce(r ->> 'version', ''), 60); c timestamptz;
begin
  if v !~ '^[A-Za-z0-9._-]{1,60}$' then return; end if;
  begin c := (r ->> 'construit_le')::timestamptz; exception when others then c := null; end;
  insert into public.deploiements (version, construit_le) values (v, c) on conflict (version) do nothing;
  if found then perform public.noter_evenement('deploiement', 'info', format('Nouvelle version en ligne : %s', v), coalesce('construite le ' || c::text, '')); end if;
end $$;
revoke all on function public.noter_version(jsonb) from public, anon, authenticated;

-- ── Jeton du robot (factorisé) ────────────────────────────────────────────────────────────────────
create or replace function public.jeton_robot_valide(jeton text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare empreinte text;
begin
  select hash into empreinte from public.robot_jeton where id = 1;
  return empreinte is not null and coalesce(jeton, '') <> '' and extensions.crypt(jeton, empreinte) = empreinte;
end $$;
revoke all on function public.jeton_robot_valide(text) from public, anon, authenticated;

-- ── Robot : mêmes contrôles qu'avant + version, lenteur répétée, sauvegardes ──────────────────────
create or replace function public.enregistrer_controles(jeton text, resultats jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r jsonb;
  alertes jsonb := '[]'::jsonb;
  n integer;
  heure_locale timestamp := now() at time zone 'Africa/Casablanca';
  derniere timestamptz;
begin
  if not public.passer_limite('controle_robot') then
    return jsonb_build_object('ok', false, 'message', 'Trop d''envois.');
  end if;
  if not public.jeton_robot_valide(jeton) then
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
    if r ? 'version' then perform public.noter_version(r); end if;
    if not coalesce((r ->> 'ok')::boolean, false) then
      alertes := alertes || jsonb_build_array(format('%s en échec : %s', r ->> 'cible', coalesce(r ->> 'detail', '')));
    else
      -- Dégradé : les 3 derniers passages du robot sur ce contrôle dépassent le seuil de lenteur.
      select count(*) into n from (
        select duree_ms from public.controles_sante where source = 'robot' and cible = left(r ->> 'cible', 60)
        order by cree_le desc limit 3) x
       where x.duree_ms > public.seuil_lent_ms(r ->> 'cible');
      if n = 3 then alertes := alertes || jsonb_build_array(format('%s lent : plus de %s ms trois fois de suite', r ->> 'cible', public.seuil_lent_ms(r ->> 'cible'))); end if;
    end if;
  end loop;
  -- Activité suspecte depuis 30 min : blocages de limite, erreurs du site en rafale, clé admin.
  select count(*) into n from public.limites_evenements where bloque and cree_le > now() - interval '30 minutes';
  if n >= 10 then alertes := alertes || jsonb_build_array(format('%s requêtes bloquées par les limites en 30 min', n)); end if;
  select count(*) into n from public.erreurs_site where cree_le > now() - interval '30 minutes';
  if n >= 50 then alertes := alertes || jsonb_build_array(format('%s erreurs du site en 30 min', n)); end if;
  select count(*) into n from public.evenements_techniques where categorie = 'securite' and gravite = 'critique' and cree_le > now() - interval '30 minutes';
  if n > 0 then alertes := alertes || jsonb_build_array('Accès admin bloqué après des clés erronées (30 dernières minutes)'); end if;
  -- Sauvegardes : rappel une fois par jour (passage de 9 h, heure du Maroc), pas toutes les 30 min.
  if extract(hour from heure_locale) = 9 and extract(minute from heure_locale) < 30 then
    select max(cree_le) into derniere from public.sauvegardes where type = 'manuelle';
    if derniere is null or derniere < now() - interval '8 days' then
      alertes := alertes || jsonb_build_array('Aucune sauvegarde de la base depuis plus de 8 jours');
    end if;
    select max(cree_le) into derniere from public.sauvegardes where type = 'restauration_testee';
    if derniere is null or derniere < now() - interval '35 days' then
      alertes := alertes || jsonb_build_array('Restauration de sauvegarde non testée depuis plus de 35 jours');
    end if;
  end if;
  return jsonb_build_object('ok', true, 'alertes', alertes);
end $$;
revoke all on function public.enregistrer_controles(text, jsonb) from public;
grant execute on function public.enregistrer_controles(text, jsonb) to anon, authenticated;

-- Admin technique (contrôle depuis son navigateur) : + version vue.
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
    if r ? 'version' then perform public.noter_version(r); end if;
  end loop;
end $$;
revoke all on function public.noter_controles(jsonb) from public;
grant execute on function public.noter_controles(jsonb) to authenticated;

-- ── Sauvegarde faite ou restauration testée par les scripts (npm run sauvegarde / sauvegarde:tester) ──
alter table public.sauvegardes drop constraint if exists sauvegardes_type_check;
alter table public.sauvegardes add constraint sauvegardes_type_check check (type in ('manuelle', 'restauration_testee', 'echec'));
create or replace function public.noter_sauvegarde_script(jeton text, p_type text, p_note text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.passer_limite('controle_robot') then return jsonb_build_object('ok', false, 'message', 'Trop d''envois.'); end if;
  if not public.jeton_robot_valide(jeton) then return jsonb_build_object('ok', false, 'message', 'Jeton refusé.'); end if;
  if p_type not in ('manuelle', 'restauration_testee', 'echec') then return jsonb_build_object('ok', false, 'message', 'Type invalide.'); end if;
  insert into public.sauvegardes (auteur, type, note) values (null, p_type, '[script] ' || left(public.nettoyer_texte(p_note, 280), 280));
  perform public.noter_evenement('sauvegarde', case when p_type = 'echec' then 'erreur' else 'info' end,
    case p_type when 'manuelle' then 'Sauvegarde de la base faite par le script' when 'restauration_testee' then 'Restauration testée par le script' else 'Échec du script de sauvegarde' end,
    p_note);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.noter_sauvegarde_script(text, text, text) from public;
grant execute on function public.noter_sauvegarde_script(text, text, text) to anon, authenticated; -- le jeton fait foi

-- ── État des services : un statut honnête par contrôle ────────────────────────────────────────────
-- inconnu : aucun contrôle depuis 75 min (le robot passe toutes les 30 min) ; indisponible : le dernier a échoué ;
-- dégradé : il répond mais trop lentement, ou il a échoué au moins une fois dans les 6 dernières heures.
create or replace function public.etat_supervision() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare res jsonb;
begin
  if not public.est_admin_technique() then raise exception 'Réservé à la supervision technique.' using errcode = '42501'; end if;
  with derniers as (
    select distinct on (cible) cible, cree_le, ok, duree_ms, statut_http, detail, source
    from public.controles_sante order by cible, cree_le desc
  ), stats as (
    select cible,
      count(*) filter (where cree_le > now() - interval '24 hours') as n24,
      count(*) filter (where cree_le > now() - interval '24 hours' and ok) as ok24,
      count(*) filter (where cree_le > now() - interval '7 days') as n7,
      count(*) filter (where cree_le > now() - interval '7 days' and ok) as ok7,
      round(avg(duree_ms) filter (where cree_le > now() - interval '24 hours' and ok))::integer as moyenne24,
      (percentile_cont(0.95) within group (order by duree_ms) filter (where cree_le > now() - interval '24 hours' and ok))::integer as p95_24,
      count(*) filter (where cree_le > now() - interval '6 hours' and not ok) as echecs6h
    from public.controles_sante group by cible
  )
  select jsonb_build_object(
    'services', (select coalesce(jsonb_agg(jsonb_build_object(
        'cible', d.cible, 'dernier', d.cree_le, 'source', d.source, 'ok', d.ok, 'duree_ms', d.duree_ms, 'statut_http', d.statut_http, 'detail', d.detail,
        'seuil_ms', public.seuil_lent_ms(d.cible),
        'controles_24h', s.n24, 'disponibilite_24h', case when s.n24 > 0 then round(100.0 * s.ok24 / s.n24, 1) end,
        'controles_7j', s.n7, 'disponibilite_7j', case when s.n7 > 0 then round(100.0 * s.ok7 / s.n7, 1) end,
        'moyenne_ms_24h', s.moyenne24, 'p95_ms_24h', s.p95_24,
        'statut', case
          when d.cree_le < now() - interval '75 minutes' then 'inconnu'
          when not d.ok then 'indisponible'
          when d.duree_ms > public.seuil_lent_ms(d.cible) or s.echecs6h > 0 then 'degrade'
          else 'operationnel' end
      ) order by d.cible), '[]'::jsonb) from derniers d join stats s using (cible)),
    'tendance', (select coalesce(jsonb_agg(x order by x.heure), '[]'::jsonb) from (
        select date_trunc('hour', cree_le) as heure,
          round(avg(duree_ms) filter (where cible like 'site :%' and ok))::integer as site_ms,
          round(avg(duree_ms) filter (where cible like 'base :%' and ok))::integer as base_ms,
          count(*) filter (where not ok) as echecs, count(*) as controles
        from public.controles_sante where cree_le > now() - interval '48 hours' group by 1) x),
    'dernier_robot', (select max(cree_le) from public.controles_sante where source = 'robot'),
    'deploiements', (select coalesce(jsonb_agg(x order by x.vu_le desc), '[]'::jsonb) from (select version, construit_le, vu_le from public.deploiements order by vu_le desc limit 10) x),
    'sauvegardes', jsonb_build_object(
      'derniere', (select max(cree_le) from public.sauvegardes where type = 'manuelle'),
      'derniere_restauration', (select max(cree_le) from public.sauvegardes where type = 'restauration_testee'),
      'dernier_echec', (select max(cree_le) from public.sauvegardes where type = 'echec')),
    'compteurs_24h', jsonb_build_object(
      'erreurs', (select count(*) from public.erreurs_site where cree_le > now() - interval '24 hours'),
      'erreurs_api', (select count(*) from public.erreurs_site where type = 'api' and cree_le > now() - interval '24 hours'),
      'controles_en_echec', (select count(*) from public.controles_sante where not ok and cree_le > now() - interval '24 hours'),
      'appels_publics', (select count(*) from public.limites_evenements where not bloque and cree_le > now() - interval '24 hours'),
      'appels_bloques', (select count(*) from public.limites_evenements where bloque and cree_le > now() - interval '24 hours'),
      'securite', (select count(*) from public.evenements_techniques where categorie = 'securite' and cree_le > now() - interval '24 hours')),
    'appels_par_action_24h', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
        select action, count(*) filter (where not bloque) as acceptes, count(*) filter (where bloque) as bloques
        from public.limites_evenements where cree_le > now() - interval '24 hours' group by action order by action) x)
  ) into res;
  return res;
end $$;
revoke all on function public.etat_supervision() from public;
grant execute on function public.etat_supervision() to authenticated;

-- ── Journal technique unifié, filtrable ───────────────────────────────────────────────────────────
-- p_heures : période (1 à 2160 h, 90 jours) ; p_categorie : site, api, sante, securite, deploiement, sauvegarde ou null ;
-- p_gravite : info, avertissement, erreur, critique ou null. 300 lignes au plus, les plus récentes d'abord.
create or replace function public.journal_technique(p_heures integer default 24, p_categorie text default null, p_gravite text default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  depuis timestamptz := now() - make_interval(hours => least(greatest(coalesce(p_heures, 24), 1), 2160));
  res jsonb;
begin
  if not public.est_admin_technique() then raise exception 'Réservé à la supervision technique.' using errcode = '42501'; end if;
  with tout as (
    select cree_le as quand, case when type = 'api' then 'api' else 'site' end as categorie, gravite,
           'navigateur' as origine, message, concat_ws(' · ', nullif(page, ''), nullif(source, ''), nullif(version, ''), nullif(navigateur, '')) as detail
      from public.erreurs_site where cree_le > depuis
    union all
    select cree_le, 'sante',
           case when not ok and cible like 'base :%' then 'critique' when not ok then 'erreur' else 'avertissement' end,
           source, case when not ok then cible || ' en échec' else cible || ' lent' end,
           concat_ws(' · ', 'HTTP ' || statut_http, duree_ms || ' ms', nullif(detail, ''))
      from public.controles_sante where cree_le > depuis and (not ok or duree_ms > public.seuil_lent_ms(cible))
    union all
    select cree_le, 'securite', 'avertissement', 'limites', 'Requête bloquée : ' || action, 'visiteur ' || left(empreinte, 10) || '…'
      from public.limites_evenements where bloque and cree_le > depuis
    union all
    select cree_le, categorie, gravite, 'base', message, detail from public.evenements_techniques where cree_le > depuis
    union all
    select cree_le, 'sauvegarde', case when type = 'echec' then 'erreur' else 'info' end, 'admin',
           case type when 'manuelle' then 'Sauvegarde notée' when 'restauration_testee' then 'Restauration testée' else 'Échec de sauvegarde' end, note
      from public.sauvegardes where cree_le > depuis and note not like '[script]%'
  )
  select coalesce(jsonb_agg(t order by t.quand desc), '[]'::jsonb) into res from (
    select * from tout
     where (p_categorie is null or categorie = p_categorie) and (p_gravite is null or gravite = p_gravite)
     order by quand desc limit 300) t;
  return res;
end $$;
revoke all on function public.journal_technique(integer, text, text) from public;
grant execute on function public.journal_technique(integer, text, text) to authenticated;
