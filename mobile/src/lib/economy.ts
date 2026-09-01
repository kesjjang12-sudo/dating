// 엽전 경제 상수 — docs/product-spec.md §4와 동기화

export const COST = {
  signal: 50,        // 인연 신호 보내기
  detail: 30,        // 상세 궁합 풀이 (1회 열람 후 영구)
  extraDeck: 20,     // 오늘의 인연 추가 열람 (3명)
  unblur: 60,        // 조회자 블러 해제
  weekly: 30,        // 주간 연애운 상세
} as const;

export const EARN = {
  dailyFortune: 5,   // 오늘의 운세 확인
  streak7: 50,       // 7일 연속 출석
  profileDone: 50,   // 프로필 100% 완성
  verify: 30,        // 인증 1건
  referral: 100,     // 친구 초대
} as const;

export const START_COINS = 10000; // 파일럿 기간 상향 — 정식 오픈 시 420으로 (서버 create_wallet도 함께)

export const PACKAGES: { coins: number; price: string; tag?: string }[] = [
  { coins: 100, price: '₩4,900' },
  { coins: 220, price: '₩9,900' },
  { coins: 600, price: '₩24,900', tag: 'HOT' },
  { coins: 1600, price: '₩59,000' },
  { coins: 4000, price: '₩129,000', tag: 'BEST' },
];

export const PASS_PRICE = '월 ₩14,900';
