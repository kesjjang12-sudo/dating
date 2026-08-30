// 만세력 — 생년월일(양력, KST 기준)과 시진으로 사주팔자를 계산한다.
//
// 정밀도 노트: 절기(입춘·월 경계)는 평균 날짜 고정값을 쓴다. 실제 절기는 해마다
// ±1일 오차가 있으므로, 프로덕션에서는 천문 절기 테이블(만세력 DB)로 교체해야 한다.
// 경계일(2/3~2/5 등) 출생자는 "절기 경계 출생" 플래그를 세워 안내한다.

import { Pillar, splitGanzhi } from './ganzhi';

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null; // 출생시간 미상이면 null (삼주)
  boundaryBirth: boolean; // 절기 경계 ±1일 출생 → 정확도 안내 필요
}

/** 1970-01-01(목) = 신사일(辛巳, 육십갑자 index 17) 기준 */
const EPOCH_DAY_GANZHI = 17;

const dayMs = 86400000;

/** 달력 날짜(로컬 개념) → epoch 기준 경과일. UTC로 고정해 타임존 영향 제거 */
export function daysFromEpoch(y: number, m: number, d: number): number {
  return Math.round(Date.UTC(y, m - 1, d) / dayMs);
}

/** 일주 */
export function dayPillar(y: number, m: number, d: number): Pillar {
  return splitGanzhi(daysFromEpoch(y, m, d) + EPOCH_DAY_GANZHI);
}

/** 연주 — 입춘(대략 2/4) 기준으로 해가 바뀐다 */
export function yearPillar(y: number, m: number, d: number): Pillar {
  const solarYear = m < 2 || (m === 2 && d < 4) ? y - 1 : y;
  return splitGanzhi(solarYear - 4); // 서기 4년 = 갑자년
}

// 월 경계(절기) 평균 날짜: [월, 일, 지지 index]
// 입춘 2/4→인(2), 경칩 3/6→묘(3), 청명 4/5→진(4), 입하 5/6→사(5), 망종 6/6→오(6),
// 소서 7/7→미(7), 입추 8/8→신(8), 백로 9/8→유(9), 한로 10/8→술(10), 입동 11/7→해(11),
// 대설 12/7→자(0), 소한 1/6→축(1)
const MONTH_TERMS: [number, number, number][] = [
  [1, 6, 1], [2, 4, 2], [3, 6, 3], [4, 5, 4], [5, 6, 5], [6, 6, 6],
  [7, 7, 7], [8, 8, 8], [9, 8, 9], [10, 8, 10], [11, 7, 11], [12, 7, 0],
];

/** 월주 — 절기 기준 월지 + 오호둔(연간 → 인월 천간) */
export function monthPillar(y: number, m: number, d: number): Pillar {
  // 이 날짜가 속한 절기월의 지지
  let branch = 1; // 1월 초(소한 전)는 전년 12월절 → 축 이전인 자월
  let found = false;
  for (let i = MONTH_TERMS.length - 1; i >= 0; i--) {
    const [tm, td, tb] = MONTH_TERMS[i];
    if (m > tm || (m === tm && d >= td)) { branch = tb; found = true; break; }
  }
  if (!found) branch = 0; // 1/1 ~ 1/5 → 자월(전년 대설 이후)

  // 오호둔: 갑기년→병인월, 을경→무인, 병신→경인, 정임→임인, 무계→갑인
  const ys = yearPillar(y, m, d).stem;
  const startStem = [2, 4, 6, 8, 0][ys % 5];
  const offsetFromIn = (branch - 2 + 12) % 12;
  return { stem: (startStem + offsetFromIn) % 10, branch };
}

/** 시주 — 오서둔(일간 → 자시 천간). hourBranch: 0=자시 … 11=해시 */
export function hourPillar(day: Pillar, hourBranch: number): Pillar {
  // 갑기일→갑자시, 을경→병자, 병신→무자, 정임→경자, 무계→임자
  const startStem = [0, 2, 4, 6, 8][day.stem % 5];
  return { stem: (startStem + hourBranch) % 10, branch: hourBranch % 12 };
}

/** 절기 경계 ±1일 출생 여부 */
function isBoundary(m: number, d: number): boolean {
  return MONTH_TERMS.some(([tm, td]) => tm === m && Math.abs(td - d) <= 1);
}

/** 사주팔자 계산. hourBranch가 null이면 삼주 */
export function fourPillars(y: number, m: number, d: number, hourBranch: number | null): FourPillars {
  const day = dayPillar(y, m, d);
  return {
    year: yearPillar(y, m, d),
    month: monthPillar(y, m, d),
    day,
    hour: hourBranch === null ? null : hourPillar(day, hourBranch),
    boundaryBirth: isBoundary(m, d),
  };
}

/** 'YYYY-MM-DD' 파싱 */
export function fromDateString(birth: string, hourBranch: number | null): FourPillars {
  const [y, m, d] = birth.split('-').map(Number);
  return fourPillars(y, m, d, hourBranch);
}
