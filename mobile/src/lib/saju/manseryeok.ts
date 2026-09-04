// 만세력 — 생년월일(양력, KST)과 시진으로 사주팔자를 계산한다.
//
// 데이터 소스:
// - 일주(60갑자): 순수 산술 (1970-01-01 = 신사일 앵커, 검증됨)
// - 월주·연주 경계(절기): 태양 황경 계산으로 생성한 1920~2040년 12절 입기 시각 테이블
//   (terms-data.ts, KASI 공표값 대비 오차 2~6분 수준). 범위 밖 연도는 평균일 근사로 폴백.
// - 시진 경계(23시 등)와 서머타임(1948~60 일부), UTC+8:30 시기(1954~61)의 분 단위 보정은
//   미적용 — 시진 입력이 2시간 단위라 실사용 영향은 경계 출생자에 한정되며, 해당 케이스는
//   boundaryBirth 플래그로 안내한다.

import { Pillar, splitGanzhi } from './ganzhi';
import { TERMS_FROM, TERMS_KST, TERMS_TO } from './terms-data';

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // 출생시간 미상이면 null (삼주)
  boundaryBirth: boolean; // 절기 경계 부근 출생 → 정확도 안내 필요
}

/** 1970-01-01(목) = 신사일(辛巳, 육십갑자 index 17) 기준 */
const EPOCH_DAY_GANZHI = 17;
const dayMs = 86400000;

/** 달력 날짜(KST 벽시계 개념) → epoch 기준 경과일. UTC로 고정해 실행환경 타임존 영향 제거 */
export function daysFromEpoch(y: number, m: number, d: number): number {
  return Math.round(Date.UTC(y, m - 1, d) / dayMs);
}

/** 일주 */
export function dayPillar(y: number, m: number, d: number): Pillar {
  return splitGanzhi(daysFromEpoch(y, m, d) + EPOCH_DAY_GANZHI);
}

// ── 절기 테이블 ────────────────────────────────────────
// 테이블 열 순서: 소한 입춘 경칩 청명 입하 망종 소서 입추 백로 한로 입동 대설
// 각 절이 여는 월지:  축   인   묘   진   사   오   미   신   유   술   해   자
const TERM_BRANCH = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];

const hasExact = (y: number) => y >= TERMS_FROM && y <= TERMS_TO;

/** 절기 시각(MMDDHHmm) → KST 벽시계를 UTC처럼 취급한 비교용 ms */
function termMs(year: number, encoded: number): number {
  const mm = Math.floor(encoded / 1000000);
  const dd = Math.floor(encoded / 10000) % 100;
  const hh = Math.floor(encoded / 100) % 100;
  const mi = encoded % 100;
  return Date.UTC(year, mm - 1, dd, hh, mi);
}

/** 출생 시각(비교용 ms). 시진은 중앙시(한국 30분 보정: 자=00:30, 축=02:30 …), 미상이면 정오 */
function birthMs(y: number, m: number, d: number, hourBranch: number | null): number {
  if (hourBranch === null) return Date.UTC(y, m - 1, d, 12, 0);
  return Date.UTC(y, m - 1, d, (hourBranch * 2) % 24, 30);
}

/** 입춘 입기 시각 */
const ipchunMs = (y: number) => termMs(y, TERMS_KST[y][1]);

// ── 폴백(평균일 근사, 테이블 범위 밖 연도) ────────────
const APPROX_TERMS: [number, number, number][] = [
  [1, 6, 1], [2, 4, 2], [3, 6, 3], [4, 5, 4], [5, 6, 5], [6, 6, 6],
  [7, 7, 7], [8, 8, 8], [9, 8, 9], [10, 8, 10], [11, 7, 11], [12, 7, 0],
];

