-- ============================================================
-- Mod Chess — Supabase schema (run in the Supabase SQL editor)
-- Provides: profiles (username + ELO), matches, and realtime
-- move sync so two signed-in users can battle.
-- Auth is handled by Supabase GoTrue (email + password).
--
-- NOTE: This project previously hosted "uPath". The DROPs below
-- clear any leftover public tables so Mod Chess owns this DB.
-- ============================================================

-- 0) overwrite any previous project tables (uPath etc.)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.moves cascade;
drop table if exists public.matches cascade;
drop table if exists public.profiles cascade;

-- 1) public profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  elo int not null default 1200,
  wins int not null default 0,
  losses int not null default 0,
  draws int not null default 0,
  avatar text,
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- anyone can read usernames/ratings (needed for leaderboards)
create policy "profiles are readable" on public.profiles for select using (true);
-- a user edits only their own profile
create policy "own profile editable" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, elo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    1200
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) matches
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  white uuid references public.profiles(id),
  black uuid references public.profiles(id),
  status text not null default 'playing',   -- playing | finished
  winner text,                              -- 'w' | 'b' | 'draw'
  reason text,
  created_at timestamptz default now(),
  finished_at timestamptz
);
alter table public.matches enable row level security;
create policy "matches readable" on public.matches for select using (true);
create policy "players create matches" on public.matches for insert with check (auth.uid() in (white, black));
create policy "players update matches" on public.matches for update using (auth.uid() in (white, black));

-- 3) realtime moves (one row per action so both clients stay in sync)
create table if not exists public.moves (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  seq int not null,
  side text not null,          -- 'w' | 'b'
  kind text not null,          -- 'move' | 'ability' | 'result'
  payload jsonb not null,      -- {from,to,promo} or {abilityId,target} ...
  created_at timestamptz default now(),
  unique (match_id, seq)
);
alter table public.moves enable row level security;
create policy "moves readable" on public.moves for select using (true);
create policy "players insert moves" on public.moves for insert with check (
  exists (select 1 from public.matches m where m.id = match_id and auth.uid() in (m.white, m.black))
);

-- replicate the whole 'moves' + 'matches' tables to clients (for live games)
alter publication supabase_realtime add table public.moves;
alter publication supabase_realtime add table public.matches;

-- optional index for history queries
create index if not exists moves_match_seq on public.moves(match_id, seq);
create index if not exists matches_players on public.matches(white, black, created_at desc);
