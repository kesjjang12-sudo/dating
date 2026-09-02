-- 셀소 좋아요: 신호에 출처를 남긴다 (deck=오늘의 인연, selso=커뮤니티 셀소 글)
alter table public.signals add column if not exists source text not null default 'deck' check (source in ('deck','selso'));

-- 로그인(익명 세션) 유저의 글쓰기: 익명 글은 author 없이, 셀소는 본인 author로
drop policy if exists posts_insert_auth on public.posts;
create policy posts_insert_auth on public.posts
  for insert to authenticated
  with check ((anonymous = true and author is null) or (author = public.current_profile_id()));
