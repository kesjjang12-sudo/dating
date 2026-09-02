-- 얼굴 공개는 대화 후에 — 양쪽이 각각 3마디 이상 나눈 뒤에만 공개를 제안/수락할 수 있다 (서버 강제).
-- 상태 조회에 대화 수·자격을 함께 돌려줘 클라이언트가 안내 문구를 만든다.

create or replace function public.reveal_required() returns int language sql immutable as $$ select 3 $$;

create or replace function public.rpc_reveal_state(p_match_id bigint)
returns jsonb security definer set search_path = public language plpgsql as $$
declare pid uuid; m record; other uuid; mine_n int; their_n int; req int;
begin
  pid := public.current_profile_id();
  select * into m from public.matches where id = p_match_id and pid in (user_a, user_b);
  if m is null then raise exception 'not_participant'; end if;
  other := case when m.user_a = pid then m.user_b else m.user_a end;
  req := public.reveal_required();
  select count(*) into mine_n from public.messages where match_id = p_match_id and sender = pid;
  select count(*) into their_n from public.messages where match_id = p_match_id and sender = other;
  return jsonb_build_object(
    'mine', case when m.user_a = pid then m.reveal_a else m.reveal_b end,
    'theirs', case when m.user_a = pid then m.reveal_b else m.reveal_a end,
    'revealed', m.reveal_a and m.reveal_b,
    'mineMsgs', mine_n, 'theirMsgs', their_n, 'required', req,
    'eligible', mine_n >= req and their_n >= req);
end $$;

create or replace function public.rpc_reveal_face(p_match_id bigint)
returns jsonb security definer set search_path = public language plpgsql as $$
declare pid uuid; m record; other uuid; other_is_bot boolean; mine_n int; their_n int; req int;
begin
  pid := public.current_profile_id();
  if pid is null then raise exception 'no_profile'; end if;
  select * into m from public.matches where id = p_match_id and pid in (user_a, user_b);
  if m is null then raise exception 'not_participant'; end if;
  other := case when m.user_a = pid then m.user_b else m.user_a end;
  req := public.reveal_required();
  select count(*) into mine_n from public.messages where match_id = p_match_id and sender = pid;
  select count(*) into their_n from public.messages where match_id = p_match_id and sender = other;
  if mine_n < req or their_n < req then raise exception 'not_enough_talk'; end if;
  select (auth_id is null) into other_is_bot from public.profiles where id = other;
  if m.user_a = pid then
    update public.matches set reveal_a = true, reveal_b = reveal_b or other_is_bot where id = p_match_id returning * into m;
  else
    update public.matches set reveal_b = true, reveal_a = reveal_a or other_is_bot where id = p_match_id returning * into m;
  end if;
  return public.rpc_reveal_state(p_match_id);
end $$;
