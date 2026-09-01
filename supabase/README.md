# 연분 백엔드 (Supabase)

> **현재 연결된 프로젝트**: `yeonbun` (ref `nmwdqycqlavfinecoljn`, 서울 ap-northeast-2, "dating" 조직, 무료 플랜)
> 스키마 0001~0006 적용 완료, 시드 12명 + 피드 글 입력, **Anonymous sign-ins 활성화됨**.
> 가입→프로필/지갑 생성→신호→수락→매칭→실시간 채팅→상호 얼굴 공개까지 브라우저 2개 라이브 검증 완료 (2026-09-01).
> 웹 배포: https://kesjjang12-sudo.github.io/dating/ (mobile/ 푸시 시 Actions 자동 재배포)
>
> ⚠️ Claude 원격 작업 환경에 옛 프로젝트의 `EXPO_PUBLIC_SUPABASE_URL`(hhjmhdx…)이 환경변수로 남아 있어
> `.env`보다 우선 적용된다. 그 환경에서 빌드할 때는 값을 명시로 덮어쓸 것:
> `EXPO_PUBLIC_SUPABASE_URL=… EXPO_PUBLIC_SUPABASE_KEY=… npx expo export --clear`
> (또는 claude.ai 환경 설정에서 해당 변수를 새 프로젝트 값으로 갱신/삭제)

앱은 Supabase 연동 코드가 내장돼 있고, **키가 없으면 자동으로 로컬 시드로 폴백**한다.
연결되면: 프로필(오늘의 인연 후보)·피드를 서버에서 불러오고, 데모 글쓰기가 서버에 기록된다.
마이 탭 → "데이터 소스"에서 연결 상태를 확인할 수 있다.

## 연결 절차

1. [supabase.com](https://supabase.com) 가입 → 조직(organization) 생성 (무료 플랜 $0)
2. 프로젝트 생성 — 리전 `ap-northeast-2`(서울) 권장
3. SQL Editor에서 `migrations/0001_init.sql` → `0002_demo_seed.sql` 순서로 실행
4. Project Settings → API에서 **Project URL**과 **publishable key** 복사
5. `mobile/.env` 생성 (`.env.example` 참고):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
   ```
6. 앱 재시작 → 마이 탭 "데이터 소스: Supabase 연결됨" 확인

## 설계 원칙 (스키마에 반영됨)

- **프로필 id ≠ 인증 id**: `profiles.id`(uuid)와 `auth_id`(auth.users 연결, null=시드/봇)를 분리.
  RLS는 `current_profile_id()` 함수로 판정
- **생년월일 불변**: PASS 인증값이므로 트리거로 UPDATE 차단. 출생시간만 2회 수정 허용
- **엽전 잔액은 원장(ledger)의 합**: 클라이언트가 잔액을 직접 쓰지 못하고, 과금·적립은
  service_role의 Edge Function만 수행 (RLS로 강제)
- **궁합은 조회 시점 계산**: N² 사전계산 금지. 계산 로직은 `mobile/src/lib/saju/`의 순수 TS —
  Edge Function(Deno)에 그대로 이식 가능

## ⚠️ 데모 전용 장치 (인증 도입 시 제거)

- `posts_insert_demo` 정책: 비인증 글쓰기 허용 → `drop policy posts_insert_demo on public.posts;`
- `posts.author` nullable → 인증 도입 후 `not null`로 강화
- `profiles.demo_meta` (아바타 색·첫 메시지 등 표현용) → 실데이터 컬럼으로 대체

## 운영 모니터링 — 가입·매칭이 실제로 일어나는지 보는 법

대시보드: https://supabase.com/dashboard/project/nmwdqycqlavfinecoljn
→ **Table Editor**에서 `profiles`(가입) · `signals`(신호) · `matches`(매칭) · `messages`(대화) · `ledger`(엽전 사용)를 직접 볼 수 있다.
아래 쿼리는 **SQL Editor**에 붙여넣으면 바로 동작한다.

```sql
-- 오늘의 핵심 지표 한 판
select
  (select count(*) from profiles where auth_id is not null)                          as "실가입자 누적",
  (select count(*) from profiles where auth_id is not null
     and created_at >= current_date)                                                 as "오늘 가입",
  (select count(*) from signals where created_at >= current_date)                    as "오늘 신호",
  (select count(*) from matches where created_at >= current_date)                    as "오늘 매칭",
  (select count(*) from messages where created_at >= current_date)                   as "오늘 메시지",
  (select coalesce(-sum(amount),0) from ledger where amount < 0
     and created_at >= current_date)                                                 as "오늘 엽전 사용";

-- 최근 가입자 (봇/시드는 auth_id가 null이라 자동 제외)
select nickname, handle, gender, birth_date, created_at
from profiles where auth_id is not null order by created_at desc limit 20;

-- 신호 → 수락 퍼널
select status, count(*) from signals group by status;

-- 매칭별 대화량과 얼굴 공개 여부
select m.id, pa.nickname as a, pb.nickname as b,
       (select count(*) from messages where match_id = m.id) as msgs,
       m.reveal_a and m.reveal_b as revealed, m.created_at
from matches m
join profiles pa on pa.id = m.user_a
join profiles pb on pb.id = m.user_b
order by m.created_at desc;

-- 유저별 엽전 사용 내역 (원장 = 진실)
select p.nickname, l.reason, l.amount, l.created_at
from ledger l join profiles p on p.id = l.user_id
order by l.created_at desc limit 50;
```

읽는 법: `profiles.auth_id`가 **null이면 봇/시드**, 값이 있으면 실계정이다.
잔액은 `wallets.balance`지만 진실은 `ledger`의 합 — 둘이 어긋나면 버그다.

## 남은 서버 작업 (P1 이관 시)

- [x] 익명 로그인 + 서버 지갑/신호/채팅 (2026-09-01) — 전화번호 OTP(Twilio)·PASS 연동은 남음
- [x] Realtime: `messages` 구독 실시간 채팅 (+ 조인 실패 대비 8초 폴링 백업)
- [x] Storage: 프로필 사진 `avatars` 버킷 (본인 폴더만 쓰기, 검수 큐는 남음)
- [ ] Edge Function 이관: 추천 덱 서버 계산, 운세 중복 방지 강화
- [ ] 계정 복구: 익명 → 이메일/전화 승격 (`linkIdentity`) — 현재는 브라우저 데이터 삭제 시 계정 유실
