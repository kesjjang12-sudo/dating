-- 커뮤니티 댓글: 셀소 글에는 닉네임 공개, 그 외 글에는 익명(글마다 익명1·익명2… 번호)
create table if not exists public.post_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  author uuid references public.profiles(id) on delete set null,   -- 항상 기록 (신고·차단 대응), 노출은 anonymous로 제어
  anonymous boolean not null default true,
  anon_no int,                                                     -- 익명 댓글 표시 번호 (글 단위, 작성자별 고정)
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);
alter table public.post_comments enable row level security;
drop policy if exists post_comments_read on public.post_comments;
create policy post_comments_read on public.post_comments for select using (true);
drop policy if exists post_comments_insert on public.post_comments;
create policy post_comments_insert on public.post_comments for insert to authenticated
  with check (author = public.current_profile_id());

-- 익명 번호 부여: 같은 글에서 같은 사람은 같은 번호, 새 사람은 다음 번호
create or replace function public.post_comments_assign_anon() returns trigger
security definer set search_path = public language plpgsql as $$
declare existing int; nextno int;
begin
  if new.anonymous then
    select anon_no into existing from public.post_comments where post_id = new.post_id and author = new.author and anonymous and anon_no is not null limit 1;
    if existing is not null then new.anon_no := existing;
    else select coalesce(max(anon_no), 0) + 1 into nextno from public.post_comments where post_id = new.post_id; new.anon_no := nextno; end if;
  else
    new.anon_no := null;
  end if;
  return new;
end $$;
drop trigger if exists post_comments_anon on public.post_comments;
create trigger post_comments_anon before insert on public.post_comments for each row execute function public.post_comments_assign_anon();

-- 댓글 수 캐시 (posts.comments) — 목록에서 바로 보이게
alter table public.posts add column if not exists comments int not null default 0;
create or replace function public.post_comments_count() returns trigger
security definer set search_path = public language plpgsql as $$
begin
  if tg_op = 'INSERT' then update public.posts set comments = comments + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then update public.posts set comments = greatest(0, comments - 1) where id = old.post_id; end if;
  return null;
end $$;
drop trigger if exists post_comments_counter on public.post_comments;
create trigger post_comments_counter after insert or delete on public.post_comments for each row execute function public.post_comments_count();
alter publication supabase_realtime add table public.post_comments;
