-- 블라인드 공개·미션 실지급·위치 — 그리고 파일럿 기간 지갑 상향

-- ── 파일럿 기간: 신규 지갑 10,000엽전 (정식 오픈 시 420으로 되돌릴 것) ──
create or replace function public.create_wallet()
returns trigger security definer set search_path = public language plpgsql as $$
begin
  if new.auth_id is not null then
    insert into public.wallets (user_id, balance) values (new.id, 10000)
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;

-- 기존 실계정도 10,000까지 충전
insert into public.ledger (user_id, amount, reason)
select w.user_id, 10000 - w.balance, 'pilot_grant'
from public.wallets w join public.profiles p on p.id = w.user_id
where p.auth_id is not null and w.balance < 10000;

-- ── 위치 (실거리 계산용 좌표 — 본인만 수정, 조회는 공개 프로필 정책을 따름) ──
alter table public.profiles add column lat double precision, add column lng double precision;

-- ── 블라인드 얼굴 공개 — 양쪽 모두 동의해야 사진이 열린다 ──
alter table public.matches
  add column reveal_a boolean not null default false,
  add column reveal_b boolean not null default false;

-- 내 쪽 공개 동의. 상대가 봇이면 자동 수락(데모). 반환: {mine, theirs, revealed}
create or replace function public.rpc_reveal_face(p_match_id bigint)
returns jsonb security definer set search_path = public language plpgsql as $$
declare pid uuid; m record; other uuid; other_is_bot boolean;
begin
  pid := public.current_profile_id();
  if pid is null then raise exception 'no_profile'; end if;
  select * into m from public.matches where id = p_match_id and pid in (user_a, user_b);
  if m is null then raise exception 'not_participant'; end if;
  other := case when m.user_a = pid then m.user_b else m.user_a end;
  select (auth_id is null) into other_is_bot from public.profiles where id = other;
  if m.user_a = pid then
    update public.matches set reveal_a = true, reveal_b = reveal_b or other_is_bot where id = p_match_id returning * into m;
  else
    update public.matches set reveal_b = true, reveal_a = reveal_a or other_is_bot where id = p_match_id returning * into m;
  end if;
  return jsonb_build_object(
    'mine', case when m.user_a = pid then m.reveal_a else m.reveal_b end,
    'theirs', case when m.user_a = pid then m.reveal_b else m.reveal_a end,
    'revealed', m.reveal_a and m.reveal_b);
end $$;

-- 공개 상태 조회
create or replace function public.rpc_reveal_state(p_match_id bigint)
returns jsonb security definer set search_path = public language plpgsql as $$
declare pid uuid; m record;
begin
  pid := public.current_profile_id();
  select * into m from public.matches where id = p_match_id and pid in (user_a, user_b);
  if m is null then raise exception 'not_participant'; end if;
  return jsonb_build_object(
    'mine', case when m.user_a = pid then m.reveal_a else m.reveal_b end,
    'theirs', case when m.user_a = pid then m.reveal_b else m.reveal_a end,
    'revealed', m.reveal_a and m.reveal_b);
end $$;

-- ── 미션 실지급 ────────────────────────────────────────
-- 프로필 사진 등록 +50 (1회, 사진 존재 서버 검증)
create or replace function public.rpc_claim_mission_photo()
returns int security definer set search_path = public language plpgsql as $$
declare pid uuid; bal int;
begin
  pid := public.current_profile_id();
  if pid is null then raise exception 'no_profile'; end if;
  if not exists (select 1 from public.profiles where id = pid and coalesce(array_length(photos, 1), 0) > 0) then
    raise exception 'no_photo';
  end if;
  if exists (select 1 from public.ledger where user_id = pid and reason = 'mission_photo') then
    raise exception 'already_claimed';
  end if;
  insert into public.ledger (user_id, amount, reason) values (pid, 50, 'mission_photo');
  select balance into bal from public.wallets where user_id = pid;
  return bal;
end $$;

-- 친구 초대 코드(= 추천인 handle) 입력 — 양쪽 +100, 1회
create or replace function public.rpc_apply_referral(code text)
returns int security definer set search_path = public language plpgsql as $$
declare pid uuid; ref uuid; bal int;
begin
  pid := public.current_profile_id();
  if pid is null then raise exception 'no_profile'; end if;
  select id into ref from public.profiles where handle = code and auth_id is not null;
  if ref is null or ref = pid then raise exception 'bad_code'; end if;
  if exists (select 1 from public.ledger where user_id = pid and reason = 'referral_joined') then
    raise exception 'already_claimed';
  end if;
  insert into public.ledger (user_id, amount, reason, ref_id) values (pid, 100, 'referral_joined', code);
  insert into public.ledger (user_id, amount, reason) values (ref, 100, 'referral_invite');
  select balance into bal from public.wallets where user_id = pid;
  return bal;
end $$;

revoke all on function public.rpc_reveal_face(bigint) from public, anon;
revoke all on function public.rpc_reveal_state(bigint) from public, anon;
revoke all on function public.rpc_claim_mission_photo() from public, anon;
revoke all on function public.rpc_apply_referral(text) from public, anon;
grant execute on function public.rpc_reveal_face(bigint) to authenticated;
grant execute on function public.rpc_reveal_state(bigint) to authenticated;
grant execute on function public.rpc_claim_mission_photo() to authenticated;
grant execute on function public.rpc_apply_referral(text) to authenticated;
