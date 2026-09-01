// 대운(大運) — 10년 주기 운의 흐름.
// 방향: 양남음녀 순행, 음남양녀 역행 (연간의 음양 기준).
// 대운수: 출생 시각에서 다음 절(순행)/이전 절(역행)까지의 일수 ÷ 3 (1일 = 4개월).

import { Pillar, splitGanzhi, stemIsYang } from './ganzhi';
import { FourPillars } from './manseryeok';
import { TERMS_FROM, TERMS_KST, TERMS_TO } from './terms-data';

export interface DaeunCycle {
  pillar: Pillar;
  startAge: number;   // 만 나이 (년 단위 내림)
  startYear: number;  // 교운 시작 연도 (근사)
}

export interface DaeunResult {
  forward: boolean;        // 순행 여부
  daeunSu: number;         // 통상 표기 대운수 (반올림, 최소 1)
  startAgeMonths: number;  // 첫 교운까지 개월 수 (만 나이 기준)
  cycles: DaeunCycle[];
}

const dayMs = 86400000;

/** {stem, branch} → 60갑자 인덱스 (CRT) */
function ganzhiIndex(p: Pillar): number {
  for (let i = p.stem; i < 60; i += 10) if (i % 12 === p.branch) return i;
  return 0;
}

function termMs(year: number, encoded: number): number {
  const mm = Math.floor(encoded / 1000000);
  const dd = Math.floor(encoded / 10000) % 100;
  const hh = Math.floor(encoded / 100) % 100;
  const mi = encoded % 100;
  return Date.UTC(year, mm - 1, dd, hh, mi);
}

/** 출생 전후 3년치 절 입기 시각을 시간순으로 */
function nearbyTerms(y: number): number[] {
  const out: number[] = [];
  for (const yy of [y - 1, y, y + 1]) {
    if (yy < TERMS_FROM || yy > TERMS_TO) continue;
    for (const enc of TERMS_KST[yy]) out.push(termMs(yy, enc));
  }
  return out.sort((a, b) => a - b);
}

/**
 * 대운 계산. 출생 시(hh)·분(mi)은 실제 시각(KST) — 시진보다 정밀하게 대운수를 잡는다.
 * 절기 테이블 범위(1920~2040) 밖 출생은 지원하지 않고 null을 돌려준다.
 */
export function daeun(
  y: number, m: number, d: number, hh: number, mi: number,
  gender: 'M' | 'F', pillars: FourPillars, count = 9
): DaeunResult | null {
  if (y - 1 < TERMS_FROM || y + 1 > TERMS_TO) return null;
  const birth = Date.UTC(y, m - 1, d, hh, mi);
  const forward = stemIsYang(pillars.year.stem) === (gender === 'M');
  const terms = nearbyTerms(y);
  const next = terms.find((t) => t > birth);
  const prev = [...terms].reverse().find((t) => t <= birth);
  if (next === undefined || prev === undefined) return null;

  const gapDays = (forward ? next - birth : birth - prev) / dayMs;
  const months = Math.round((gapDays / 3) * 12); // 1일 = 4개월
  const daeunSu = Math.max(1, Math.round(gapDays / 3));

  const base = ganzhiIndex(pillars.month);
  const cycles: DaeunCycle[] = [];
  for (let i = 1; i <= count; i++) {
    const idx = ((base + (forward ? i : -i)) % 60 + 60) % 60;
    // 한국 만세력 관례: 첫 교운 나이 = 대운수, 이후 10년 간격
    const startAge = daeunSu + (i - 1) * 10;
    cycles.push({ pillar: splitGanzhi(idx), startAge, startYear: y + startAge });
  }
  return { forward, daeunSu, startAgeMonths: months, cycles };
}
