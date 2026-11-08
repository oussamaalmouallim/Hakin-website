-- H MODE — republication automatique des aperçus de partage (lot E, 08/11/2026). Rejouable.
-- Les pages d'aperçu des fiches (titre, prix, image) sont écrites au build. Quand une pièce change dans l'admin après
-- le dernier build, le robot « Surveillance » relance un build Netlify (build hook gardé en secret dans GitHub, jamais
-- dans le site). Cette fonction dit au robot s'il faut le faire, et note chaque relance : au plus une toutes les 12 h,
-- car chaque déploiement consomme des crédits Netlify (offre gratuite : quota mensuel, site en pause au-delà).

create table if not exists public.republications (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  raison text not null default '' check (char_length(raison) <= 200)
);
alter table public.republications enable row level security;
drop policy if exists "republications : lecture technique" on public.republications;
create policy "republications : lecture technique" on public.republications for select to authenticated using ((select public.est_admin_technique()));
revoke all on public.republications from anon;
revoke insert, update, delete on public.republications from authenticated;

create or replace function public.republication_necessaire(jeton text, construit_le timestamptz) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  empreinte text;
  modifie timestamptz;
  derniere timestamptz;
begin
  select hash into empreinte from public.robot_jeton where id = 1;
  if empreinte is null or coalesce(jeton, '') = '' or extensions.crypt(jeton, empreinte) <> empreinte then return false; end if;
  select max(maj_le) into modifie from public.produits;
  select max(cree_le) into derniere from public.republications;
  if modifie is null or construit_le is null or modifie <= construit_le then return false; end if;
  if derniere is not null and derniere > now() - interval '12 hours' then return false; end if; -- au plus un build toutes les 12 h
  insert into public.republications (raison) values (format('catalogue modifié le %s, build du %s', modifie, construit_le));
  return true;
end $$;
revoke all on function public.republication_necessaire(text, timestamptz) from public;
grant execute on function public.republication_necessaire(text, timestamptz) to anon, authenticated;
