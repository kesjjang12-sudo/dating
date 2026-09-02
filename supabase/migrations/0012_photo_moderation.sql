-- 프로필 사진 검수: 클라이언트 자동 검수 결과 기록 + 운영자 승인/반려
alter table public.profiles
  add column if not exists photo_status text not null default 'none'
    check (photo_status in ('none','pending','auto_ok','approved','rejected')),
  add column if not exists photo_check jsonb,
  add column if not exists photo_reject_reason text,
  add column if not exists photo_reviewed_at timestamptz;

-- 사진 미션 보상은 반려된 사진으로는 받을 수 없다
create or replace function public.rpc_claim_mission_photo()
returns int security definer set search_path = public language plpgsql as $$
declare pid uuid; bal int;
begin
  pid := public.current_profile_id();
  if pid is null then raise exception 'no_profile'; end if;
  if not exists (select 1 from public.profiles where id = pid and coalesce(array_length(photos, 1), 0) > 0 and photo_status <> 'rejected') then
    raise exception 'no_photo';
  end if;
  if exists (select 1 from public.ledger where user_id = pid and reason = 'mission_photo') then
    raise exception 'already_claimed';
  end if;
  insert into public.ledger (user_id, amount, reason) values (pid, 50, 'mission_photo');
  select balance into bal from public.wallets where user_id = pid;
  return bal;
end $$;

-- 운영자용 검수 큐 뷰 (대시보드 SQL Editor / Table Editor에서 조회)
create or replace view public.photo_review_queue as
  select id, handle, nickname, gender, photos[1] as photo_url, photo_status, photo_check, photo_reject_reason, photo_reviewed_at, created_at
  from public.profiles
  where auth_id is not null and coalesce(array_length(photos, 1), 0) > 0
  order by (photo_status = 'pending') desc, photo_reviewed_at nulls first, created_at desc;
revoke all on public.photo_review_queue from anon, authenticated;
