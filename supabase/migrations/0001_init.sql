-- 연분(緣分) 초기 스키마 — docs/product-spec.md 기준
-- 적용: supabase db push 또는 SQL Editor에서 실행

-- ── 프로필 ─────────────────────────────────────────────
-- id는 자체 uuid, auth_id로 인증 계정과 연결한다 (null = 시드/데모 프로필).
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  handle text unique not null,       -- 앱 내부 참조용 슬러그 (p1, p2 …)
  nickname text not null,
  gender text not null check (gender in ('M', 'F')),
  birth_date date not null,          -- PASS 본인인증 값, 수정 불가(트리거로 보호)
  hour_branch smallint check (hour_branch between 0 and 11), -- null = 시간 미상
  hour_edits smallint not null default 0 check (hour_edits <= 2),
  job text,
  region text,
  intro text,
  tags text[] not null default '{}',
  photos text[] not null default '{}',  -- storage 경로
  verified_identity boolean not null default false,
  verified_job boolean not null default false,
  verified_school boolean not null default false,
  -- 만세력 계산 결과 캐시 (가입 시 1회 계산; 시드는 클라이언트 엔진이 계산)
  pillar_year smallint,              -- 육십갑자 index 0~59
  pillar_month smallint,
  pillar_day smallint,
  pillar_hour smallint,              -- null = 삼주
  demo_meta jsonb not null default '{}'::jsonb, -- 데모 표현용(아바타 색, 첫 메시지 등) — 실서비스에서 제거
  created_at timestamptz not null default now()
);

-- 현재 로그인 계정의 프로필 id (RLS에서 사용)
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_id = auth.uid()
$$;

-- 생년월일 수정 금지, 출생시간은 2회까지
create or replace function public.guard_profile_update()
returns trigger language plpgsql as $$
begin
  if new.birth_date <> old.birth_date then
    raise exception 'birth_date is immutable (PASS-verified)';
  end if;
  if new.hour_branch is distinct from old.hour_branch then
    if old.hour_edits >= 2 then
      raise exception 'hour_branch edit limit reached';
    end if;
    new.hour_edits := old.hour_edits + 1;
  end if;
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ── 지갑(엽전) — 잔액은 원장 합계로만 변경 ─────────────
create table public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 420 check (balance >= 0)
);

create table public.ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,             -- 양수=획득, 음수=소모
  reason text not null,                -- signal / detail / extra_deck / unblur / weekly
                                       -- daily_fortune / streak7 / profile_done / verify / referral / purchase
  ref_id text,                         -- 관련 대상 (상대 profile id, 구매 영수증 등)
  created_at timestamptz not null default now()
);
create index ledger_user_idx on public.ledger (user_id, created_at desc);

create or replace function public.apply_ledger()
returns trigger language plpgsql as $$
begin
  update public.wallets set balance = balance + new.amount where user_id = new.user_id;
  return new;
end $$;
create trigger ledger_apply after insert on public.ledger
  for each row execute function public.apply_ledger();

-- ── 신호 / 매칭 ────────────────────────────────────────
create table public.signals (
  id bigint generated always as identity primary key,
  sender uuid not null references public.profiles(id) on delete cascade,
  receiver uuid not null references public.profiles(id) on delete cascade,
  compat_score smallint not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (sender, receiver)
);

create table public.matches (
  id bigint generated always as identity primary key,
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create table public.messages (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  sender uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now()
);
create index messages_match_idx on public.messages (match_id, created_at);

-- ── 궁합 열람 기록 (상세 풀이 1회 구매 → 영구 열람) ───
create table public.detail_unlocks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  target uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, target)
);

-- ── 프로필 조회 (블러 티저의 원천) ─────────────────────
create table public.profile_views (
  viewer uuid not null references public.profiles(id) on delete cascade,
  viewed uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (viewer, viewed)
);

-- ── 피드 ───────────────────────────────────────────────
create table public.posts (
  id bigint generated always as identity primary key,
  author uuid references public.profiles(id) on delete cascade, -- null = 데모(비인증) 글, 실서비스 전 not null로 강화

  category text not null check (category in ('고민상담', '사주풀이', '자유', '셀소')),
  title text not null check (char_length(title) <= 60),
  body text not null check (char_length(body) <= 2000),
  anonymous boolean not null default true,
  likes integer not null default 0,
  views integer not null default 0,
  created_at timestamptz not null default now()
);
create index posts_cat_idx on public.posts (category, created_at desc);

-- ── RLS ────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.ledger enable row level security;
alter table public.signals enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.detail_unlocks enable row level security;
alter table public.profile_views enable row level security;
alter table public.posts enable row level security;

-- 프로필: 모두 읽기(매칭 노출), 본인 것만 수정/생성
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update on public.profiles for update using (auth.uid() = auth_id);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = auth_id);

-- 지갑/원장: 본인 것만 읽기. 쓰기는 service_role(Edge Function)만 — 클라이언트 직접 과금 금지
create policy wallets_read on public.wallets for select using (public.current_profile_id() = user_id);
create policy ledger_read on public.ledger for select using (public.current_profile_id() = user_id);

-- 신호: 보낸/받은 사람만
create policy signals_read on public.signals for select using (public.current_profile_id() in (sender, receiver));
create policy signals_update on public.signals for update using (public.current_profile_id() = receiver); -- 수락/거절

-- 매칭·메시지: 당사자만
create policy matches_read on public.matches for select using (public.current_profile_id() in (user_a, user_b));
create policy messages_read on public.messages for select
  using (exists (select 1 from public.matches m where m.id = match_id and public.current_profile_id() in (m.user_a, m.user_b)));
create policy messages_insert on public.messages for insert
  with check (public.current_profile_id() = sender and exists (select 1 from public.matches m where m.id = match_id and public.current_profile_id() in (m.user_a, m.user_b)));

-- 열람 기록: 본인 것만
create policy unlocks_read on public.detail_unlocks for select using (public.current_profile_id() = user_id);
create policy views_insert on public.profile_views for insert with check (public.current_profile_id() = viewer);
create policy views_read_own on public.profile_views for select using (public.current_profile_id() in (viewer, viewed));

-- 피드: 모두 읽기, 본인(인증)만 쓰기
create policy posts_read on public.posts for select using (true);
create policy posts_insert on public.posts for insert with check (public.current_profile_id() = author);
