-- =============================================
-- 교집합 DB Schema
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. 프로필 (auth.users 연동)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  user_type text not null check (user_type in ('teacher', 'institution')),
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;
create policy "Public read" on public.profiles for select using (true);
create policy "Own insert" on public.profiles for insert with check (auth.uid() = id);
create policy "Own update" on public.profiles for update using (auth.uid() = id);

-- 2. 구직자 프로필
create table public.teacher_profiles (
  id uuid references public.profiles on delete cascade primary key,
  name text not null,
  birth_date date not null,
  address text not null,
  phone text not null,
  photo_url text,
  affiliation text,
  created_at timestamptz default now() not null
);

alter table public.teacher_profiles enable row level security;
create policy "Public read" on public.teacher_profiles for select using (true);
create policy "Own insert" on public.teacher_profiles for insert with check (auth.uid() = id);
create policy "Own update" on public.teacher_profiles for update using (auth.uid() = id);

-- 3. 구인자(기관) 프로필
create table public.institution_profiles (
  id uuid references public.profiles on delete cascade primary key,
  name text not null,
  type text not null,
  address text not null,
  address_short text not null,
  phone text not null,
  business_number text not null,
  registration_number text,
  email text not null,
  director_name text not null default '',
  purpose text[] default '{}',
  description text,
  student_count int,
  class_count int,
  evaluation_grade text check (evaluation_grade in ('A', 'B', 'C', 'D')),
  photos text[] default '{}',
  lat double precision,
  lng double precision,
  created_at timestamptz default now() not null
);

alter table public.institution_profiles enable row level security;
create policy "Public read" on public.institution_profiles for select using (true);
create policy "Own insert" on public.institution_profiles for insert with check (auth.uid() = id);
create policy "Own update" on public.institution_profiles for update using (auth.uid() = id);

-- 4. 공고 (기관당 1개)
create table public.postings (
  id uuid default gen_random_uuid() primary key,
  institution_id uuid references public.institution_profiles on delete cascade not null unique,
  title text not null,
  description text not null default '',
  deadline date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.postings enable row level security;
create policy "Public read" on public.postings for select using (true);
create policy "Owner insert" on public.postings for insert with check (auth.uid() = institution_id);
create policy "Owner update" on public.postings for update using (auth.uid() = institution_id);
create policy "Owner delete" on public.postings for delete using (auth.uid() = institution_id);

-- 5. 포지션 엔트리
create table public.position_entries (
  id uuid default gen_random_uuid() primary key,
  posting_id uuid references public.postings on delete cascade not null,
  position text not null,
  age_group text not null default '무관',
  headcount int not null default 1,
  employment_type text not null default '정규직',
  salary text not null default '',
  salary_negotiable boolean default false,
  work_hours text not null default '',
  benefits text[] default '{}',
  requirements text[] default '{}',
  preferred text[] default '{}',
  has_vacation boolean default false,
  vacation_info text,
  insurance_provided boolean default true,
  retirement_pay_provided boolean default true,
  meal_provided boolean default false,
  custom_questions text[] default '{}',
  created_at timestamptz default now() not null
);

alter table public.position_entries enable row level security;
create policy "Public read" on public.position_entries for select using (true);
create policy "Owner insert" on public.position_entries for insert
  with check (exists (select 1 from public.postings where id = posting_id and institution_id = auth.uid()));
create policy "Owner update" on public.position_entries for update
  using (exists (select 1 from public.postings where id = posting_id and institution_id = auth.uid()));
create policy "Owner delete" on public.position_entries for delete
  using (exists (select 1 from public.postings where id = posting_id and institution_id = auth.uid()));

-- 6. 이력서
create table public.resumes (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.teacher_profiles on delete cascade not null unique,
  photo_url text,
  name text not null,
  birth_date date not null,
  phone text not null,
  certificates jsonb default '[]',
  affiliation text,
  experiences jsonb default '[]',
  introduction text not null default '',
  portfolio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.resumes enable row level security;
create policy "Public read" on public.resumes for select using (true);
create policy "Own insert" on public.resumes for insert with check (auth.uid() = teacher_id);
create policy "Own update" on public.resumes for update using (auth.uid() = teacher_id);

-- 7. 지원서
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  posting_id uuid references public.postings on delete cascade not null,
  position_entry_id uuid references public.position_entries on delete cascade not null,
  teacher_id uuid references public.teacher_profiles on delete cascade not null,
  resume_id uuid references public.resumes on delete cascade not null,
  message text not null default '',
  answers text[] default '{}',
  status text not null default '검토중' check (status in ('검토중', '면접요청', '합격', '불합격')),
  applied_at timestamptz default now() not null,
  unique (position_entry_id, teacher_id)
);

alter table public.applications enable row level security;
create policy "Teacher read own" on public.applications for select
  using (auth.uid() = teacher_id);
create policy "Institution read" on public.applications for select
  using (exists (select 1 from public.postings where id = posting_id and institution_id = auth.uid()));
create policy "Teacher insert" on public.applications for insert
  with check (auth.uid() = teacher_id);
create policy "Institution update status" on public.applications for update
  using (exists (select 1 from public.postings where id = posting_id and institution_id = auth.uid()));

-- 8. 알림
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  link text not null default '/',
  read boolean default false,
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;
create policy "Own read" on public.notifications for select using (auth.uid() = user_id);
create policy "Own update" on public.notifications for update using (auth.uid() = user_id);
create policy "Insert" on public.notifications for insert with check (true);

-- 9. 자동 updated_at 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger postings_updated_at before update on public.postings
  for each row execute function update_updated_at();

create trigger resumes_updated_at before update on public.resumes
  for each row execute function update_updated_at();

-- 10. 새 유저 가입 시 프로필 자동 생성 함수
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, user_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'user_type', 'teacher')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage buckets (run separately or via dashboard)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', true);
