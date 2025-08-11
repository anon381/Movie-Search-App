-- Movie Search App Supabase Schema
-- Idempotent: safe to run multiple times.

-- EXTENSIONS -----------------------------------------------------------------
create extension if not exists pg_trgm;

-- PROFILES (optional user metadata) -------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = user_id);
drop policy if exists profiles_upsert_own on public.profiles;
create policy profiles_upsert_own on public.profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- FAVORITES ------------------------------------------------------------------
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id text not null,
  title text,
  poster text,
  created_at timestamptz default now(),
  primary key (user_id, movie_id)
);
alter table public.favorites enable row level security;
drop policy if exists favorites_select_own on public.favorites;
create policy favorites_select_own on public.favorites
  for select using (auth.uid() = user_id);
drop policy if exists favorites_upsert_own on public.favorites;
create policy favorites_upsert_own on public.favorites
  for insert with check (auth.uid() = user_id);
drop policy if exists favorites_delete_own on public.favorites;
create policy favorites_delete_own on public.favorites
  for delete using (auth.uid() = user_id);
create index if not exists favorites_user_created_idx on public.favorites(user_id, created_at desc);

-- SEARCH HISTORY --------------------------------------------------------------
create table if not exists public.search_history (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  year_filter text,
  type_filter text,
  result_count int,
  executed_at timestamptz default now()
);
alter table public.search_history enable row level security;
drop policy if exists sh_select_own on public.search_history;
create policy sh_select_own on public.search_history
  for select using (auth.uid() = user_id);
drop policy if exists sh_insert_own on public.search_history;
create policy sh_insert_own on public.search_history
  for insert with check (auth.uid() = user_id);
drop policy if exists sh_delete_own on public.search_history;
create policy sh_delete_own on public.search_history
  for delete using (auth.uid() = user_id);
create index if not exists sh_user_time_idx on public.search_history(user_id, executed_at desc);
create index if not exists sh_query_trgm_idx on public.search_history using gin (lower(query) gin_trgm_ops);

-- NEW USER PROFILE TRIGGER ----------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict do nothing;
  return new;
end;$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- OPTIONAL RETENTION (commented out) ------------------------------------------
-- delete from public.search_history
--   where id in (
--     select id from (
--       select id, row_number() over (partition by user_id order by executed_at desc) as rn
--       from public.search_history
--     ) t where rn > 500
--   );

-- End of schema
