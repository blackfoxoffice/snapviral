-- Newsflow Studio — initial schema
-- See apps/api/src and packages/shared for the type definitions that mirror this.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- profiles: extends auth.users with app fields
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- projects
do $$ begin
  create type project_status as enum ('draft', 'queued', 'running', 'ready', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_language as enum ('ta', 'en', 'hi');
exception when duplicate_object then null; end $$;

do $$ begin
  create type input_mode as enum ('urls', 'script', 'topic');
exception when duplicate_object then null; end $$;

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  topic text,
  language project_language not null default 'ta',
  duration_seconds int not null check (duration_seconds between 10 and 120),
  input_mode input_mode not null default 'urls',
  source_urls text[],
  user_script text,
  status project_status not null default 'draft',
  current_step text,
  progress_pct int not null default 0,
  final_video_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint input_present check (
    (input_mode = 'urls'   and source_urls is not null and array_length(source_urls, 1) >= 1) or
    (input_mode = 'script' and user_script is not null and length(user_script) > 0) or
    (input_mode = 'topic'  and topic is not null and length(topic) > 0)
  )
);

create index if not exists projects_user_id_created_at_idx on public.projects(user_id, created_at desc);

-- pipeline_jobs
create table if not exists public.pipeline_jobs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  step text not null,
  status text not null,
  input jsonb,
  output jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists pipeline_jobs_project_id_created_at_idx
  on public.pipeline_jobs(project_id, created_at);

-- assets
do $$ begin
  create type asset_type as enum ('transcript', 'script', 'image', 'audio', 'subtitle', 'video');
exception when duplicate_object then null; end $$;

create table if not exists public.assets (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type asset_type not null,
  storage_path text,
  content jsonb,
  scene_index int,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assets_project_id_type_scene_idx
  on public.assets(project_id, type, scene_index);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.pipeline_jobs enable row level security;
alter table public.assets enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "users select own projects" on public.projects;
create policy "users select own projects" on public.projects
  for select using (auth.uid() = user_id);

drop policy if exists "users insert own projects" on public.projects;
create policy "users insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "users update own projects" on public.projects;
create policy "users update own projects" on public.projects
  for update using (auth.uid() = user_id);

drop policy if exists "users delete own projects" on public.projects;
create policy "users delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

drop policy if exists "users read own pipeline jobs" on public.pipeline_jobs;
create policy "users read own pipeline jobs" on public.pipeline_jobs
  for select using (
    exists (select 1 from public.projects p
            where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "users read own assets" on public.assets;
create policy "users read own assets" on public.assets
  for select using (
    exists (select 1 from public.projects p
            where p.id = project_id and p.user_id = auth.uid())
  );

-- Auto-provision a profile row on signup. full_name / phone come from the
-- `options.data` passed to supabase.auth.signUp on the client.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Storage: private bucket for generated artefacts.
insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', false)
on conflict (id) do nothing;

drop policy if exists "users read own project assets" on storage.objects;
create policy "users read own project assets" on storage.objects
  for select using (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
