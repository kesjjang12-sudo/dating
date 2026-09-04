-- 실계정 여부를 클라이언트에 노출 (auth_id 자체는 숨김)
alter table public.profiles add column if not exists is_real boolean generated always as (auth_id is not null) stored;

-- 앱 설정 (공개 읽기) — 파일럿 스위치: 실계정은 서로의 덱에 무조건 노출
create table if not exists public.app_settings (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
alter table public.app_settings enable row level security;
drop policy if exists app_settings_read on public.app_settings;
create policy app_settings_read on public.app_settings for select using (true);
insert into public.app_settings (key, value) values ('pilot_pin_all_real', 'true'::jsonb)
  on conflict (key) do update set value = excluded.value, updated_at = now();
