// 궁합 엔진 — 두 사주의 5요소 점수와 총점(0~100)을 결정론적으로 계산한다.
// 점수는 규칙 기반(재현 가능), 풀이 문장은 템플릿에서 생성한다.

import {
  branchElement, branchesClash, branchesSixHarmony, branchesTrine, branchIsYang,
  Element, elementRelation, ELEMENT_HANJA, Pillar, stemElement, STEMS_KO, stemIsYang, stemsCombine,
} from './ganzhi';
import { FourPillars } from './manseryeok';

export interface CompatResult {
  total: number;           // 0~100
  parts: { label: string; score: number }[]; // 5요소
  precise: boolean;        // 양쪽 모두 시주 보유
  headline: string;        // 카드용 한 줄 요약
  reading: string;         // 상세 풀이 문단
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(v)));

function chartElements(p: FourPillars): Element[] {
  const els: Element[] = [];
  const pillars: Pillar[] = [p.year, p.month, p.day];
  if (p.hour) pillars.push(p.hour);
  for (const pl of pillars) { els.push(stemElement(pl.stem)); els.push(branchElement(pl.branch)); }
  return els;
}

function yangRatio(p: FourPillars): number {
  const pillars: Pillar[] = [p.year, p.month, p.day];
  if (p.hour) pillars.push(p.hour);
  let yang = 0, n = 0;
  for (const pl of pillars) { yang += (stemIsYang(pl.stem) ? 1 : 0) + (branchIsYang(pl.branch) ? 1 : 0); n += 2; }
  return yang / n;
}

/** 1. 오행 상생·보완 — 일간 오행 관계 + 결핍 오행 보완 */
function elementScore(a: FourPillars, b: FourPillars): number {
  const ea = stemElement(a.day.stem), eb = stemElement(b.day.stem);
  const rel = elementRelation(ea, eb);
  let base = rel === 'same' ? 72 : rel === 'a-gives-b' || rel === 'b-gives-a' ? 90 : 58;
  // 상대가 내 사주에 부족한 오행을 채워주면 가산
  const mine = new Set(chartElements(a));
  const theirs = chartElements(b);
  const supplied = theirs.filter((e) => !mine.has(e)).length;
  base += Math.min(10, supplied * 3);
  return clamp(base);
}

/** 2. 일간 궁합 — 천간합 > 상생 > 비화 > 상극, 음양이 다르면 유정 가산 */
function dayMasterScore(a: FourPillars, b: FourPillars): number {
  const sa = a.day.stem, sb = b.day.stem;
  let base: number;
  if (stemsCombine(sa, sb)) base = 95;
  else {
    const rel = elementRelation(stemElement(sa), stemElement(sb));
    base = rel === 'same' ? 68 : rel === 'a-gives-b' || rel === 'b-gives-a' ? 82 : 56;
  }
  if (stemIsYang(sa) !== stemIsYang(sb)) base += 5;
  return clamp(base);
}

/** 3. 지지 합·충 — 일지 중심, 월지는 보조 */
function branchScore(a: FourPillars, b: FourPillars): number {
  const da = a.day.branch, db = b.day.branch;
  let base: number;
  if (branchesSixHarmony(da, db)) base = 92;
  else if (branchesTrine(da, db)) base = 86;
  else if (branchesClash(da, db)) base = 45;
  else if (da === db) base = 74;
  else base = 70;
  const ma = a.month.branch, mb = b.month.branch;
  if (branchesSixHarmony(ma, mb) || branchesTrine(ma, mb)) base += 5;
  else if (branchesClash(ma, mb)) base -= 5;
  return clamp(base);
}

/** 4. 띠 궁합 — 연지 삼합/육합/충 */
function zodiacScore(a: FourPillars, b: FourPillars): number {
  const ya = a.year.branch, yb = b.year.branch;
  if (branchesTrine(ya, yb)) return 90;
  if (branchesSixHarmony(ya, yb)) return 88;
  if (branchesClash(ya, yb)) return 50;
  if (ya === yb) return 76;
  return 72;
}

/** 5. 음양 균형 — 두 사주의 양 비율 합이 1에 가까울수록 보완적 */
function yinYangScore(a: FourPillars, b: FourPillars): number {
  const diff = Math.abs(yangRatio(a) + yangRatio(b) - 1);
  return clamp(100 - diff * 55, 40, 100);
}

