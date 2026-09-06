-- 프로필 조회 기록: 재조회 시 viewed_at 갱신(본인 기록만), 조회당한 사람의 목록 조회용 인덱스
create policy views_update_own on public.profile_views for update
  using (public.current_profile_id() = viewer) with check (public.current_profile_id() = viewer);
create index if not exists profile_views_viewed_idx on public.profile_views (viewed, viewed_at desc);
