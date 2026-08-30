// 절기 시각 테이블 생성기 — 태양 겉보기 황경(Meeus 저정밀 알고리즘, 오차 ≈ 수 분)으로
// 1920~2040년의 12절(節) 입기 시각(KST)을 계산해 src/lib/saju/terms-data.ts로 출력한다.
// 실행: npx tsx scripts/gen-terms.ts

import { writeFileSync } from 'fs';

const rad = (d: number) => (d * Math.PI) / 180;

/** 율리우스일(UT 기준) → 태양 겉보기 황경(도) */
function solarLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(rad(M)) +
    (0.019993 - 0.000101 * T) * Math.sin(rad(2 * M)) +
    0.000289 * Math.sin(rad(3 * M));
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(omega));
  return ((lambda % 360) + 360) % 360;
}

const jdToMs = (jd: number) => (jd - 2440587.5) * 86400000;
const msToJd = (ms: number) => ms / 86400000 + 2440587.5;

/** target 황경(도)에 도달하는 시각(jd)을 뉴턴법으로 탐색 */
function findInstant(targetDeg: number, approxJd: number): number {
  let jd = approxJd;
  for (let i = 0; i < 8; i++) {
    const cur = solarLongitude(jd);
    let diff = ((targetDeg - cur + 540) % 360) - 180;
    jd += diff / 0.9856474;
    if (Math.abs(diff) < 1e-7) break;
  }
  return jd;
}

// 12절(월 경계): [황경, 이름, 대략의 월(양력), 허용 날짜 범위]
const TERMS: [number, string, number, [number, number]][] = [
  [285, '소한', 1, [4, 7]],
  [315, '입춘', 2, [3, 5]],
  [345, '경칩', 3, [4, 7]],
  [15, '청명', 4, [3, 6]],
  [45, '입하', 5, [4, 7]],
  [75, '망종', 6, [4, 7]],
  [105, '소서', 7, [5, 8]],
  [135, '입추', 8, [6, 9]],
  [165, '백로', 9, [6, 9]],
  [195, '한로', 10, [7, 10]],
  [225, '입동', 11, [6, 9]],
  [255, '대설', 12, [5, 9]],
];

const FROM = 1920, TO = 2040;
const out: Record<number, number[]> = {};
let checked = 0;

for (let y = FROM; y <= TO; y++) {
  const row: number[] = [];
  for (const [deg, name, month, [dLo, dHi]] of TERMS) {
    // 초기 추정: 해당 월 5일 정오(UT)
    const approxMs = Date.UTC(y, month - 1, 5, 3, 0, 0);
    const jd = findInstant(deg, msToJd(approxMs));
    const kst = new Date(jdToMs(jd) + 9 * 3600000); // KST = UT+9
    const m = kst.getUTCMonth() + 1, d = kst.getUTCDate(), hh = kst.getUTCHours(), mm = kst.getUTCMinutes();
    if (m !== month || d < dLo || d > dHi) {
      throw new Error(`${y} ${name}: ${m}/${d} ${hh}:${mm} — 허용 범위(${month}/${dLo}~${dHi}) 밖`);
    }
    row.push(((m * 100 + d) * 100 + hh) * 100 + mm); // MMDDHHmm
    checked++;
  }
  // 단조 증가 확인
  for (let i = 1; i < row.length; i++) {
    if (row[i] <= row[i - 1]) throw new Error(`${y}: 절기 순서 오류`);
  }
  out[y] = row;
}

// 알려진 기준값과 대조 (한국천문연구원 공표값, 분 단위 오차 허용)
const known: [number, number, string][] = [
  [2024, 1, '02041727'], // 2024 입춘 2/4 17:27 KST (KASI)
  [2025, 1, '02032310'], // 2025 입춘 2/3 23:10 KST (KASI)
];
for (const [y, idx, expect] of known) {
  const got = String(out[y][idx]).padStart(8, '0');
  const diffMin =
    Math.abs(
      (Number(got.slice(4, 6)) * 60 + Number(got.slice(6, 8))) -
      (Number(expect.slice(4, 6)) * 60 + Number(expect.slice(6, 8)))
    );
  const sameDay = got.slice(0, 4) === expect.slice(0, 4);
  console.log(`${y} 입춘: 계산 ${got} / 기준 ${expect} — ${sameDay ? `동일 날짜, 오차 ${diffMin}분` : '날짜 불일치!'}`);
  if (!sameDay || diffMin > 30) throw new Error(`${y} 기준값 대조 실패`);
}

const file = `// 자동 생성 — scripts/gen-terms.ts (태양 황경 기반 12절 입기 시각, KST)
// 형식: 연도 → [소한, 입춘, 경칩, 청명, 입하, 망종, 소서, 입추, 백로, 한로, 입동, 대설] (MMDDHHmm)
// 다시 생성: npx tsx scripts/gen-terms.ts

export const TERMS_FROM = ${FROM};
export const TERMS_TO = ${TO};
export const TERMS_KST: Record<number, number[]> = ${JSON.stringify(out)};
`;
writeFileSync('src/lib/saju/terms-data.ts', file);
console.log(`OK — ${FROM}~${TO}년 ${checked}개 절기 시각 생성 (src/lib/saju/terms-data.ts)`);