/** 연주 — 입춘 기준으로 해가 바뀐다 */
export function yearPillar(y: number, m: number, d: number, hourBranch: number | null = null): Pillar {
  let solarYear: number;
  if (hasExact(y)) {
    solarYear = birthMs(y, m, d, hourBranch) < ipchunMs(y) ? y - 1 : y;
  } else {
    solarYear = m < 2 || (m === 2 && d < 4) ? y - 1 : y;
  }
  return splitGanzhi(solarYear - 4); // 서기 4년 = 갑자년
}

/** 이 시각이 속한 절기월의 지지 (정밀 테이블) */
function monthBranchExact(y: number, m: number, d: number, hourBranch: number | null): number {
  const t = birthMs(y, m, d, hourBranch);
  // 전년 대설부터 당해 대설까지 훑어 마지막으로 지난 절을 찾는다
  let branch = 0; // 기본: 전년 대설 이후 = 자월
  if (hasExact(y - 1) && t < termMs(y, TERMS_KST[y][0])) return 0; // 소한 전 = 자월
  for (let i = 0; i < 12; i++) {
    if (t >= termMs(y, TERMS_KST[y][i])) branch = TERM_BRANCH[i];
  }
  return branch;
}

/** 월주 — 절기 기준 월지 + 오호둔(연간 → 인월 천간) */
export function monthPillar(y: number, m: number, d: number, hourBranch: number | null = null): Pillar {
  let branch: number;
  if (hasExact(y)) {
    branch = monthBranchExact(y, m, d, hourBranch);
  } else {
    branch = 1;
    let found = false;
    for (let i = APPROX_TERMS.length - 1; i >= 0; i--) {
      const [tm, td, tb] = APPROX_TERMS[i];
      if (m > tm || (m === tm && d >= td)) { branch = tb; found = true; break; }
    }
    if (!found) branch = 0;
  }
  const ys = yearPillar(y, m, d, hourBranch).stem;
  const startStem = [2, 4, 6, 8, 0][ys % 5]; // 오호둔: 갑기→병인, 을경→무인, 병신→경인, 정임→임인, 무계→갑인
  const offsetFromIn = (branch - 2 + 12) % 12;
  return { stem: (startStem + offsetFromIn) % 10, branch };
}

/** 시주 — 오서둔(일간 → 자시 천간). hourBranch: 0=자시 … 11=해시 */
export function hourPillar(day: Pillar, hourBranch: number): Pillar {
  const startStem = [0, 2, 4, 6, 8][day.stem % 5]; // 갑기→갑자, 을경→병자, 병신→무자, 정임→경자, 무계→임자
  return { stem: (startStem + hourBranch) % 10, branch: hourBranch % 12 };
}

/** 절기 경계 부근 출생 여부 — 시간 미상이면 ±18시간, 시진 알면 ±2시간 */
function isBoundary(y: number, m: number, d: number, hourBranch: number | null): boolean {
  const threshold = (hourBranch === null ? 18 : 2) * 3600000;
  const t = birthMs(y, m, d, hourBranch);
  for (const yy of [y - 1, y, y + 1]) {
    if (!hasExact(yy)) continue;
    for (const enc of TERMS_KST[yy]) {
      if (Math.abs(t - termMs(yy, enc)) < threshold) return true;
    }
  }
  if (!hasExact(y)) {
    return APPROX_TERMS.some(([tm, td]) => tm === m && Math.abs(td - d) <= 1);
  }
  return false;
}

/** 사주팔자 계산. hourBranch가 null이면 삼주 */
export function fourPillars(y: number, m: number, d: number, hourBranch: number | null): FourPillars {
  const day = dayPillar(y, m, d);
  return {
    year: yearPillar(y, m, d, hourBranch),
    month: monthPillar(y, m, d, hourBranch),
    day,
    hour: hourBranch === null ? null : hourPillar(day, hourBranch),
    boundaryBirth: isBoundary(y, m, d, hourBranch),
  };
}

/** 'YYYY-MM-DD' 파싱 */
export function fromDateString(birth: string, hourBranch: number | null): FourPillars {
  const [y, m, d] = birth.split('-').map(Number);
  return fourPillars(y, m, d, hourBranch);
}
