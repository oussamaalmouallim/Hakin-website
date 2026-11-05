-- H MODE — lot 19 : favoris en base. À coller une fois dans le SQL Editor du projet Supabase en ligne.
-- Sans danger à relancer (if not exists / drop policy if exists). Même contenu que la section « Favoris » de schema.sql.
create table if not exists public.favoris (
  utilisateur uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slug text not null check (char_length(slug) between 1 and 120),
  cree_le timestamptz not null default now(),
  primary key (utilisateur, slug)
);
alter table public.favoris enable row level security;
drop policy if exists "favoris : tout sur les siens" on public.favoris;
create policy "favoris : tout sur les siens" on public.favoris for all to authenticated
  using (utilisateur = (select auth.uid())) with check (utilisateur = (select auth.uid()));
revoke all on public.favoris from anon;
revoke update on public.favoris from authenticated;
