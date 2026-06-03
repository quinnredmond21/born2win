-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  sport text,
  position text,
  tier text not null default 'free' check (tier in ('free', 'paid')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  is_coach boolean not null default false,
  created_at timestamptz not null default now()
);

-- Workouts
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  exercises jsonb not null default '[]',
  tier text not null default 'paid' check (tier in ('free', 'paid')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Programs
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  schedule jsonb not null default '{}',
  tier text not null default 'paid' check (tier in ('free', 'paid')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Challenges
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  metric text not null,
  metric_label text not null,
  metric_direction text not null default 'asc' check (metric_direction in ('asc', 'desc')),
  instructions text not null,
  how_to_record text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Challenge submissions (one per athlete per challenge)
create table public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score numeric not null,
  submitted_at timestamptz not null default now(),
  unique(challenge_id, user_id)
);

-- Baseline entries
create table public.baseline_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  metric text not null check (metric in (
    'forty_yard', 'pro_agility', 'vertical_jump', 'broad_jump',
    'shuttle_300', 'mile_run', 'pushups_60', 'situps_60',
    'squat_pr', 'power_clean_pr', 'bench_pr',
    'weight_current', 'weight_target'
  )),
  value numeric not null,
  unit text not null,
  logged_at timestamptz not null default now()
);

-- Workout logs
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  completed_at timestamptz not null default now()
);

-- Row-level security
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.programs enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.baseline_entries enable row level security;
alter table public.workout_logs enable row level security;

-- Profiles policies
create policy "Athletes read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Coaches read all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

create policy "Athletes update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Workouts policies
create policy "Anyone reads free workouts"
  on public.workouts for select
  using (tier = 'free');

create policy "Paid users read paid workouts"
  on public.workouts for select
  using (
    tier = 'paid' and exists (
      select 1 from public.profiles where id = auth.uid() and (tier = 'paid' or is_coach = true)
    )
  );

create policy "Coaches manage workouts"
  on public.workouts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Programs policies
create policy "Anyone reads free programs"
  on public.programs for select
  using (tier = 'free');

create policy "Paid users read paid programs"
  on public.programs for select
  using (
    tier = 'paid' and exists (
      select 1 from public.profiles where id = auth.uid() and (tier = 'paid' or is_coach = true)
    )
  );

create policy "Coaches manage programs"
  on public.programs for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Challenges policies
create policy "Anyone reads challenges"
  on public.challenges for select
  using (true);

create policy "Coaches manage challenges"
  on public.challenges for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Challenge submissions policies
create policy "Paid users submit challenges"
  on public.challenge_submissions for insert
  with check (
    auth.uid() = user_id and exists (
      select 1 from public.profiles where id = auth.uid() and tier = 'paid'
    )
  );

create policy "Anyone reads submissions"
  on public.challenge_submissions for select
  using (true);

-- Baseline entries policies
create policy "Athletes manage own baselines"
  on public.baseline_entries for all
  using (auth.uid() = user_id);

create policy "Coaches read all baselines"
  on public.baseline_entries for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Workout logs policies
create policy "Athletes manage own workout logs"
  on public.workout_logs for all
  using (auth.uid() = user_id);

create policy "Coaches read all workout logs"
  on public.workout_logs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
