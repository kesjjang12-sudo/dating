-- P1 — 실유저 간 매칭 + 프로필 사진 스토리지

-- ── 신호 수락 시 매칭 자동 생성 (실유저가 수락하는 경우) ──
-- 봇 수락(bot_accept_signal)이 이미 만든 매칭은 on conflict로 무시된다.
create or replace function public.on_signal_accepted()
returns trigger security definer set search_path = public language plpgsql as $$
begin
  insert into public.matches (user_a, user_b)
  values (least(new.sender, new.receiver), greatest(new.sender, new.receiver))
  on conflict (user_a, user_b) do nothing;
  return new;
end $$;
create trigger signals_accepted after update on public.signals
  for each row when (old.status = 'pending' and new.status = 'accepted')
  execute function public.on_signal_accepted();

-- ── 아바타 버킷 — 공개 읽기, 본인 폴더(auth uid)에만 쓰기 ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
