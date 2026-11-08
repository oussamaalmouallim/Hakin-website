-- H MODE — demandes de renseignement par WhatsApp (lot D, 08/11/2026). Rejouable.
-- Quand un visiteur clique « Demander prix et disponibilité » (ou un autre bouton WhatsApp d'une fiche), le site note
-- la pièce, le coloris et la taille choisis. Ce n'est PAS une commande : le site sait que WhatsApp a été ouvert,
-- pas que le message est parti. L'admin les traite comme des contacts commerciaux (à traiter, traitée, sans suite).
-- Aucune donnée personnelle : le client se fait connaître sur WhatsApp, pas ici.

create table if not exists public.demandes_whatsapp (
  id bigint generated always as identity primary key,
  cree_le timestamptz not null default now(),
  motif text not null check (motif in ('renseignement', 'commande', 'alerte_stock', 'conseil_taille')),
  slug text not null check (char_length(slug) between 1 and 120),
  nom_produit text not null check (char_length(nom_produit) between 1 and 200),
  coloris text not null default '' check (char_length(coloris) <= 60),
  taille text not null default '' check (char_length(taille) <= 20),
  prix_dh integer check (prix_dh is null or prix_dh >= 0),
  statut text not null default 'a_traiter' check (statut in ('a_traiter', 'traitee', 'sans_suite')),
  note text not null default '' check (char_length(note) <= 500),
  traitee_le timestamptz,
  empreinte text not null
);
create index if not exists demandes_whatsapp_date on public.demandes_whatsapp (cree_le desc);
alter table public.demandes_whatsapp enable row level security;
drop policy if exists "demandes : lecture admin" on public.demandes_whatsapp;
create policy "demandes : lecture admin" on public.demandes_whatsapp for select to authenticated using ((select public.est_admin()));
drop policy if exists "demandes : suivi admin" on public.demandes_whatsapp;
create policy "demandes : suivi admin" on public.demandes_whatsapp for update to authenticated
  using ((select public.est_admin())) with check ((select public.est_admin()));
revoke all on public.demandes_whatsapp from anon;
revoke insert, delete, update on public.demandes_whatsapp from authenticated;
grant select on public.demandes_whatsapp to authenticated;
grant update (statut, note, traitee_le) on public.demandes_whatsapp to authenticated; -- l'admin ne change que le suivi

-- Notée par le site au clic. Nom et prix lus en base quand la pièce y est (jamais ceux du navigateur) ; limite par visiteur.
create or replace function public.noter_demande_whatsapp(demande jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  m text := demande ->> 'motif';
  s text := left(coalesce(demande ->> 'slug', ''), 120);
  p record;
begin
  if m not in ('renseignement', 'commande', 'alerte_stock', 'conseil_taille') or s = '' then return; end if;
  select pr.nom, pr.prix_dh, pr.publie into p from public.produits pr where pr.slug = s;
  if not found or not p.publie then return; end if; -- pièce inconnue ou masquée : rien n'est noté
  if not public.passer_limite('demande_whatsapp') then return; end if;
  insert into public.demandes_whatsapp (motif, slug, nom_produit, coloris, taille, prix_dh, empreinte)
  values (m, s, p.nom, left(coalesce(demande ->> 'coloris', ''), 60), left(coalesce(demande ->> 'taille', ''), 20), p.prix_dh, public.empreinte_visiteur());
end $$;
revoke all on function public.noter_demande_whatsapp(jsonb) from public;
grant execute on function public.noter_demande_whatsapp(jsonb) to anon, authenticated;

-- Changement de suivi écrit au journal, comme les autres actions de l'administration.
create or replace function public.journal_demande() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.statut is distinct from old.statut then
    insert into public.journal_admin (auteur, auteur_email, action, cible, details)
    values (auth.uid(), coalesce((select email from auth.users where id = auth.uid()), ''), 'demande WhatsApp : ' || new.statut,
            'demande ' || new.id, jsonb_build_object('avant', old.statut, 'apres', new.statut, 'piece', new.slug));
  end if;
  return new;
end $$;
drop trigger if exists journal_demande on public.demandes_whatsapp;
create trigger journal_demande after update on public.demandes_whatsapp for each row execute function public.journal_demande();
