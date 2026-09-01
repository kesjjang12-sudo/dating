-- ⚠️ 데모 전용: 결제 없이 엽전 충전. IAP 도입 시 반드시 제거하고
-- 영수증 검증 Edge Function으로 대체할 것.
--   drop function public.rpc_topup_demo(int);

create or replace function public.rpc_topup_demo(amount int)
returns int security definer set search_path = public language plpgsql as $$
declare pid uuid; bal int;
begin
  pid := public.current_profile_id();
  if pid is null then raise exception 'no_profile'; end if;
  if amount not in (100, 220, 600, 1600, 4000) then raise exception 'bad_package'; end if;
  insert into public.ledger (user_id, amount, reason) values (pid, amount, 'purchase_demo');
  select balance into bal from public.wallets where user_id = pid;
  return bal;
end $$;

revoke all on function public.rpc_topup_demo(int) from public, anon;
grant execute on function public.rpc_topup_demo(int) to authenticated;
