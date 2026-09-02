-- 계정별 프로필: 자기소개·키·지역·관계 목표·음주·흡연·MBTI·연분 문답
alter table public.profiles
  add column if not exists bio text check (char_length(bio) <= 400),
  add column if not exists height_cm int check (height_cm between 130 and 220),
  add column if not exists region text check (char_length(region) <= 20),
  add column if not exists goal text,
  add column if not exists drink text,
  add column if not exists smoke text,
  add column if not exists mbti text check (mbti ~ '^[EI][NS][FT][JP]$'),
  add column if not exists answers jsonb not null default '[]'::jsonb; -- [{q, a}]
