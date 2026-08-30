// 사주 엔진 검증 — 알려진 만세력 값과 대조. `npx tsx scripts/verify-saju.ts`
import { fourPillars, dayPillar } from '../src/lib/saju/manseryeok';
import { pillarKo } from '../src/lib/saju/ganzhi';
import { compatibility } from '../src/lib/saju/compat';
import { dailyFortune, weeklyFortune } from '../src/lib/saju/fortune';

let failed = 0;
function eq(name: string, actual: string, expected: string) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗ FAIL'} ${name}: ${actual}${ok ? '' : ` (expected ${expected})`}`);
}

// ── 일주 검증 (공개 만세력 기준값) ──
eq('1970-01-01 일주', pillarKo(dayPillar(1970, 1, 1)), '신사');
eq('2000-01-01 일주', pillarKo(dayPillar(2000, 1, 1)), '무오');
eq('1997-12-21 일주', pillarKo(dayPillar(1997, 12, 21)), '정유');
eq('2024-01-01 일주', pillarKo(dayPillar(2024, 1, 1)), '갑자'); // 2024-01-01 = 갑자일

// ── 연주·월주 검증 ──
const p1 = fourPillars(1997, 12, 21, 1); // 축시
eq('1997-12-21 연주', pillarKo(p1.year), '정축');
eq('1997-12-21 월주', pillarKo(p1.month), '임자');
eq('1997-12-21 축시 시주', pillarKo(p1.hour!), '신축'); // 정유일 → 오서둔 정임→경자시, 축시=신축

// 입춘 전 출생 → 전년 간지
const p2 = fourPillars(1998, 1, 15, null);
eq('1998-01-15 연주(입춘 전)', pillarKo(p2.year), '정축');
eq('1998-01-15 월주(소한 후)', pillarKo(p2.month), '계축');

// ── 절기 경계: 정밀 시각 기반 (2024 입춘 = 2/4 17:27 KST) ──
// 같은 날이라도 입춘 시각 전후로 연주가 갈린다
eq('2024-02-04 미시(14시) 연주', pillarKo(fourPillars(2024, 2, 4, 7).year), '계묘');   // 입춘 전
eq('2024-02-04 유시(18시) 연주', pillarKo(fourPillars(2024, 2, 4, 9).year), '갑진');   // 입춘 후
eq('2024-02-04 미시 월주(축월)', pillarKo(fourPillars(2024, 2, 4, 7).month), '을축');
eq('2024-02-04 유시 월주(인월)', pillarKo(fourPillars(2024, 2, 4, 9).month), '병인');
eq('2024-01-10 월주(소한 후 축월)', pillarKo(fourPillars(2024, 1, 10, null).month), '을축');
eq('2023-12-25 월주(대설 후 자월)', pillarKo(fourPillars(2023, 12, 25, null).month), '갑자');
// 경계 플래그: 입춘 당일 시간 미상 → 안내, 경계에서 먼 날은 미표시
console.log(`${fourPillars(2024, 2, 4, null).boundaryBirth ? '✓' : '✗ FAIL'} 2024-02-04 시간미상 → 경계 플래그 on`);
if (!fourPillars(2024, 2, 4, null).boundaryBirth) failed++;
console.log(`${!fourPillars(2024, 2, 20, 5).boundaryBirth ? '✓' : '✗ FAIL'} 2024-02-20 → 경계 플래그 off`);
if (fourPillars(2024, 2, 20, 5).boundaryBirth) failed++;

// ── 궁합: 결정론 + 범위 확인 ──
const a = fourPillars(1997, 12, 21, 1);
const b = fourPillars(1999, 3, 8, 6);
const c1 = compatibility(a, b);
const c2 = compatibility(a, b);
console.log(`✓ 궁합 결정론: ${c1.total} === ${c2.total}: ${c1.total === c2.total}`);
if (c1.total !== c2.total) failed++;
if (c1.total < 0 || c1.total > 100 || c1.parts.some((p) => p.score < 0 || p.score > 100)) {
  failed++; console.log('✗ FAIL 궁합 점수 범위 이탈', c1);
} else {
  console.log(`✓ 궁합 범위 OK — total=${c1.total}, parts=[${c1.parts.map((p) => p.score).join(', ')}]`);
  console.log(`  headline: ${c1.headline}`);
}

// 천간합 페어(갑+기): 일간 궁합이 높아야 함
const gap = fourPillars(2024, 1, 1, null); // 갑자일
let gi: ReturnType<typeof fourPillars> | null = null;
for (let d = 1; d <= 30; d++) {
  const t = fourPillars(2024, 1, d, null);
  if (pillarKo(t.day).startsWith('기')) { gi = t; break; }
}
if (gi) {
  const cc = compatibility(gap, gi);
  const dm = cc.parts[1].score;
  console.log(`${dm >= 90 ? '✓' : '✗ FAIL'} 천간합(갑·기) 일간 점수 ${dm} >= 90`);
  if (dm < 90) failed++;
}

// ── 운세: 생성 + 결정론 ──
const f = dailyFortune(new Date(2026, 7, 30), a);
console.log(`✓ 오늘의 운세: [${f.dateLabel}] ${f.title} / 길방 ${f.luckyDirection} / 길시 ${f.luckyHour}`);
const w = weeklyFortune(new Date(2026, 7, 30), a);
console.log(`✓ 주간 운세(${w.length}자): ${w.slice(0, 60)}…`);

console.log(failed === 0 ? '\n모든 검증 통과' : `\n${failed}건 실패`);
process.exit(failed === 0 ? 0 : 1);
