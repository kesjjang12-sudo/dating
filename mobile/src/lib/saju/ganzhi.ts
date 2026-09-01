// 60갑자 기초 데이터 — 천간/지지, 오행, 음양, 상생·상극 관계

export const STEMS_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
export const STEMS_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const BRANCHES_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
export const BRANCHES_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const BRANCH_ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'] as const;

// 시진: 자시 23~01, 축시 01~03 …
export const HOUR_RANGES = ['23–01', '01–03', '03–05', '05–07', '07–09', '09–11', '11–13', '13–15', '15–17', '17–19', '19–21', '21–23'] as const;

export type Element = '목' | '화' | '토' | '금' | '수';
export const ELEMENTS: Element[] = ['목', '화', '토', '금', '수'];
export const ELEMENT_HANJA: Record<Element, string> = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };

// 천간 오행: 갑을=목 병정=화 무기=토 경신=금 임계=수
const STEM_ELEMENT: Element[] = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
// 지지 오행: 자=수 축=토 인=목 묘=목 진=토 사=화 오=화 미=토 신=금 유=금 술=토 해=수
const BRANCH_ELEMENT: Element[] = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];

export const stemElement = (s: number): Element => STEM_ELEMENT[s % 10];
export const branchElement = (b: number): Element => BRANCH_ELEMENT[b % 12];
export const stemIsYang = (s: number): boolean => s % 2 === 0;
export const branchIsYang = (b: number): boolean => b % 2 === 0;

// 오행 상생: 목→화→토→금→수→목
const SHENG: Record<Element, Element> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
// 오행 상극: 목→토, 토→수, 수→화, 화→금, 금→목
const KE: Record<Element, Element> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };

export const generates = (a: Element, b: Element): boolean => SHENG[a] === b;
export const controls = (a: Element, b: Element): boolean => KE[a] === b;

/** 두 오행의 관계 */
export type ElementRelation = 'same' | 'a-gives-b' | 'b-gives-a' | 'a-controls-b' | 'b-controls-a';
export function elementRelation(a: Element, b: Element): ElementRelation {
  if (a === b) return 'same';
  if (generates(a, b)) return 'a-gives-b';
  if (generates(b, a)) return 'b-gives-a';
  if (controls(a, b)) return 'a-controls-b';
  return 'b-controls-a';
}

// 천간합: 갑기, 을경, 병신, 정임, 무계 (index 차가 5)
export const stemsCombine = (a: number, b: number): boolean => (a + 5) % 10 === b % 10 || (b + 5) % 10 === a % 10;

// 지지 육합: 자축, 인해, 묘술, 진유, 사신, 오미
const SIX_HARMONY: [number, number][] = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
export const branchesSixHarmony = (a: number, b: number): boolean =>
  SIX_HARMONY.some(([x, y]) => (a % 12 === x && b % 12 === y) || (a % 12 === y && b % 12 === x));

// 지지 삼합: 신자진(수국), 해묘미(목국), 인오술(화국), 사유축(금국)
const TRINES: number[][] = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];
export const branchesTrine = (a: number, b: number): boolean =>
  a % 12 !== b % 12 && TRINES.some((t) => t.includes(a % 12) && t.includes(b % 12));

// 지지 충: 마주보는 지지 (index 차가 6)
export const branchesClash = (a: number, b: number): boolean => (a % 12 + 6) % 12 === b % 12;

/** 육십갑자 인덱스(0=갑자)에서 간지 분해 */
export const splitGanzhi = (idx: number) => ({ stem: ((idx % 60) + 60) % 60 % 10, branch: ((idx % 60) + 60) % 60 % 12 });

/** 간지 → 육십갑자 인덱스 (DB 캐시 컬럼용) */
export function ganzhiIndex(p: Pillar): number {
  for (let i = 0; i < 60; i++) if (i % 10 === p.stem && i % 12 === p.branch) return i;
  return 0;
}

export interface Pillar { stem: number; branch: number; }
export const pillarKo = (p: Pillar): string => STEMS_KO[p.stem] + BRANCHES_KO[p.branch];
export const pillarHanja = (p: Pillar): string => STEMS_HANJA[p.stem] + BRANCHES_HANJA[p.branch];

// 오행 → 방위 / 색
export const ELEMENT_DIRECTION: Record<Element, string> = { 목: '동쪽', 화: '남쪽', 토: '중심(가까운 곳)', 금: '서쪽', 수: '북쪽' };
