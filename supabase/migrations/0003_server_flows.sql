-- 서버 후반부 — 지갑 자동 생성, 엽전 RPC(서버 원장), 신호 정책,
-- 데모 봇의 신호 수락·첫 메시지·자동 답장을 DB 트리거로 구현.

-- ── 실유저 프로필 생성 시 지갑 자동 생성 ─────────────
create or replace function public.create_wallet()
returns trigger security definer set search_path = public language plpgsql as $$
begin
  if new.auth_id is not null then
    insert into public.wallets (user_id, balance) values (new.id, 420)
    on conflict (user_id) do nothing;
  end if;
  return new;
end $$;
create trigger profiles_wallet after insert on public.profiles
  for each row execute function public.create_wallet();

-- ── 엽전 차감 RPC — 클라이언트는 잔액을 직접 만질 수 없다 ──
create or replace function public.rpc_spend(amount int, reason text, ref text default null)
returns int security definer set search_path = public language plpgsql as $$
declare pid uuid; bal int;
begin
  pid := public.current_profile_id();
  if pid is null then raise exception 'no_profile'; end if;
  if amount <= 0 or amount > 10000 then raise exception 'bad_amount'; end if;
  select balance into bal from public.wallets where user_id = pid for update;
  if bal is null or bal < amount then raise exception 'insufficient'; end if;
  insert into public.ledger (user_id, amount, reason, ref_id) values (pid, -amount, reason, ref);
  return bal - amount;
end $$;

-- ── 오늘의 운세 적립 RPC — KST 기준 하루 1회 ──────────
create or replace function public.rpc_claim_fortune()
returns int security definer set search_path = public language plpgsql as $$
declare pid uuid; bal int;
begin
  pid := public.current_profile_id();
  if pid is null then raise exception 'no_profile'; end if;
  if exists (
    select 1 from public.ledger
    where user_id = pid and reason = 'daily_fortune'
      and (created_at at time zone 'Asia/Seoul')::date = (now() at time zone 'Asia/Seoul')::date
  ) then raise exception 'already_claimed'; end if;
  insert into public.ledger (user_id, amount, reason) values (pid, 5, 'daily_fortune');
  select balance into bal from public.wallets where user_id = pid;
  return bal;
end $$;

revoke all on function public.rpc_spend(int, text, text) from public, anon;
revoke all on function public.rpc_claim_fortune() from public, anon;
grant execute on function public.rpc_spend(int, text, text) to authenticated;
grant execute on function public.rpc_claim_fortune() to authenticated;

-- ── 신호 insert 정책 (0001 누락분) ────────────────────
create policy signals_insert on public.signals
  for insert with check (public.current_profile_id() = sender);

-- ── 데모 봇: 신호 즉시 수락 → 매칭 + 첫 메시지 ────────
create or replace function public.bot_accept_signal()
returns trigger security definer set search_path = public language plpgsql as $$
declare meta jsonb; a uuid; b uuid; mid bigint;
begin
  select demo_meta into meta from public.profiles where id = new.receiver and auth_id is null;
  if meta is null or coalesce(meta->>'accepts_instantly', 'false') <> 'true' then return new; end if;
  update public.signals set status = 'accepted' where id = new.id;
  a := least(new.sender, new.receiver); b := greatest(new.sender, new.receiver);
  insert into public.matches (user_a, user_b) values (a, b) on conflict (user_a, user_b) do nothing;
  select id into mid from public.matches where user_a = a and user_b = b;
  insert into public.messages (match_id, sender, body)
    values (mid, new.receiver, coalesce(meta->>'first_msg', '반가워요! 궁합이 좋게 나와서 연결됐네요.'));
  return new;
end $$;
create trigger signals_bot after insert on public.signals
  for each row execute function public.bot_accept_signal();

-- ── 데모 봇: 사람 메시지에 자동 답장 ──────────────────
create or replace function public.bot_reply()
returns trigger security definer set search_path = public language plpgsql as $$
declare sender_auth uuid; m record; bot uuid; meta jsonb; replies jsonb; idx int;
begin
  select auth_id into sender_auth from public.profiles where id = new.sender;
  if sender_auth is null then return new; end if; -- 봇이 보낸 메시지에는 반응하지 않음 (재귀 방지)
  select * into m from public.matches where id = new.match_id;
  bot := case when m.user_a = new.sender then m.user_b else m.user_a end;
  select demo_meta into meta from public.profiles where id = bot and auth_id is null;
  if meta is null then return new; end if;
  replies := coalesce(meta->'replies', '[]'::jsonb);
  select count(*) - 1 into idx from public.messages where match_id = new.match_id and sender = bot;
  if idx < 0 then idx := 0; end if;
  if idx < jsonb_array_length(replies) then
    insert into public.messages (match_id, sender, body) values (new.match_id, bot, replies->>idx);
  end if;
  return new;
end $$;
create trigger messages_bot after insert on public.messages
  for each row execute function public.bot_reply();

-- ── 실시간 채팅 준비: messages 테이블을 realtime 발행에 추가 ──
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
