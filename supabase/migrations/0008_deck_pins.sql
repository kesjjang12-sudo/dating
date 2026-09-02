-- 테스트용 고정 추천: viewer 닉네임의 덱 맨 앞에 pinned 닉네임을 무조건 노출 (성별·회전·지나가기 무시, 매칭 후 제외)
create table if not exists public.deck_pins (
  viewer_nickname text not null,
  pinned_nickname text not null,
  note text,
  created_at timestamptz not null default now(),
  primary key (viewer_nickname, pinned_nickname)
);
alter table public.deck_pins enable row level security;
drop policy if exists deck_pins_read on public.deck_pins;
create policy deck_pins_read on public.deck_pins for select to anon, authenticated using (true);

insert into public.deck_pins (viewer_nickname, pinned_nickname, note) values
  ('김은성', '이준원', '테스트: 이준원 가입 시 김은성 덱 맨 앞 고정'),
  ('은성',   '이준원', '테스트: 김은성의 다른 계정')
on conflict do nothing;