const WEIGHTS = [0.28, 0.24, 0.22, 0.14, 0.12];
export const PART_LABELS = ['오행 상생', '일간 궁합', '지지 합·충', '띠 궁합', '음양 균형'];

// 받침 유무에 따른 조사 (목/금만 받침 있음)
const ga = (e: Element) => (e === '목' || e === '금' ? '이' : '가');
const eul = (e: Element) => (e === '목' || e === '금' ? '을' : '를');

function headlineFor(a: FourPillars, b: FourPillars, total: number): string {
  const ea = stemElement(a.day.stem), eb = stemElement(b.day.stem);
  if (stemsCombine(a.day.stem, b.day.stem))
    return `${STEMS_KO[b.day.stem]}${STEMS_KO[a.day.stem]}합 — 서로를 길들이며 하나가 되는 천간합`;
  const rel = elementRelation(ea, eb);
  const h = (e: Element) => `${e}(${ELEMENT_HANJA[e]})`;
  switch (rel) {
    case 'b-gives-a': return `${h(eb)}${ga(eb)} ${h(ea)}${eul(ea)} 살리는 상생의 합`;
    case 'a-gives-b': return `${h(ea)}${ga(ea)} ${h(eb)}${eul(eb)} 키우는 상생의 합`;
    case 'same': return `같은 ${h(ea)} 기운 — 서로를 가장 잘 아는 비화의 합`;
    default: return total >= 70 ? `극이 곧 흉이 아닌, 서로를 다듬는 합` : `기운이 부딪히는 만큼 배울 것이 많은 합`;
  }
}

function readingFor(a: FourPillars, b: FourPillars, parts: number[]): string {
  const ea = stemElement(a.day.stem), eb = stemElement(b.day.stem);
  const rel = elementRelation(ea, eb);
  const lines: string[] = [];
  if (stemsCombine(a.day.stem, b.day.stem))
    lines.push('두 사람의 일간은 천간합 — 명리에서 가장 강하게 끌리는 짝으로 봅니다. 서로 다른 기질이 맞물리며 하나의 기운을 이루는 관계예요.');
  else if (rel === 'b-gives-a') lines.push(`상대의 ${eb} 기운이 당신의 ${ea} 기운을 살리는 상생 구조입니다. 곁에 있는 것만으로 힘을 받는 쪽은 당신이에요.`);
  else if (rel === 'a-gives-b') lines.push(`당신의 ${ea} 기운이 상대의 ${eb} 기운을 키우는 상생 구조입니다. 아낌없이 주게 되는 관계 — 받는 법도 함께 연습하면 좋아요.`);  else if (rel === 'same') lines.push(`같은 ${ea} 기운의 두 사람. 설명 없이 통하는 편안함이 장점이지만, 닮은 만큼 부딪히는 지점도 닮아 있어요.`);
  else lines.push(`오행으로는 극(克)의 관계지만, 명리에서 극은 "다듬는 힘"이기도 합니다. 주도권의 균형만 잡히면 서로를 성장시키는 짝이에요.`);

  if (branchesSixHarmony(a.day.branch, b.day.branch)) lines.push('일지가 육합 — 일상의 합이 좋아 함께 있는 시간이 자연스럽게 편안해집니다.');
  else if (branchesTrine(a.day.branch, b.day.branch)) lines.push('일지가 삼합 — 같은 방향을 바라보는 동지 같은 합입니다.');
  else if (branchesClash(a.day.branch, b.day.branch)) lines.push('일지가 충이라 초반 티키타카가 격할 수 있어요. 다만 충은 "움직임"의 기운이라, 서로를 흔들며 정드는 구조에 가깝습니다.');

  if (parts[4] >= 85) lines.push('음양의 비율이 정확히 서로를 보완합니다. 한쪽이 나서면 한쪽이 받쳐주는 균형이에요.');
  return lines.join(' ');
}

export function compatibility(a: FourPillars, b: FourPillars): CompatResult {
  const parts = [elementScore(a, b), dayMasterScore(a, b), branchScore(a, b), zodiacScore(a, b), yinYangScore(a, b)];
  const total = clamp(parts.reduce((s, v, i) => s + v * WEIGHTS[i], 0));
  return {
    total,
    parts: parts.map((score, i) => ({ label: PART_LABELS[i], score })),
    precise: a.hour !== null && b.hour !== null,
    headline: headlineFor(a, b, total),
    reading: readingFor(a, b, parts),
  };
}
