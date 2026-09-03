-- 신고
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter uuid not null references public.profiles(id) on delete cascade,
  target uuid references public.profiles(id) on delete cascade,     -- 사람 신고
  post_id bigint references public.posts(id) on delete cascade,     -- 글 신고
  reason text not null check (reason in ('허위 사진·프로필','불쾌한 메시지·성희롱','광고·사기·외부 유도','미성년 의심','기타')),
  detail text check (char_length(detail) <= 500),
  status text not null default 'open' check (status in ('open','reviewed','actioned','dismissed')),
  created_at timestamptz not null default now(),
  check (target is not null or post_id is not null)
);
create index if not exists reports_target_idx on public.reports (target, created_at desc);
alter table public.reports enable row level security;
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert to authenticated with check (reporter = public.current_profile_id());
drop policy if exists reports_read_own on public.reports;
create policy reports_read_own on public.reports for select to authenticated using (reporter = public.current_profile_id());

-- 차단 (양쪽 모두 조회 가능 → 서로의 화면에서 서로가 사라진다)
create table if not exists public.blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
alter table public.blocks enable row level security;
drop policy if exists blocks_rw on public.blocks;
create policy blocks_rw on public.blocks for all to authenticated
  using (blocker = public.current_profile_id() or blocked = public.current_profile_id())
  with check (blocker = public.current_profile_id());

-- 차단 관계에서는 신호·메시지가 서버에서도 막힌다
create or replace function public.is_blocked_pair(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks where (blocker = a and blocked = b) or (blocker = b and blocked = a))
$$;
drop policy if exists signals_insert on public.signals;
create policy signals_insert on public.signals for insert to authenticated
  with check (sender = public.current_profile_id() and not public.is_blocked_pair(sender, receiver));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (sender = public.current_profile_id() and exists (
    select 1 from public.matches m where m.id = match_id and sender in (m.user_a, m.user_b) and not public.is_blocked_pair(m.user_a, m.user_b)));

-- 신고 누적 시 자동 조치: 같은 대상 신고 3건 이상 → 사진 검수 대기(pending)로 내리고 운영자 큐에 표시
create or replace function public.reports_auto_action() returns trigger security definer set search_path = public language plpgsql as $$
declare n int;
begin
  if new.target is not null then
    select count(distinct reporter) into n from public.reports where target = new.target and status = 'open';
    if n >= 3 then update public.profiles set photo_status = 'pending' where id = new.target and photo_status in ('auto_ok','approved'); end if;
  end if;
  return null;
end $$;
drop trigger if exists reports_auto on public.reports;
create trigger reports_auto after insert on public.reports for each row execute function public.reports_auto_action();

-- 운영자 큐
create or replace view public.report_queue as
  select r.id, r.status, r.reason, r.detail, r.created_at,
         rp.nickname as reporter, tp.nickname as target, tp.handle as target_handle, r.post_id,
         (select count(*) from public.reports x where x.target = r.target and x.status = 'open') as target_open_reports
  from public.reports r
  join public.profiles rp on rp.id = r.reporter
  left join public.profiles tp on tp.id = r.target
  order by (r.status = 'open') desc, r.created_at desc;
revoke all on public.report_queue from anon, authenticated;
