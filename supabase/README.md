# 연분 백엔드 (Supabase)

> **현재 연결된 프로젝트**: `yeonbun` (ref `nmwdqycqlavfinecoljn`, 서울 ap-northeast-2, "dating" 조직, 무료 플랜)
> 스키마 0001·0002 적용 완료, 시드 12명 + 피드 글 입력 완료. 키는 `mobile/.env`(git 제외)에 있음.
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

## 남은 서버 작업 (P1 이관 시)

- [ ] 인증: 전화번호 OTP(Twilio) 또는 익명 로그인(대시보드에서 Anonymous sign-ins 활성화) + PASS 연동
- [ ] Edge Function: `spend`(원장 기입 + 신호/열람 처리), `daily-fortune-claim`(중복 방지)
- [ ] Realtime: `messages` 테이블 구독으로 실시간 채팅
- [ ] Storage: 프로필 사진 버킷 + 검수 큐
