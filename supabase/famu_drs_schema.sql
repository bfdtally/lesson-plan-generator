create extension if not exists pgcrypto;

create schema if not exists app_private;

create table if not exists public.schools (
  id text primary key check (id in ('elementary', 'middle', 'high')),
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.schools (id, name)
values
  ('elementary', 'FAMU DRS Elementary School'),
  ('middle', 'FAMU DRS Middle School'),
  ('high', 'FAMU DRS High School')
on conflict (id) do update set name = excluded.name;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role text not null check (role in ('teacher', 'school_admin', 'super_admin')),
  school_id text references public.schools(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_required_for_non_super_admin
    check (role = 'super_admin' or school_id is not null)
);

create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  school_id text not null references public.schools(id),
  school_name text not null,
  teacher_user_id uuid references auth.users(id),
  teacher_name text not null,
  class_name text not null,
  subject text not null,
  unit text not null,
  lesson text not null,
  grade_level text not null,
  standards_state text not null default 'Florida',
  lesson_description text not null,
  resources text,
  lesson_plan jsonb not null,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'reviewed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_plans_school_created_idx
  on public.lesson_plans (school_id, created_at desc);

create index if not exists lesson_plans_teacher_created_idx
  on public.lesson_plans (teacher_name, created_at desc);

create or replace function app_private.current_profile_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function app_private.current_profile_school_id()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select school_id from public.profiles where id = (select auth.uid());
$$;

revoke all on function app_private.current_profile_role() from public;
revoke all on function app_private.current_profile_school_id() from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.current_profile_role() to authenticated;
grant execute on function app_private.current_profile_school_id() to authenticated;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.lesson_plans enable row level security;

drop policy if exists "Authenticated users can read schools" on public.schools;
create policy "Authenticated users can read schools"
on public.schools
for select
to authenticated
using (true);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Super admins can read all profiles" on public.profiles;
create policy "Super admins can read all profiles"
on public.profiles
for select
to authenticated
using (app_private.current_profile_role() = 'super_admin');

drop policy if exists "School admins can read lessons for their school" on public.lesson_plans;
create policy "School admins can read lessons for their school"
on public.lesson_plans
for select
to authenticated
using (
  app_private.current_profile_role() = 'super_admin'
  or (
    app_private.current_profile_role() = 'school_admin'
    and school_id = app_private.current_profile_school_id()
  )
  or teacher_user_id = (select auth.uid())
);

drop policy if exists "Teachers can insert their own lessons" on public.lesson_plans;
create policy "Teachers can insert their own lessons"
on public.lesson_plans
for insert
to authenticated
with check (
  teacher_user_id = (select auth.uid())
  and school_id = app_private.current_profile_school_id()
);

drop policy if exists "School admins can update review status for their school" on public.lesson_plans;
create policy "School admins can update review status for their school"
on public.lesson_plans
for update
to authenticated
using (
  app_private.current_profile_role() = 'super_admin'
  or (
    app_private.current_profile_role() = 'school_admin'
    and school_id = app_private.current_profile_school_id()
  )
)
with check (
  app_private.current_profile_role() = 'super_admin'
  or (
    app_private.current_profile_role() = 'school_admin'
    and school_id = app_private.current_profile_school_id()
  )
);
