# 연분 백엔드 (Supabase)

앱은 현재 **로컬 데이터(AsyncStorage + 시드 프로필)**로 동작하며, 이 스키마는 실서버 이관용이다.

## 적용 방법

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에 `migrations/0001_init.sql` 내용 붙여넣고 실행 (또는 `supabase db push`)
3. `mobile/`에 `@supabase/supabase-js` 설치 후 클라이언트 연결

## 설계 원칙 (스키마에 반영됨)

- **생년월일 불변**: PASS 인증값이므로 트리거로 UPDATE 차단. 출생시간만 2회 수정 허용
- **엽전 잔액은 원장(ledger)의 합**: 클라이언트가 잔액을 직접 쓰지 못하고, 과금·적립은 service_role의 Edge Function만 수행 (RLS로 강제)
- **사주 기둥은 가입 시 1회 계산해 캐시** (`pillar_*` 컬럼, 육십갑자 index)
- **궁합은 조회 시점 계산**: N² 사전계산 금지. 계산 로직은 `mobile/src/lib/saju/`의 순수 TS — Edge Function(Deno)에 그대로 이식 가능

## 남은 서버 작업 (P0 이관 시)

- [ ] Edge Function: `spend`(원장 기입 + 신호/열람 처리), `daily-fortune-claim`(중복 방지)
- [ ] 전화번호 OTP 인증 (Twilio 연동) + PASS 본인인증 연동
- [ ] Realtime 채널: `messages` 테이블 구독으로 채팅
- [ ] Storage: 프로필 사진 버킷 + 검수 큐
