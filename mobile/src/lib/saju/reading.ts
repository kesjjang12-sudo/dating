// 상세 궁합 풀이 생성기 — 두 사주에서 지장간·십이운성·신살·글자 관계·대운·세운을 계산하고
// 규칙 기반 템플릿으로 긴 풀이(상대 사주 읽기 + 커플 궁합 + 시기)를 만든다. 결정론적.

import { compatibility, CompatResult } from './compat';
import { daeun } from './daeun';
import {
  BRANCH_ANIMALS, BRANCHES_HANJA, BRANCHES_KO, branchElement, branchesClash, branchesSixHarmony, branchesTrine,
  Element, ELEMENTS, elementRelation, ganzhiIndex, Pillar, pillarHanja, pillarKo, splitGanzhi, stemElement,
  stemIsYang, STEMS_HANJA, STEMS_KO, stemsCombine,
} from './ganzhi';
import { FourPillars } from './manseryeok';

// 받침 유무 조사
const hasFinal = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
const GA = (w: string) => hasFinal(w) ? "이" : "가";
const EUL = (w: string) => hasFinal(w) ? "을" : "를";
const IRA = (w: string) => hasFinal(w) ? "이라" : "라";

// ── 기초 표 ──────────────────────────────────────────────
export const MAIN_QI = [9, 5, 0, 1, 4, 2, 3, 5, 6, 7, 4, 8]; // 지지 본기 천간
const HIDDEN: number[][] = [[8, 9], [9, 7, 5], [4, 2, 0], [0, 1], [1, 9, 4], [4, 6, 2], [2, 5, 3], [3, 1, 5], [4, 8, 6], [6, 7], [7, 3, 4], [4, 0, 8]];
const GEN: Record<Element, Element> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const CTRL: Record<Element, Element> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };
const GEN_BY: Record<Element, Element> = { 화: '목', 토: '화', 금: '토', 수: '금', 목: '수' };
const CTRL_BY: Record<Element, Element> = { 토: '목', 수: '토', 화: '수', 금: '화', 목: '금' };
const STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'];
const STAGE_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
const GONGMANG = [[10, 11], [8, 9], [6, 7], [4, 5], [2, 3], [0, 1]];
export const CHEONEUL: number[][] = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3]];
const MUNCHANG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];
const HONGYEOM = [6, 8, 2, 7, 4, 4, 10, 9, 0, 8];
const TRI_GROUPS = [[8, 0, 4], [2, 6, 10], [5, 9, 1], [11, 3, 7]];
const DOHWA = [9, 3, 6, 0], YEOKMA = [2, 8, 11, 5], HWAGAE = [4, 10, 1, 7];
const BAEKHO = new Set(['甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑']);
const WONJIN: [number, number][] = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];

export type Sipsin = '비견' | '겁재' | '식신' | '상관' | '편재' | '정재' | '편관' | '정관' | '편인' | '정인';
type Group = '비겁' | '식상' | '재성' | '관성' | '인성';
export type { Group };
export const GROUP_OF: Record<Sipsin, Group> = {
  비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성',
};

export function sipsin(dayStem: number, other: number): Sipsin {
  const de = stemElement(dayStem), oe = stemElement(other);
  const same = stemIsYang(dayStem) === stemIsYang(other);
  if (oe === de) return same ? '비견' : '겁재';
  if (GEN[de] === oe) return same ? '식신' : '상관';
  if (CTRL[de] === oe) return same ? '편재' : '정재';
  if (CTRL[oe] === de) return same ? '편관' : '정관';
  return same ? '편인' : '정인';
}
export const sipsinB = (d: number, b: number) => sipsin(d, MAIN_QI[b]);
export const stage12 = (d: number, b: number): string =>
  STAGES[stemIsYang(d) ? (b - STAGE_START[d] + 12) % 12 : (STAGE_START[d] - b + 12) % 12];
const triOf = (b: number) => TRI_GROUPS.findIndex((g) => g.includes(b));
const isWonjin = (a: number, b: number) => WONJIN.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

// ── 타입 ────────────────────────────────────────────────
export interface Person { name: string; gender: 'M' | 'F'; pillars: FourPillars; }
export interface PillarInfo {
  label: string; p: Pillar | null; stemSipsin: Sipsin | null; branchSipsin: Sipsin | null; stage: string | null;
  hidden: { stem: number; sipsin: Sipsin }[];
}
export interface Badge { label: string; where: string; tone: 'good' | 'warn' | 'mut'; }
export interface PersonAnalysis {
  name: string; gender: 'M' | 'F'; pillars: PillarInfo[]; dayStem: number; element: Element; yang: boolean;
  nick: string; animal: string; elementCount: Record<Element, number>; groupCount: Record<Group, number>;
  weak: boolean; favorable: Element[]; avoid: Element; gyeokguk: string; badges: Badge[];
  hasStage: boolean; gongmang: number[];
}
export interface Relation { left: string; right: string; kind: string; tone: 'good' | 'warn' | 'mut'; desc: string; }
export interface Section { key: string; label: string; title: string; paras: string[]; tldr?: string; }
export interface LuckNow { pillar: Pillar; stemS: Sipsin; branchS: Sipsin; stage: string; startAge: number; marriage: boolean; }
export interface FullReading {
  me: PersonAnalysis; them: PersonAnalysis; compat: CompatResult; relations: Relation[];
  themSections: Section[]; coupleSections: Section[]; timingSections: Section[];
  luck: { me: LuckNow | null; them: LuckNow | null; year: number; yearPillar: Pillar };
}

// ── 일간 캐릭터 ─────────────────────────────────────────
export const DM: Record<number, { nick: string; one: string; loveOne: string; who: string; love: string }> = {
  0: { nick: '큰 나무', one: '앞장서고 잘 굽히지 않는 사람', loveOne: '좋아하면 직진, 한번 정한 마음은 잘 안 바꿔요', who: '갑목(甲木)은 하늘로 곧게 자라는 큰 나무입니다. 이 일간의 사람은 앞장서는 기질이 있고, 옳다고 믿는 방향으로 밀고 가며, 굽히는 걸 잘 못 합니다. 리더 기질과 고집이 한 몸이에요. 남 밑에서 오래 있기보다 제 그늘을 만들어 사람을 품는 쪽이 어울립니다.', love: '좋아하면 직진합니다. 밀당이 서툴고, 한번 마음을 정하면 잘 안 바꿉니다. 대신 상대를 자기 방식으로 끌고 가려는 습관이 있어 — 상대에게 숨 쉴 틈을 주는 연습이 필요해요.' },
  1: { nick: '풀과 덩굴', one: '부드럽지만 질기게 버티는 사람', loveOne: '맞춰 주는 연애, 속마음은 다 보여 주지 않아요', who: '을목(乙木)은 바위 틈에서도 뻗어나가는 풀과 덩굴입니다. 겉은 유연하고 부드럽지만 생명력이 질기고, 어떤 환경에도 적응합니다. 사람을 잘 읽고 분위기를 맞추는 데 능하며, 정면으로 부딪히는 대신 돌아가는 법을 알아요. 실속을 챙기는 현실감각이 있습니다.', love: '상대에게 맞춰 주며 관계를 이어가는 편입니다. 다정하고 눈치가 빠른데, 그만큼 속마음을 다 보이지 않아요. 기댈 나무(든든한 상대)를 찾는 성향이 있습니다.' },
  2: { nick: '태양', one: '밝고 숨기는 게 없는 사람', loveOne: '표현이 커서 좋아하면 온 세상이 알게 돼요', who: '병화(丙火)는 만물을 비추는 태양입니다. 밝고 화통하고 숨기는 게 없어요. 어디서든 존재감이 있고, 사람들 한가운데서 힘이 나며, 그늘진 사람을 밝혀 주는 재능이 있습니다. 대신 감정이 얼굴에 다 드러나고, 뒤끝은 없지만 순간 화력은 세요.', love: '표현이 크고 시원합니다. 좋아하면 온 세상이 알게 되고, 상대를 아낌없이 비춰 줍니다. 다만 태양은 한 사람만 비추는 법을 모르는 별이라 — 질투 많은 상대와는 부딪힐 수 있어요.' },
  3: { nick: '화롯불', one: '은근하게 오래 타는 사람', loveOne: '티 안 내고 오래 좋아하고, 말은 늦어요', who: '정화(丁火)는 태양이 아니라 촛불·화롯불입니다. 은근하고 오래 타는 온기, 한 곳을 깊이 비추는 집중력이 있어요. 겉은 순해 보이지만 심지가 있고, 어두운 곳에서 더 귀해지는 불이라 어려운 시절에 진가가 드러납니다. 세심하고 예민하며 정신적인 것에 끌립니다.', love: '티 안 나게 오래 좋아하고, 말은 늦습니다. 한번 마음을 주면 헌신적이고 관계가 끝나도 오래 남아요. 상대가 마음을 모르는 게 이 사주의 연애 문제 — 표현을 연습해야 합니다.' },
  4: { nick: '큰 산', one: '묵직하고 끝까지 책임지는 사람', loveOne: '느리게 시작해서 오래 가요', who: '무토(戊土)는 큰 산, 넓은 들입니다. 묵직하고 신용이 있고, 한번 맡은 건 끝까지 책임집니다. 감정 기복이 적어 곁에 있으면 안정감을 주지만, 변화에 느리고 고집이 세며 속을 잘 안 보여요. 사람들이 기대는 자리에 서는 명식입니다.', love: '느리게 시작해서 오래 갑니다. 화려한 이벤트보다 꾸준함으로 사랑을 증명하는 유형이에요. 표현이 적어 답답하다는 소리를 듣지만, 떠나지 않는 것이 이 사주의 사랑법입니다.' },
  5: { nick: '기름진 밭', one: '조용히 돌보고 실속을 챙기는 사람', loveOne: '말보다 행동으로 사랑해요', who: '기토(己土)는 만물을 기르는 밭의 흙입니다. 포용력이 있고 남을 돌보는 데 재능이 있으며, 실속을 챙기면서도 티를 내지 않아요. 겉은 순하지만 안에 계산이 서 있고, 한번 마음이 떠나면 조용히 정리합니다. 살림·경영·교육처럼 무언가를 키우는 일에 강합니다.', love: '상대를 잘 챙기고 잘 받아 줍니다. 헌신적인데, 그 헌신을 당연하게 여기는 상대에게는 상처를 오래 품어요. 말 대신 행동으로 사랑하는 유형입니다.' },
  6: { nick: '무쇠', one: '맺고 끊음이 분명한 사람', loveOne: '무뚝뚝하지만 행동은 확실해요', who: '경금(庚金)은 아직 다듬어지지 않은 무쇠·바위입니다. 결단이 빠르고 의리가 있으며, 맺고 끊는 게 분명합니다. 정의감이 강해 불의를 보면 나서고, 그만큼 적도 생겨요. 다듬어질수록(고생할수록) 빛나는 명식이라 젊어서의 단련이 훗날의 무기가 됩니다.', love: '좋고 싫음이 분명하고, 사귀면 의리로 지킵니다. 감정 표현은 무뚝뚝하지만 행동은 확실해요. 자존심이 세서 먼저 사과하기 어려운 게 약점입니다.' },
  7: { nick: '보석', one: '섬세하고 기준이 확실한 사람', loveOne: '아무나 안 만나고, 만나면 뜨거워요', who: '신금(辛金)은 이미 세공이 끝난 보석·장신구의 금입니다. 섬세하고 눈썰미가 예리하며 자기 기준이 분명해요. 남들은 까다롭다 하지만 본인은 정확한 겁니다. 겉은 부드러운데 속에 칼날이 있고, 그 칼날은 자기 자신에게 더 자주 향합니다. 알아봐 주는 사람 앞에서 빛나고, 함부로 다루는 사람에겐 차갑게 식습니다.', love: '끌어당기되 쉽게 열지 않습니다. 취향이 확실해 아무나 만나지 않고, 사귀면 뜨겁고 헤어지면 매섭게 정리해요. 상대의 허점을 정확히 짚는 말이 나오는 게 이 사주의 연애 약점입니다.' },
  8: { nick: '큰 바다', one: '그릇이 크고 자유로운 사람', loveOne: '깊게 사랑하지만 얽매이는 건 싫어해요', who: '임수(壬水)는 큰 강, 바다입니다. 그릇이 크고 생각이 깊으며, 겉은 잔잔해도 속으론 끊임없이 움직입니다. 지혜와 융통성이 있고 사람을 가리지 않지만, 방향이 정해지지 않으면 넘치거나 흩어지기 쉬워요. 자유를 중시하고 얽매이는 걸 싫어합니다.', love: '깊고 넓게 사랑하지만 한 곳에 오래 머무는 걸 스스로 의심하는 별입니다. 정신적 교류가 되는 상대에게 끌리고, 구속하는 상대에게선 빠져나갑니다.' },
  9: { nick: '이슬비', one: '조용히 상황을 다 읽고 있는 사람', loveOne: '상대 기분을 먼저 읽고, 상처는 혼자 삭여요', who: '계수(癸水)는 이슬, 안개, 조용히 스미는 비입니다. 감수성이 예민하고 직관이 뛰어나며, 조용히 상황을 읽어 낸 뒤 스며들듯 움직입니다. 눈에 띄지 않게 일을 이루는 타입이고, 속으로 생각이 아주 많아요. 예술·연구·상담처럼 깊이가 필요한 일에 어울립니다.', love: '섬세하고 감정 이입이 깊어 상대의 기분을 먼저 읽습니다. 다만 상처도 깊게 받고 혼자 삭이는 편이라 — 마음을 말로 꺼내 놓는 상대를 만나야 편해집니다.' },
};

const GROUP_TEXT: Record<Group, string> = {
  비겁: '십성 중 비겁(比劫 — 나와 같은 기운, 자존·독립의 별)이 가장 두드러집니다. 쉽게 말해 제 밥그릇은 제가 챙기는 사람이에요. 남에게 기대는 걸 어려워하고, 경쟁이 붙으면 오히려 힘이 납니다.',
  식상: '십성 중 식상(食傷 — 내가 만들어 내는 기운, 표현·재능의 별)이 가장 두드러집니다. 쉽게 말해 말·글·손끝·아이디어로 자기를 드러내는 사람이에요. 담아 두면 병이 되고 꺼내 놓으면 복이 되는 유형입니다.',
  재성: '십성 중 재성(財星 — 내가 다루는 기운, 재물·현실의 별)이 가장 두드러집니다. 쉽게 말해 돈의 흐름과 현실 감각이 좋고 결과로 말하는 사람이에요. 다만 욕심보다 체력이 먼저 바닥나는 재다신약(財多身弱) 경향은 살펴야 합니다.',
  관성: '십성 중 관성(官星 — 나를 누르고 다듬는 기운, 책임·규범의 별)이 가장 두드러집니다. 쉽게 말해 예의 바르고 참을성이 많아 조직에서 신뢰를 얻는 사람이에요. 그만큼 눌리는 것도 많아 혼자 다 짊어지면 탈이 납니다.',
  인성: '십성 중 인성(印星 — 나를 낳고 키우는 기운, 배움·사고의 별)이 가장 두드러집니다. 쉽게 말해 배운 것으로 서고 아는 것으로 신뢰를 얻는 사람이에요. 생각이 많아 결정이 느리지만, 한번 내리면 잘 바꾸지 않습니다.',
};

const STAGE_GOOD = new Set(['장생', '관대', '건록', '제왕']);
const STAGE_BAD = new Set(['절', '묘', '사', '병']);

// ── 개인 분석 ───────────────────────────────────────────
export function analyze(person: Person): PersonAnalysis {
  const f = person.pillars, d = f.day.stem;
  const cols: [string, Pillar | null][] = [['시주', f.hour], ['일주', f.day], ['월주', f.month], ['년주', f.year]];
  const pillars: PillarInfo[] = cols.map(([label, p]) => p ? {
    label, p,
    stemSipsin: label === '일주' ? null : sipsin(d, p.stem),
    branchSipsin: sipsinB(d, p.branch),
    stage: stage12(d, p.branch),
    hidden: HIDDEN[p.branch].map((s) => ({ stem: s, sipsin: sipsin(d, s) })),
  } : { label, p: null, stemSipsin: null, branchSipsin: null, stage: null, hidden: [] });

  const elementCount: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const groupCount: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  let support = 0, total = 0;
  const W: Record<string, number> = { 시주: 1, 일주: 1.5, 월주: 2, 년주: 1 };
  for (const pi of pillars) {
    if (!pi.p) continue;
    elementCount[stemElement(pi.p.stem)]++; elementCount[branchElement(pi.p.branch)]++;
    if (pi.stemSipsin) { groupCount[GROUP_OF[pi.stemSipsin]]++; total += 1; if (['비겁', '인성'].includes(GROUP_OF[pi.stemSipsin])) support += 1; }
    if (pi.branchSipsin) { groupCount[GROUP_OF[pi.branchSipsin]]++; total += W[pi.label]; if (['비겁', '인성'].includes(GROUP_OF[pi.branchSipsin])) support += W[pi.label]; }
  }
  const weak = support / total < 0.45;
  const el = stemElement(d);
  const favorable: Element[] = weak ? [GEN_BY[el], el] : [CTRL[el], GEN[el]];
  const avoid: Element = weak ? (groupCount.관성 >= groupCount.식상 ? CTRL_BY[el] : GEN[el]) : GEN_BY[el];

  const monthS = pillars[2].branchSipsin!;
  const gyeokguk = monthS === '비견' ? '건록격' : monthS === '겁재' ? '월겁격' : `${monthS}격`;

  // 신살
  const badges: Badge[] = [];
  const at = (b: number) => pillars.filter((pi) => pi.p && pi.p.branch === b).map((pi) => pi.label.replace('주', '지'));
  const gm = GONGMANG[Math.floor(ganzhiIndex(f.day) / 10)];
  for (const b of CHEONEUL[d]) for (const w of at(b)) badges.push({ label: '천을귀인', where: w, tone: 'good' });
  for (const w of at(MUNCHANG[d])) badges.push({ label: '문창귀인', where: w, tone: 'good' });
  for (const w of at(HONGYEOM[d])) badges.push({ label: '홍염살', where: w, tone: 'good' });
  const t = triOf(f.year.branch);
  for (const w of at(DOHWA[t])) badges.push({ label: '도화살', where: w, tone: 'good' });
  for (const w of at(YEOKMA[t])) badges.push({ label: '역마살', where: w, tone: 'mut' });
  for (const w of at(HWAGAE[t])) badges.push({ label: '화개살', where: w, tone: 'mut' });
  for (const b of gm) for (const w of at(b)) if (w !== '일지') badges.push({ label: '공망', where: w, tone: 'mut' });
  for (const pi of pillars) if (pi.p && BAEKHO.has(pillarHanja(pi.p))) badges.push({ label: '백호대살', where: pi.label, tone: 'warn' });
  const hasJ = pillars.some((pi) => pi.stemSipsin === '정관' || pi.branchSipsin === '정관');
  const hasP = pillars.some((pi) => pi.stemSipsin === '편관' || pi.branchSipsin === '편관');
  if (hasJ && hasP) badges.push({ label: '관살혼잡', where: '관성 혼재', tone: 'warn' });
  for (const pi of pillars) if (pi.stage && STAGE_GOOD.has(pi.stage) && pi.label !== '시주') badges.push({ label: pi.stage, where: pi.label.replace('주', '지'), tone: 'mut' });

  return {
    name: person.name, gender: person.gender, pillars, dayStem: d, element: el, yang: stemIsYang(d),
    nick: DM[d].nick, animal: BRANCH_ANIMALS[f.year.branch], elementCount, groupCount, weak, favorable, avoid, gyeokguk, badges,
    hasStage: f.hour !== null, gongmang: gm,
  };
}

// ── 두 사주 사이 관계 ─────────────────────────────────────
const POS_NAME: Record<string, string> = { 시주: '시', 일주: '일', 월주: '월', 년주: '년' };
const posDesc = (a: string, b: string) => {
  if (a === '일주' && b === '일주') return '배우자궁끼리';
  if (a === '일주' || b === '일주') return '한쪽의 배우자궁과';
  if (a === '월주' || b === '월주') return '사회궁(월주)과';
  return '';
};

export function relations(me: PersonAnalysis, them: PersonAnalysis): Relation[] {
  const out: Relation[] = [];
  const L = (pi: PillarInfo, ch: string, stem = false) => `${ch}(${me.name} ${POS_NAME[pi.label]}${stem ? "간" : "지"})`;
  const Rr = (pi: PillarInfo, ch: string, stem = false) => `${ch}(${them.name} ${POS_NAME[pi.label]}${stem ? "간" : "지"})`;
  // 천간합
  for (const a of me.pillars) for (const b of them.pillars) {
    if (!a.p || !b.p) continue;
    if (stemsCombine(a.p.stem, b.p.stem)) {
      const dm = a.label === '일주' || b.label === '일주';
      out.push({
        left: L(a, STEMS_HANJA[a.p.stem], true), right: Rr(b, STEMS_HANJA[b.p.stem], true), kind: `${STEMS_KO[Math.min(a.p.stem, b.p.stem)]}${STEMS_KO[Math.max(a.p.stem, b.p.stem)]}합`, tone: 'good',
        desc: dm ? '일간이 상대의 글자와 천간합 — 이유를 설명하기 어려운 끌림이 여기서 나옵니다. 처음부터 편한 느낌의 근거예요.' : '천간이 합을 이룹니다. 서로의 기운이 섞여 하나가 되는 자리 — 함께 있을 때 마음이 놓입니다.',
      });
    }
  }
  // 지지
  for (const a of me.pillars) for (const b of them.pillars) {
    if (!a.p || !b.p) continue;
    const x = a.p.branch, y = b.p.branch, pd = posDesc(a.label, b.label);
    const lf = L(a, BRANCHES_HANJA[x]), rt = Rr(b, BRANCHES_HANJA[y]);
    if (x === y && a.label === '일주' && b.label === '일주')
      out.push({ left: lf, right: rt, kind: '일지 동일', tone: 'good', desc: '두 사람의 배우자궁 글자가 같습니다. 생활의 결이 닮아 설명 없이 통하는 편안함 — 대신 닮은 만큼 부딪히는 지점도 닮았어요.' });
    else if (branchesSixHarmony(x, y))
      out.push({ left: lf, right: rt, kind: '육합', tone: 'good', desc: `${pd} 육합 — 일상의 합이에요. 함께 있는 시간이 자연스럽게 편안해지고, 오래 갈수록 붙는 합입니다.` });
    else if (branchesTrine(x, y))
      out.push({ left: lf, right: rt, kind: '삼합(반합)', tone: 'good', desc: `${pd} 삼합 — 같은 방향을 보는 동지의 합. 인생관·큰 결정에서 한 배를 타는 자리입니다.` });
    else if (branchesClash(x, y))
      out.push({ left: lf, right: rt, kind: '충', tone: 'warn', desc: a.label === '일주' && b.label === '일주' ? '배우자궁끼리 정면 충. 정리 습관·돈 쓰는 순서·쉬는 방식처럼 일상의 결이 달라 자주 부딪힙니다 — 다만 충은 깨지는 기운이 아니라 움직이는 기운이라, 지루할 틈이 없는 관계이기도 해요.' : `${pd} 충 — 서로의 리듬이 어긋나는 자리. 큰 파도는 아니지만 시간과 우선순위에서 다툼이 생깁니다.` });
    else if (isWonjin(x, y))
      out.push({ left: lf, right: rt, kind: '원진', tone: 'warn', desc: '이유 없이 거슬리는 자리. 크게 싸우는 살이 아니라 속으로 "왜 저러지" 하게 되는 살 — 입 밖으로 꺼내 웃어 버리면 힘을 잃습니다.' });
  }
  // 귀인 글자 교차
  const themHasMine = them.pillars.filter((pi) => pi.p && CHEONEUL[me.dayStem].includes(pi.p.branch));
  for (const pi of themHasMine) out.push({ left: `${me.name}의 천을귀인 글자`, right: Rr(pi, BRANCHES_HANJA[pi.p!.branch]), kind: '귀인 동좌', tone: 'good', desc: `${them.name}님의 명식에 ${me.name}님의 천을귀인 글자가 있습니다. 상대가 곧 나의 귀인이라는 뜻 — 곁에 있으면 일이 풀리는 사람입니다.` });
  const meHasTheirs = me.pillars.filter((pi) => pi.p && CHEONEUL[them.dayStem].includes(pi.p.branch));
  for (const pi of meHasTheirs) out.push({ left: L(pi, BRANCHES_HANJA[pi.p!.branch]), right: `${them.name}의 천을귀인 글자`, kind: '귀인 동좌', tone: 'good', desc: `${me.name}님의 명식에 ${them.name}님의 천을귀인 글자가 있습니다. ${them.name}님에게 ${me.name}님은 연인이면서 귀인이에요.` });
  // 정렬: 좋은 것 먼저
  return out.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'good' ? -1 : 1));
}

// ── 개인 사주 읽기 (상대 또는 나) ─────────────────────────
export const spouseElement = (a: PersonAnalysis): Element => (a.gender === 'M' ? CTRL[a.element] : CTRL_BY[a.element]);

const spouseHouseText = (pi: PillarInfo, gender: 'M' | 'F'): string => {
  const s = pi.branchSipsin!, st = pi.stage!;
  const star = gender === 'M' ? '재성(아내의 별)' : '관성(남편의 별)';
  const g = GROUP_OF[s];
  let t = `배우자궁(配偶者宮 — 일지, 사주에서 배우자를 보는 칸)에 ${s}${GA(s)} 앉아 있고, 십이운성(기운의 나이)으로는 ${st}입니다. `;
  if ((gender === 'M' && g === '재성') || (gender === 'F' && g === '관성')) t += `배우자궁에 ${star}이 직접 앉은 명식이라 결혼 인연 자체가 뚜렷하고, 배우자를 만나며 인생의 궤도가 달라지는 유형입니다. `;
  else if (g === '인성') t += '배우자궁이 인성이라 나를 받쳐 주고 가르쳐 주는, 어른 같은 배우자를 만나기 쉽습니다. ';
  else if (g === '식상') t += '배우자궁이 식상이라 내가 아끼고 표현하고 챙기는 쪽의 사랑을 합니다. 자식 인연도 이 자리에서 봅니다. ';
  else if (g === '비겁') t += '배우자궁이 비겁이라 친구 같은 배우자, 대등한 관계를 만듭니다. 주도권 다툼이 생길 수 있는 자리이기도 해요. ';
  else t += (gender === 'M' ? '배우자궁이 관성이라 배우자에게서 규범·책임을 배우는 구조 — 아내가 곧 상사 같은 존재가 되기 쉽습니다. ' : '배우자궁이 재성이라 결혼 후 살림과 재물이 함께 안정되는 구조입니다. ');
  if (STAGE_GOOD.has(st)) t += `${st}${hasFinal(st) ? "은" : "는"} 기운이 살아 있는 자리 — 배우자 인연이 이 사주에서 가장 좋은 자리 중 하나예요.`;
  else if (STAGE_BAD.has(st)) t += `${st}${hasFinal(st) ? "은" : "는"} 흔들리는 자리 — 바깥에선 단단해도 가장 가까운 관계에서 예민해지는 구조라, 상대의 인내가 필요합니다.`;
  else t += `${st}${hasFinal(st) ? "은" : "는"} 중간 자리 — 배우자 인연은 본인의 선택과 시기에 크게 좌우됩니다.`;
  return t;
};

// 일지 십신 = 겉으로 드러나는 생활 태도. 일간 원형(속)만으로 성격을 쓰면 일지가 활동적인 사람이 "조용한 사람"으로 나오는 오류가 난다.
const ILJI: Record<Sipsin, { short: string; full: string; love: string }> = {
  비견: { short: '친구처럼 대등하게 어울리는', full: '일지가 비견이라 사람들과 대등하게 어울리고 제 몫을 분명히 챙깁니다. 고집이 있어 지는 걸 싫어해요.', love: '친구처럼 편하게 사귀고 주도권은 잘 안 내주는 편' },
  겁재: { short: '승부욕이 있고 사람을 모으는', full: '일지가 겁재라 승부욕이 있고 사람을 모으는 힘이 있습니다. 씀씀이가 크고 경쟁 상황에서 살아나요.', love: '밀당과 자극이 있어야 불붙는 편' },
  식신: { short: '먹고 즐기고 표현하는', full: '일지가 식신이라 먹고 즐기고 말하는 데서 힘이 납니다. 사람 앞에서 밝고, 담아 두는 것보다 꺼내 놓는 쪽이에요.', love: '같이 먹고 웃으며 표현을 아끼지 않는 편' },
  상관: { short: '말이 직설적이고 재기 있는', full: '일지가 상관이라 말이 빠르고 직설적이며 재기가 있습니다. 틀린 건 틀렸다고 하고, 규칙보다 자기 방식을 따르는 편이에요.', love: '표현이 화끈한 대신 말로 상처를 줄 수 있는 편' },
  편재: { short: '활동적이고 사교적이며 일을 벌리는', full: '일지가 편재라 활동적이고 사교적이며 일을 벌리는 쪽입니다. 집에 있기보다 나가서 사람을 만나고, 돈과 기회가 도는 자리에 서 있어야 힘이 나요.', love: '자주 만나고 잘 놀지만 붙잡으려 들면 빠져나가는 편' },
  정재: { short: '실속 있고 꼼꼼하게 관리하는', full: '일지가 정재라 실속 있고 꼼꼼하며 안정을 중시합니다. 벌리기보다 지키고, 약속을 지키는 신뢰형이에요.', love: '천천히 오래 안정적으로 가는 실속형' },
  편관: { short: '결단이 빠르고 밀어붙이는', full: '일지가 편관이라 결단이 빠르고 밀어붙이는 힘이 있습니다. 긴장 속에서 집중이 살고, 책임을 크게 지는 편이에요.', love: '강하게 끌리고 빠르게 결정하는 편' },
  정관: { short: '반듯하고 원칙을 지키는', full: '일지가 정관이라 반듯하고 원칙을 지키며 예의가 바릅니다. 조직에서 신뢰를 얻고, 관계를 공식적으로 만드는 쪽이에요.', love: '반듯하게 사귀고 관계를 공식화하는 편' },
  편인: { short: '생각이 많고 자기만의 세계가 있는', full: '일지가 편인이라 생각이 많고 자기만의 세계가 있습니다. 독특한 관점이 강점이고, 혼자 있는 시간이 필요해요.', love: '둘만의 세계를 만들고 겉으로는 덤덤한 편' },
  정인: { short: '배우고 받아들이는 차분한', full: '일지가 정인이라 배우고 받아들이는 힘이 있고 차분합니다. 어른·멘토에게 사랑받고, 서두르지 않아요.', love: '기댈 수 있는 사람에게 끌리는, 천천히 데워지는 편' },
};
const spoken = (a: PersonAnalysis) => a.groupCount.식상 >= 1 ? '아닌 건 아니라고 말하는 편' : a.groupCount.관성 >= 2 ? '불편해도 참고 넘기는 편' : '할 말은 가려서 하는 편';

/** 성격 한 줄 — 일간(속) + 일지(겉) + 표현 방식. 화면의 결론 줄과 궁합의 "나의 사주" 요약이 같이 쓴다 */
export function characterLine(a: PersonAnalysis): { who: string; spoken: string; love: string } {
  const dm = DM[a.dayStem], ilji = ILJI[a.pillars[1].branchSipsin!];
  return { who: `속은 ${dm.one}, 겉은 ${ilji.short} 사람`, spoken: spoken(a), love: `${ilji.love}. 속마음은 ${dm.loveOne}` };
}

/** 원국 안의 글자 관계 — 천간합·충, 지지 육합·삼합(반합)·충·형·파·원진 */
export interface InnerRelation { kind: string; pair: string; tone: 'good' | 'warn' | 'mut'; desc: string; }
const HYEONG: [number, number][] = [[0, 3], [2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7]];
const SELF_HYEONG = new Set([4, 6, 9, 11]);
const PA: [number, number][] = [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]];
const pairIn = (t: [number, number][], a: number, b: number) => t.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
export function innerRelations(a: PersonAnalysis): InnerRelation[] {
  const out: InnerRelation[] = [];
  const ps = a.pillars.filter((pi) => pi.p);
  const nm = (pi: PillarInfo, stem: boolean) => `${pi.label.replace('주', stem ? '간' : '지')}`;
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
    const A = ps[i], B = ps[j], x = A.p!, y = B.p!;
    const stemPair = `${STEMS_HANJA[x.stem]}(${nm(A, true)})·${STEMS_HANJA[y.stem]}(${nm(B, true)})`;
    if (stemsCombine(x.stem, y.stem)) out.push({ kind: `${STEMS_KO[Math.min(x.stem, y.stem)]}${STEMS_KO[Math.max(x.stem, y.stem)]}합`, pair: stemPair, tone: 'good', desc: (A.label === '일주' || B.label === '일주') ? '일간이 합을 이룹니다. 그 글자의 십신(사람·역할)에 마음이 묶이기 쉬워요.' : '천간이 합해 두 기운이 하나로 묶입니다.' });
    else if ((x.stem + 6) % 10 === y.stem || (y.stem + 6) % 10 === x.stem) out.push({ kind: `${STEMS_KO[x.stem]}${STEMS_KO[y.stem]}충`, pair: stemPair, tone: 'warn', desc: '천간이 부딪힙니다. 생각과 말이 안에서 갈등하는 자리 — 결정을 두 번 바꾸는 버릇으로 나타나요.' });
    const bx = x.branch, by = y.branch;
    const branchPair = `${BRANCHES_HANJA[bx]}(${nm(A, false)})·${BRANCHES_HANJA[by]}(${nm(B, false)})`;
    if (branchesSixHarmony(bx, by)) out.push({ kind: `${BRANCHES_KO[bx]}${BRANCHES_KO[by]}육합`, pair: branchPair, tone: 'good', desc: '지지가 붙는 합. 두 자리의 사람·환경이 서로 돕습니다.' });
    else if (branchesTrine(bx, by)) out.push({ kind: `${BRANCHES_KO[bx]}${BRANCHES_KO[by]}반합`, pair: branchPair, tone: 'good', desc: '삼합의 두 글자. 같은 방향으로 힘이 모입니다.' });
    else if (branchesClash(bx, by)) out.push({ kind: `${BRANCHES_KO[bx]}${BRANCHES_KO[by]}충`, pair: branchPair, tone: 'warn', desc: (A.label === '일주' || B.label === '일주') ? '배우자궁이 충을 맞습니다. 가까운 관계에서 변동이 잦고, 안정보다 움직임을 택하는 자리예요.' : '지지가 부딪힙니다. 두 자리 사이에 변동·이동이 생겨요.' });
    if (isWonjin(bx, by)) out.push({ kind: `${BRANCHES_KO[bx]}${BRANCHES_KO[by]}원진`, pair: branchPair, tone: 'warn', desc: '이유 없이 거슬리는 기운이 안에 있습니다. 스스로에게 까다로워지는 자리예요.' });
    if (pairIn(HYEONG, bx, by) || (bx === by && SELF_HYEONG.has(bx))) out.push({ kind: `${BRANCHES_KO[bx]}${BRANCHES_KO[by]}형`, pair: branchPair, tone: 'warn', desc: '형(刑) — 다듬어지는 자리. 예민함·수술·법적 일로 나타나기도 하고, 전문 기술로 쓰면 무기가 됩니다.' });
    if (pairIn(PA, bx, by)) out.push({ kind: `${BRANCHES_KO[bx]}${BRANCHES_KO[by]}파`, pair: branchPair, tone: 'mut', desc: '파(破) — 깨졌다 다시 맞추는 자리. 관계나 계획이 한 번 흔들린 뒤 자리 잡아요.' });
  }
  return out;
}

/** 오행·십성 분포 — 글자 수 기준 %, 부족/적정/발달 */
export interface ElementDist { el: Element; group: Group; count: number; pct: number; level: '없음' | '부족' | '적정' | '발달'; }
export function elementDist(a: PersonAnalysis): ElementDist[] {
  const total = a.pillars.filter((pi) => pi.p).length * 2;
  const groupOfEl = (el: Element): Group => el === a.element ? '비겁' : GEN[a.element] === el ? '식상' : CTRL[a.element] === el ? '재성' : CTRL_BY[a.element] === el ? '관성' : '인성';
  return ELEMENTS.map((el) => {
    const c = a.elementCount[el];
    return { el, group: groupOfEl(el), count: c, pct: Math.round((c / total) * 1000) / 10, level: c === 0 ? '없음' : c === 1 ? '부족' : c === 2 ? '적정' : '발달' };
  });
}

const elementBalanceText = (a: PersonAnalysis, missing: Element[]): string => {
  const over = ELEMENTS.filter((e) => a.elementCount[e] >= 3), low = ELEMENTS.filter((e) => a.elementCount[e] === 1);
  if (missing.length) return ` 명식에 ${missing.join('·')} 기운이 비어 있어 — 그 기운을 가진 사람이나 환경이 이 사주의 약이 됩니다.`;
  if (over.length || low.length) return ` 오행으로는 ${over.length ? `${over.join('·')} 기운이 발달하고` : ''}${over.length && low.length ? ' ' : ''}${low.length ? `${low.join('·')} 기운이 부족해` : ''} — ${over.length ? `${over.join('·')} 쪽으로 쏠리기 쉽고, ` : ''}${low.length ? `${low.join('·')} 기운을 가진 사람·환경이 균형을 잡아 줍니다.` : '균형을 의식해야 합니다.'}`;
  return ' 오행이 고르게 갖춰져 한쪽으로 크게 치우치지 않는 명식입니다.';
};

/** 한 사람의 사주 읽기 — 기질·연애·결혼·재물. 각 장은 결론(tldr) 한 줄을 먼저 두고 근거를 잇는다 */
export function personSections(a: PersonAnalysis, dae: LuckNow | null): Section[] {
  const dm = DM[a.dayStem];
  const dominant = (Object.entries(a.groupCount) as [Group, number][]).sort((x, y) => y[1] - x[1])[0];
  const spouseEl = spouseElement(a);
  const missing = ELEMENTS.filter((e) => a.elementCount[e] === 0);
  const hasFood = a.groupCount.식상 > 0, hasWealth = a.groupCount.재성 > 0;
  const gm = a.pillars.find((pi) => pi.p && a.gongmang.includes(pi.p.branch) && pi.label !== '일주');
  const spouseHouse = a.pillars[1];
  const seasonEl = branchElement(a.pillars[2].p!.branch);

  const ilji = ILJI[spouseHouse.branchSipsin!];
  const lively = ['편재', '식신', '상관', '겁재'].includes(spouseHouse.branchSipsin!);
  const temperament: string[] = [
    `${a.name}님의 일간(日干 — 태어난 날의 천간, 사주에서 "나"를 뜻하는 글자)은 ${STEMS_KO[a.dayStem]}${a.element}(${STEMS_HANJA[a.dayStem]}), ${a.nick}입니다. ${dm.who}`,
    `일간이 "속"이라면 일지(태어난 날의 지지, 배우자궁)는 "겉으로 드러나는 생활 태도"입니다. ${a.name}님의 일지는 ${BRANCHES_KO[spouseHouse.p!.branch]}(${spouseHouse.branchSipsin}) — ${ilji.full} 그래서 남들이 보는 ${a.name}님은 ${ilji.short} 사람이고, ${spoken(a)}이에요.${lively && ['정', '계', '을', '기', '신'].includes(STEMS_KO[a.dayStem]) ? ` 일간 원형(${a.nick})의 조용한 인상보다 일지의 활동성이 먼저 보이는 유형입니다.` : ''}`,
    `월지(태어난 달의 지지)가 ${BRANCHES_KO[a.pillars[2].p!.branch]}(${seasonEl})${IRA(seasonEl)} ${a.gyeokguk}을 이룹니다. 격국(格局)은 이 사람이 세상에 나서는 방식이에요. 명식 전체의 힘은 ${a.weak ? '신약(身弱)' : '신강(身强)'}입니다. ${a.weak ? `신약은 나쁘다는 뜻이 아니라 혼자보다 사람·배움과 함께 있을 때 잘 되는 사주라는 뜻이에요. ${a.favorable.join('·')} 기운이 힘이 되고, ${a.avoid} 기운이 더 오면 부담이 됩니다.` : `신강은 가진 힘이 넉넉해 쓸 곳이 있어야 편한 사주라는 뜻이에요. ${a.favorable.join('·')} 기운으로 풀어낼 때 빛나고, 힘을 쓸 곳(일·표현·책임)이 없으면 오히려 답답해집니다.`}`,
    GROUP_TEXT[dominant[0]] + (dominant[0] === '관성' && (a.groupCount.식상 >= 1 || a.groupCount.재성 >= 1) ? ' 다만 식상·재성이 살아 있어 눌리기만 하는 사람은 아니에요 — 할 말은 하고, 대신 책임을 크게 지는 쪽입니다.' : '') + elementBalanceText(a, missing),
  ];

  const love: string[] = [`${dm.love}`, `실제 연애 행동은 일지(배우자궁)가 더 크게 정합니다. ${a.name}님의 일지 ${spouseHouse.branchSipsin} — ${ilji.love}.`];
  const romance = a.badges.filter((b) => b.label === '도화살' || b.label === '홍염살');
  if (romance.length) love.push(`${romance.map((b) => `${b.label}(${b.where})`).join('·')}이 있습니다. 도화·홍염은 매력의 살(煞)이라, 굳이 애쓰지 않아도 주변에서 먼저 다가오는 유형이에요. 첫인상에서 "뭔가 있다"는 소리를 듣는 사주입니다.`);
  else love.push('도화·홍염처럼 스스로 매력을 뿜는 살은 없습니다. 첫눈에 띄는 타입보다 알고 보면 좋은 사람형이라, 시간을 함께 보낼수록 진가가 드러나요.');
  if (gm) love.push(`${gm.label.replace('주', '지')} ${BRANCHES_KO[gm.p!.branch]}가 공망(空亡 — 자리는 있는데 비어 있다는 뜻)입니다. ${gm.label === '시주' ? '말년·자식 자리가 비어 정신적 가치를 좇는 쪽으로 읽고, ' : ''}인연에서는 다가오는 사람은 많은데 정작 마음이 채워지는 사람은 드문 시기가 있을 수 있습니다.`);
  if (a.groupCount.식상 >= 2) love.push('식상이 강해 좋으면 말과 표정에 다 드러나고, 싫으면 그것도 다 드러납니다. 상대의 허점을 정확히 짚는 말이 나오는 별이라 — 이기는 말을 잘 하는 대신, 이기고 나서 관계가 식는 경험을 조심해야 해요.');
  if (a.groupCount.관성 >= 2) love.push(a.groupCount.식상 >= 1
    ? '관성이 많아 상대 눈치를 보긴 하는데, 식상이 있어 결국은 말합니다. 다만 말하고 나서 "괜히 했나" 하는 뒷맛이 남는 편이라 — 말한 뒤 스스로를 탓하지 않는 것이 이 사주의 연애 요령이에요.'
    : '관성이 강해 상대 눈치를 많이 보고 참는 편입니다. "괜히 말했다가 불편해질까" 재다가 타이밍을 놓치는 일이 잦고, 불만을 말하지 않고 쌓다가 조용히 등을 돌리는 것이 이 사주의 연애 약점이에요.');

  const marriage: string[] = [
    spouseHouseText(spouseHouse, a.gender),
    `배우자상은 ${spouseEl}(${ELEMENT_LABEL[spouseEl]}) 기운의 사람 — ${SPOUSE_BY_EL[spouseEl]}${a.weak ? ` 그리고 ${a.name}님 사주에 힘을 보태는 ${a.favorable[0]} 기운을 지닌 사람이 함께 있을 때 이 명식이 가장 잘 삽니다.` : ''}`,
  ];
  if (dae) marriage.push(dae.marriage
    ? `지금 대운(大運 — 10년 단위로 바뀌는 큰 운. ${pillarKo(dae.pillar)}, ${dae.startAge}세~)은 ${dae.stemS}·${dae.branchS}입니다. ${a.gender === 'M' ? '재성(아내의 별)' : '관성(남편의 별)'}이 대운으로 들어온 인연 대운이라, 결혼 인연이 구체적인 모양을 갖추는 10년이에요.`
    : `지금 대운(大運 — 10년 단위로 바뀌는 큰 운. ${pillarKo(dae.pillar)}, ${dae.startAge}세~)은 ${dae.stemS}·${dae.branchS}입니다. 배우자 별이 직접 들어온 대운은 아니라, 인연은 대운보다 본인의 선택과 세운(한 해 운)에 좌우되는 시기예요.`);

  const work: string[] = [];
  if (hasFood && hasWealth) work.push('식상과 재성이 함께 있어 식상생재(食傷生財 — 내가 만든 것이 돈이 되는 구조)입니다. 결과물·기술·아이디어가 재물로 이어지는 사주라, 월급형보다 자기 이름으로 하는 일에서 수입이 커지는 유형이에요.');
  else if (hasWealth) work.push('재성은 있으나 식상이 약해, 만들어서 버는 것보다 관리하고 굴려서 버는 쪽이 어울립니다. 돈을 다루는 일, 실물·자산과 관련된 일에 강합니다.');
  else if (hasFood) work.push('식상은 살아 있으나 재성이 약해 — 재능은 뚜렷한데 돈으로 바꾸는 고리가 헐거운 사주입니다. 재성을 가진 파트너(현실 감각이 좋은 사람)가 곁에 있어야 재능이 수입이 됩니다.');
  else work.push('식상·재성이 모두 약해 돈과 표현보다 사람·명예·배움 쪽에 무게가 실린 명식입니다. 조직·전문직·교육처럼 신뢰로 쌓아 가는 일에서 안정을 얻어요.');
  if (a.weak && a.groupCount.재성 >= 2) work.push('재다신약(財多身弱 — 재물은 많은데 그걸 감당할 내 힘이 약함)입니다. 돈 벌 기회는 보이는데 몸이 못 따라가는 순간이 옵니다. 욕심이 아니라 체력의 문제라는 걸 알아 두고, 여러 갈래로 벌리지 말고 하나에 집중하는 것이 이 사주의 재물 전략입니다.');
  const bh = a.badges.find((b) => b.label === '백호대살');
  if (bh) work.push(`${bh.where} 백호대살(白虎大煞)은 강한 기운이 든 것입니다. 옛 해석은 사고·수술 조심이지만, 현대 명리에서는 피·칼·돈·법을 다루는 일(의료·법률·금융·기술·요리)에서 오히려 무기가 되는 살로 봅니다.`);
  const hg = a.badges.find((b) => b.label === '화개살');
  if (hg) work.push('화개살(華蓋煞)은 예술·철학·연구처럼 혼자 깊이 파는 재능의 별입니다. 사람 많은 자리보다 몰입할 때 결과가 나오는 유형이에요.');
  const mc = a.badges.find((b) => b.label === '문창귀인');
  if (mc) work.push(`${mc.where}의 문창귀인(文昌貴人)은 글·기록·정리·학문의 별 — 문서와 지식으로 신뢰를 얻는 재능이 있습니다.`);

  const stGood = STAGE_GOOD.has(spouseHouse.stage!), stBad = STAGE_BAD.has(spouseHouse.stage!);
  return [
    { key: 'who', label: '타고난 기질', title: `${a.nick} — ${a.gyeokguk}, ${a.weak ? '신약' : '신강'}`, paras: temperament,
      tldr: `속은 ${dm.one}, 겉은 ${ilji.short} 사람. ${spoken(a)}이고, ${a.weak ? '힘은 사람·환경에서 충전돼요(신약)' : '가진 힘을 쓸 곳이 있어야 편해요(신강)'}.` },
    { key: 'love', label: '연애 스타일', title: romance.length ? '끌어당기는 사람' : '알고 보면 좋은 사람', paras: love,
      tldr: `${ilji.love}. 속마음은 ${dm.loveOne}. ${romance.length ? '먼저 다가오는 사람이 많은 타입' : '알수록 좋아지는 타입'}이에요.` },
    { key: 'marry', label: '결혼운 · 배우자상', title: `배우자궁 ${spouseHouse.branchSipsin} · ${spouseHouse.stage}`, paras: marriage,
      tldr: `배우자 자리는 ${stGood ? '든든하게 살아 있는 자리' : stBad ? '가까울수록 예민해지는 자리' : '무난한 자리'}, 잘 맞는 짝은 ${ELEMENT_LABEL[spouseEl]}(${spouseEl}) 기운의 사람이에요.${dae?.marriage ? ' 지금이 인연 대운입니다.' : ''}` },
    { key: 'work', label: '재물 · 일', title: hasFood && hasWealth ? '만든 것이 돈이 되는 구조' : '이 사주가 돈을 버는 방식', paras: work,
      tldr: hasFood && hasWealth ? '내가 만든 것이 돈이 되는 사주 — 자기 이름으로 하는 일에 유리해요.' : hasWealth ? '만들기보다 관리하고 굴려서 버는 사주예요.' : hasFood ? '재능은 뚜렷한데 돈으로 바꾸는 고리가 약해, 현실적인 파트너가 필요해요.' : '돈보다 사람·명예·배움으로 쌓아 가는 사주예요.' },
  ];
}

const ELEMENT_LABEL: Record<Element, string> = { 목: '나무', 화: '불', 토: '흙', 금: '금속', 수: '물' };
const SPOUSE_BY_EL: Record<Element, string> = {
  목: '곧고 성장 지향적이며 함께 커 가는 사람, 앞장서서 방향을 잡아 주는 사람입니다.',
  화: '따뜻하고 표현이 밝은 사람, 곁에 있으면 온기가 도는 사람입니다.',
  토: '묵직하고 신용 있는 사람, 흔들릴 때 뿌리가 되어 주는 사람입니다.',
  금: '단정하고 기준이 분명한 사람, 머리가 좋고 현실 감각이 뛰어난 사람입니다.',
  수: '지혜롭고 유연한 사람, 깊은 대화가 되고 방향을 함께 정해 주는 사람입니다.',
};

// ── 커플 풀이 ───────────────────────────────────────────
function coupleSections(me: PersonAnalysis, them: PersonAnalysis, rel: Relation[], c: CompatResult): Section[] {
  const man = me.gender === 'M' ? me : them, woman = me.gender === 'M' ? them : me;
  const r = elementRelation(man.element, woman.element);
  const samePol = man.yang === woman.yang;
  const structure: string[] = [];
  let structTl = '';
  if (r === 'a-controls-b') {
    structTl = samePol ? '서로가 서로의 짝 자리(편재·편관) — 끌림이 선명한 인연이에요.' : '서로가 서로의 짝 자리(정재·정관) — 명리에서 가장 반듯한 부부 배열이에요.';
    structure.push(`${man.name}님의 ${man.element}${GA(man.element)} ${woman.name}님의 ${woman.element}${EUL(woman.element)} 극(克)합니다. 명리에서 "극한다"는 말은 싸운다는 뜻이 아니에요. 남자에게 내가 극하는 오행은 재성 곧 아내의 별이고, 여자에게 나를 극하는 오행은 관성 곧 남편의 별입니다. 그러니 이 두 사람의 극은 남녀 인연의 공식 그 자체예요. ${samePol ? '둘 다 음양이 같아 편재·편관의 만남입니다. 정재·정관처럼 잔잔하기보다 끌림이 선명하고 자극적인 쪽이에요.' : '음양이 달라 정재·정관의 만남입니다. 명리에서 가장 반듯하고 안정적인 부부 인연의 배열로 봅니다.'}`);
  } else if (r === 'b-controls-a') {
    structTl = `${woman.name}님이 방향을 잡고 ${man.name}님이 그 곁에서 크는 구조 — 안정형보다 성장형 인연이에요.`;
    structure.push(`${woman.name}님의 ${woman.element}${GA(woman.element)} ${man.name}님의 ${man.element}${EUL(man.element)} 극합니다. 남자에게 상대는 관성(나를 다듬는 기운·책임), 여자에게 상대는 재성(내가 다루는 기운)이에요. 전통적인 남녀 배열과는 반대라, 여자가 관계의 방향을 잡고 남자가 배우자를 통해 성장하는 구조입니다. 편안한 안정형보다 서로를 키우는 성장형 인연으로 봅니다.`);
  } else if (r === 'same') {
    structTl = '같은 기운의 두 사람 — 친구처럼 편한데, 주도권 경쟁이 숙제예요.';
    structure.push(`두 사람의 일간이 같은 ${man.element} 기운입니다. 비화(比和 — 같은 기운끼리의 만남)라 설명 없이 통하는 편안함이 있고, 친구 같은 연인이에요. 닮은 만큼 부딪히는 지점도 닮았고, 주도권을 두고 은근한 경쟁이 생길 수 있습니다.`);
  } else if (r === 'a-gives-b') {
    structTl = `${man.name}님이 주고 ${woman.name}님이 받는 보호자 구조예요.`;
    structure.push(`${man.name}님의 ${man.element}${GA(man.element)} ${woman.name}님의 ${woman.element}${EUL(woman.element)} 생(生)합니다. 남자에게 상대는 식상(아끼고 표현하는 대상), 여자에게 상대는 인성(든든한 뒷배)이에요. 남자가 주고 여자가 받는 보호자 구조라, 남자는 아낌없이 주게 되고 여자는 곁에 있는 것만으로 힘을 받습니다. 받는 법도 함께 연습하면 좋아요.`);
  } else {
    structTl = `${woman.name}님이 돌보고 ${man.name}님이 안정을 얻는 구조예요.`;
    structure.push(`${woman.name}님의 ${woman.element}${GA(woman.element)} ${man.name}님의 ${man.element}${EUL(man.element)} 생(生)합니다. 여자에게 상대는 식상(아끼는 대상), 남자에게 상대는 인성(나를 키우는 힘)이에요. 여자가 주고 남자가 받는 구조라, 남자는 이 관계에서 배우고 안정되고, 여자는 돌보는 기쁨이 있되 지치지 않도록 균형이 필요합니다.`);
  }

  // 서로 채워 주는 오행
  const fill: string[] = [];
  const supply = (x: PersonAnalysis, y: PersonAnalysis) => x.favorable.filter((e) => x.elementCount[e] <= 1 && y.elementCount[e] >= 2);
  const meGets = supply(me, them), themGets = supply(them, me);
  if (meGets.length) fill.push(`${me.name}님 사주에 부족한 ${meGets.join('·')} 기운을 ${them.name}님이 넉넉히 지녔습니다. 곁에 있는 것만으로 힘을 받는 쪽은 ${me.name}님이에요.`);
  if (themGets.length) fill.push(`${them.name}님 사주에 아쉬운 ${themGets.join('·')} 기운을 ${me.name}님이 들고 왔습니다. ${them.name}님에게 ${me.name}님은 연인이자 보약입니다.`);
  if (meGets.length && themGets.length) fill.push('각자의 용신(用神 — 내 사주에 가장 필요한 기운)을 상대가 들고 온 배열입니다. 옛 어른들이 "제 짝은 제 약을 들고 온다" 한 것이 이런 경우예요.');
  if (!fill.length) fill.push('서로의 용신(가장 필요한 기운)을 직접 채워 주는 배열은 아닙니다. 기운의 보완보다는 취향·가치관·시기의 조율로 만들어 가는 인연이에요 — 그만큼 노력이 곧바로 관계에 반영됩니다.');
  const fillTl = meGets.length && themGets.length ? `서로에게 없는 기운(${me.name} ← ${meGets.join('·')}, ${them.name} ← ${themGets.join('·')})을 맞바꿔 채워 주는 사이예요.`
    : meGets.length ? `${them.name}님이 내게 부족한 ${meGets.join('·')} 기운을 채워 줘요 — 힘을 받는 쪽은 나예요.`
    : themGets.length ? `내가 ${them.name}님에게 부족한 ${themGets.join('·')} 기운을 채워 줘요 — 힘을 받는 쪽은 ${them.name}님이에요.`
    : '기운을 직접 채워 주는 사이는 아니에요 — 노력이 그대로 관계에 반영되는 인연이에요.';

  // 성격 궁합
  const lean = (x: PersonAnalysis) => x.groupCount.식상 - x.groupCount.관성;
  const [hi, lo] = lean(me) >= lean(them) ? [me, them] : [them, me];
  const talker = hi.groupCount.식상 >= 2 && lean(hi) > lean(lo) ? hi : undefined;
  const holder = talker && lo.groupCount.관성 >= 2 ? lo : undefined;
  const personality: string[] = [];
  let persTl = '';
  if (talker && holder && talker !== holder) {
    persTl = `${talker.name}님은 말하고 ${holder.name}님은 참는 조합 — 참는 쪽이 쌓아 두지 않는 게 핵심이에요.`;
    personality.push(`${talker.name}님은 식상(표현)의 사람이라 틀린 걸 보면 말합니다. ${holder.name}님은 관성(인내)의 사람이라 불편해도 참습니다. 이 조합의 위험은 싸움이 아니라 한쪽만 말하고 한쪽은 쌓아 두는 것이에요. 겉으론 평화로운데 어느 날 ${holder.name}님이 조용히 등을 돌리는 그림이 최악의 시나리오입니다. 반대로 ${talker.name}님의 정확함이 ${holder.name}님의 망설임을 끊어 주고, ${holder.name}님의 인내가 ${talker.name}님의 날을 감싸 주는 것이 최선이에요.`);
  } else if (me.weak && them.weak) {
    persTl = '둘 다 기대는 쪽이라 편하지만, 결정을 미루는 버릇도 둘 다 있어요.';
    personality.push('두 사람 모두 신약한 명식입니다. 서로 기대는 관계가 되기 쉽고, 편안하지만 결정을 미루는 습관이 둘 다 있어 — 누가 먼저 결정하는지 규칙을 정해 두면 좋습니다.');
  } else if (!me.weak && !them.weak) {
    persTl = '둘 다 주도권이 센 사람들 — 영역을 나누면 가장 든든한 파트너예요.';
    personality.push('두 사람 모두 신강한 명식입니다. 각자 주도권이 강해 부딪히면 크게 부딪히지만, 서로의 힘을 인정하면 가장 든든한 파트너가 됩니다. 영역을 나누는 것이 관건이에요.');
  } else {
    const st = me.weak ? them : me, w = me.weak ? me : them;
    persTl = `${st.name}님이 이끌고 ${w.name}님이 받치는 구조가 자연스럽게 생겨요.`;
    personality.push(`${st.name}님이 신강, ${w.name}님이 신약한 조합입니다. ${st.name}님이 이끌고 ${w.name}님이 받치는 구조가 자연스럽게 생기는데 — ${w.name}님의 의견이 묻히지 않도록 ${st.name}님이 한 박자 기다려 주는 것이 균형의 열쇠입니다.`);
  }
  const yy = c.parts[4].score;
  personality.push(yy >= 85 ? '음양 균형이 아주 좋습니다. 한쪽이 달리면 한쪽이 고삐를 쥐는, 시소가 수평을 찾는 짝이에요.' : yy >= 65 ? '음양 균형은 무난합니다. 성향이 비슷한 구간이 있어 편하지만, 같은 방향으로 함께 기울 때는 브레이크가 없어요.' : '두 사람의 음양이 같은 쪽으로 치우쳐 있습니다. 닮은 기질이라 이해는 쉽지만 보완은 약해 — 다른 결의 친구·조언자를 곁에 두면 관계가 오래 갑니다.');

  // 애정 궁합
  const affection: string[] = [];
  const haps = rel.filter((x) => x.kind.endsWith('합') && !x.kind.includes('삼합') && !x.kind.includes('육합'));
  const dayRel = rel.find((x) => x.left.includes(' 일지') && x.right.includes(' 일지'));
  if (haps.length) affection.push(`천간합(天干合 — 두 사주의 천간이 짝을 이루는 것)이 ${haps.length}개(${haps.map((h) => h.kind).join('·')}) 있습니다. 천간합은 이유를 설명하기 어려운 호감의 자리라, 처음부터 편하고 자꾸 눈이 가는 근거예요.${haps.length >= 2 ? ' 합이 겹으로 들어 사랑의 온도가 높은 궁합입니다.' : ''}`);
  else affection.push('천간합(두 사주의 천간이 짝을 이루는 것)은 없습니다. 첫눈에 확 끌리는 종류보다 함께 시간을 보내며 서서히 데워지는 종류의 애정이에요. 느린 대신 식는 것도 느립니다.');
  if (dayRel) affection.push(dayRel.tone === 'good' ? `배우자궁끼리 ${dayRel.kind} — 마음의 가장 안쪽 자리가 서로 붙어 있습니다. 애정의 깊이가 이 자리에서 나옵니다.` : `배우자궁끼리 ${dayRel.kind} — 사랑의 온도는 높은데 일상의 결이 달라, 연애 때보다 함께 살기 시작할 때 조율이 필요합니다.`);
  const dmScore = c.parts[1].score;
  affection.push(dmScore >= 85 ? '일간 궁합 점수가 높습니다. 서로의 기질이 자연스럽게 맞물리는 짝이에요.' : dmScore >= 65 ? '일간 궁합은 무난합니다. 기질이 크게 다르지 않아 편하지만, 자극도 그만큼 덜한 편입니다.' : '일간 궁합 점수는 낮은 편이지만, 이 점수는 "기질이 다르다"는 뜻일 뿐 나쁜 인연이라는 뜻이 아닙니다. 다른 만큼 배울 것이 많은 짝이에요.');
  const affTl = `${haps.length ? '처음부터 이유 없이 편한 사이' : '천천히 데워지고 천천히 식는 사이'}${dayRel ? (dayRel.tone === 'good' ? ', 마음 안쪽까지 붙어 있어요.' : ', 다만 같이 살기 시작하면 조율이 필요해요.') : '예요.'}`;

  // 결혼 궁합
  const wedding: string[] = [];
  const good = rel.filter((x) => x.tone === 'good' && (x.kind.includes('육합') || x.kind.includes('삼합'))).length;
  const bad = rel.filter((x) => x.tone === 'warn').length;
  wedding.push(good >= 2 ? `지지에 육합·삼합(지지끼리 붙는 합)이 ${good}개 — 큰 방향과 인생관에서 한 배를 타는 사람들입니다. 결혼 초보다 결혼 10년 후가 더 좋은, 오래 갈수록 붙는 궁합이에요.` : good === 1 ? '지지에 합이 하나 있어 큰 틀은 붙들려 있습니다. 결혼 궁합의 관건은 합이 아니라 아래 갈등 자리를 어떻게 다루는가예요.' : '지지에 합이 없어 "운명적으로 맞는다"는 종류의 궁합은 아닙니다. 대신 서로 다른 세계를 가진 사람들이라, 각자의 세계를 존중하면 오래 가는 결혼이 됩니다.');
  wedding.push(bad === 0 ? '충·원진이 없습니다. 부딪힘이 적은 편안한 결혼 궁합 — 대신 자극이 적어 서로에게 익숙해지는 속도도 빠르니, 함께 새로운 것을 하는 습관이 필요해요.' : `충·원진이 ${bad}개 있습니다. 명리에서 충(沖)은 깨지는 기운이 아니라 움직이는 기운이에요. ${good ? '합이 큰 틀을 붙들고 있으니 이 충들은 암초가 아니라 파도입니다.' : '합이 없는 상태의 충이라 파도가 곧바로 배에 닿습니다. 갈등 자리를 미리 알고 규칙을 정해 두는 것이 이 궁합의 결혼 준비예요.'}`);
  const wedTl = good >= 2 ? '오래 갈수록 더 붙는 결혼 궁합이에요.' : good === 1 ? '큰 틀은 붙들려 있고, 갈등 자리 관리가 관건이에요.' : '운명형보다 존중형 — 각자의 세계를 인정하면 오래 가요.';

  // 갈등 포인트
  const conflict: string[] = [];
  const warns = rel.filter((x) => x.tone === 'warn');
  if (!warns.length) conflict.push('두 명식 사이에 충·원진이 하나도 없습니다. 이유 없이 거슬리는 자리가 없다는 뜻 — 다툼이 생기면 그건 사주가 아니라 상황의 문제입니다.');
  for (const w of warns) conflict.push(`${w.left} × ${w.right} — ${w.kind}. ${w.desc}`);
  if (warns.length) conflict.push('다툼의 8할은 위 자리들에서 나옵니다. 취향을 맞추려 하지 말고 영역을 나누는 것, 그리고 누가 옳은지를 겨루지 않는 것 — 이 두 가지만 지키면 점수보다 훨씬 멀리 가는 인연이에요.');
  const confTl = warns.length ? `부딪히는 자리 ${warns.length}곳(${[...new Set(warns.map((w) => w.kind))].join('·')}) — 영역을 나누고, 누가 옳은지 겨루지 않기.` : '부딪힐 자리가 없어요 — 다투면 사주가 아니라 상황 탓이에요.';

  return [
    { key: 'structure', label: '인연의 구조', title: r === 'a-controls-b' ? '서로가 서로의 배우자 별' : r === 'same' ? '닮은 두 사람' : r.includes('gives') ? '주고 받는 구조' : '그녀가 이끄는 구조', paras: structure, tldr: structTl },
    { key: 'fill', label: '서로 채워 주는 것', title: fill.length >= 2 ? '제 짝은 제 약을 들고 온다' : '기운의 보완', paras: fill, tldr: fillTl },
    { key: 'personality', label: '성격 궁합', title: talker && holder && talker !== holder ? '말하는 사람과 참는 사람' : '기질의 균형', paras: personality, tldr: persTl },
    { key: 'affection', label: '애정 궁합', title: haps.length ? `천간합 ${haps.length}개 — 이유 없이 끌리는 자리` : '천천히 데워지는 애정', paras: affection, tldr: affTl },
    { key: 'wedding', label: '결혼 궁합', title: good >= 2 ? '오래 갈수록 붙는 합' : '결혼 궁합', paras: wedding, tldr: wedTl },
    { key: 'conflict', label: '갈등 포인트', title: warns.length ? `${warns.length}개의 자리를 알면 다툼의 8할이 설명된다` : '부딪힐 자리가 없는 궁합', paras: conflict, tldr: confTl },
  ];
}

// ── 시기 (대운·세운) ─────────────────────────────────────
export function luckNow(a: PersonAnalysis, p: Person, birth: { y: number; m: number; d: number }, today: Date): LuckNow | null {
  const hb = p.pillars.hour ? p.pillars.hour.branch : null;
  const hh = hb === null ? 12 : (hb * 2) % 24;
  const dd = daeun(birth.y, birth.m, birth.d, hh, 30, p.gender, p.pillars); // 시진 중앙(한국 30분 보정)
  if (!dd) return null;
  const age = today.getFullYear() - birth.y;
  const cur = [...dd.cycles].reverse().find((c) => c.startAge <= age) ?? dd.cycles[0];
  const stemS = sipsin(a.dayStem, cur.pillar.stem), branchS = sipsinB(a.dayStem, cur.pillar.branch);
  const want: Group = p.gender === 'M' ? '재성' : '관성';
  return { pillar: cur.pillar, stemS, branchS, stage: stage12(a.dayStem, cur.pillar.branch), startAge: cur.startAge, marriage: GROUP_OF[stemS] === want || GROUP_OF[branchS] === want };
}

const YEAR_LINE: Record<Group, string> = {
  비겁: '자존과 자립의 해 — 내 힘이 붙고 주도권이 생기지만, 고집도 함께 세지는 해입니다.',
  식상: '표현과 결과물의 해 — 만들고 내놓고 말하기 좋은 해. 말실수도 함께 오니 윗사람 앞에선 한 박자 늦게.',
  재성: '재물과 인연이 움직이는 해 — 기회가 보이고 사람이 다가옵니다. 벌리는 만큼 소모도 크니 하나에 집중.',
  관성: '책임과 공식화의 해 — 인연·지위·계약이 형태를 갖춥니다. 압박도 함께 오니 몸을 먼저 챙기세요.',
  인성: '배움과 정리의 해 — 공부·자격·문서·휴식에 좋습니다. 생각이 많아져 결정은 느려지는 해.',
};

/** 한 해(세운)의 십신·십이운성 한 줄 */
export function yearLineFor(a: PersonAnalysis, year: number, yp: Pillar): string {
  const ss = sipsin(a.dayStem, yp.stem), bs = sipsinB(a.dayStem, yp.branch), st = stage12(a.dayStem, yp.branch);
  const gi = CHEONEUL[a.dayStem].includes(yp.branch), dh = DOHWA[triOf(a.pillars[3].p!.branch)] === yp.branch;
  const clash = a.pillars.filter((pi) => pi.p && branchesClash(pi.p.branch, yp.branch)).map((pi) => pi.label);
  let t = `${a.name}님의 ${year}년(${pillarKo(yp)}년)은 ${ss}·${bs}, 십이운성 ${st}. ${YEAR_LINE[GROUP_OF[ss]]}`;
  if (gi) t += ' 올해 지지가 천을귀인 글자라 도와주는 사람이 나타나는 해이기도 합니다.';
  if (dh) t += ' 도화살에 해당하는 해라 예외적으로 눈에 띄고 인연이 붙는 해예요.';
  if (clash.length) t += ` 다만 올해 지지가 ${clash.join('·')}와 충을 이루니 ${clash.includes('월주') ? '소속·환경' : clash.includes('일주') ? '배우자·가정' : '주변'} 쪽에 변동이 있을 수 있습니다.`;
  return t;
}
export const YEAR_SHORT: Record<Group, string> = { 비겁: '내 힘이 붙는 해', 식상: '만들고 내놓는 해', 재성: '돈과 인연이 움직이는 해', 관성: '책임과 약속이 형태를 갖추는 해', 인성: '배우고 정리하는 해' };

function timingSections(me: PersonAnalysis, them: PersonAnalysis, lm: LuckNow | null, lt: LuckNow | null, year: number, yp: Pillar): Section[] {
  const out: Section[] = [];
  const dae: string[] = ['대운(大運)은 10년마다 바뀌는 인생의 계절이고, 인연 대운은 배우자 별(남자는 재성, 여자는 관성)이 그 계절에 들어온 때를 말합니다.'];
  const line = (a: PersonAnalysis, l: LuckNow | null) => l
    ? `${a.name}님은 지금 ${pillarKo(l.pillar)}(${pillarHanja(l.pillar)}) 대운(${l.startAge}세~), ${l.stemS}·${l.branchS}, 십이운성 ${l.stage}입니다. ${l.marriage ? `${a.gender === 'M' ? '재성' : '관성'}이 대운으로 들어온 인연 대운이에요.` : '배우자 별이 직접 들어온 대운은 아니라, 인연은 세운과 본인의 선택이 더 크게 작용하는 시기입니다.'}`
    : `${a.name}님의 대운은 절기 데이터 범위 밖이라 계산하지 못했습니다.`;
  dae.push(line(me, lm), line(them, lt));
  let daeTl: string;
  if (lm?.marriage && lt?.marriage) { daeTl = '지금 두 사람 다 인연 대운 — 때가 맞아요.'; dae.push('두 사람의 인연 대운이 지금 겹쳐 있습니다. 결혼 궁합에서 "좋은가"보다 중요한 것이 "때가 맞는가"인데 — 두 분은 때가 맞습니다.'); }
  else if (lm?.marriage || lt?.marriage) { const who = lm?.marriage ? me.name : them.name; daeTl = `${who}님만 인연 대운 — 속도 차이를 서로 인정해야 해요.`; dae.push(`${who}님 쪽은 인연 대운, 다른 한쪽은 아닙니다. 한쪽이 서두르고 한쪽이 느긋해지기 쉬운 배열이라 속도 차이를 서로 인정해야 해요.`); }
  else { daeTl = '둘 다 인연 대운은 아니에요 — 관계를 다지는 시기, 결정은 좋은 해를 골라서.'; dae.push('두 사람 모두 배우자 별이 대운으로 들어온 시기는 아닙니다. 지금은 관계를 다지는 시기이고, 결정은 세운이 받쳐 주는 해를 고르는 것이 좋습니다.'); }
  out.push({ key: 'daeun', label: '대운 — 10년의 계절', title: lm?.marriage && lt?.marriage ? '두 사람의 인연 대운이 겹쳐 있다' : '지금 두 사람이 서 있는 계절', paras: dae, tldr: daeTl });

  const se = [me, them].map((a) => yearLineFor(a, year, yp));
  const seTl = `${year}년은 ${me.name}님에게 ${YEAR_SHORT[GROUP_OF[sipsin(me.dayStem, yp.stem)]]}, ${them.name}님에게 ${YEAR_SHORT[GROUP_OF[sipsin(them.dayStem, yp.stem)]]}예요.`;
  out.push({ key: 'seun', label: `${year}년 세운`, title: `${pillarKo(yp)}년, 두 사람의 올해`, paras: ['세운(歲運)은 그해의 간지가 내 사주에 어떤 별로 들어오는지를 보는 한 해 운입니다.', ...se], tldr: seTl });
  return out;
}

// ── 진입점 ──────────────────────────────────────────────
export interface BirthInput { y: number; m: number; d: number; }
export function fullReading(me: Person & { birth: BirthInput }, them: Person & { birth: BirthInput }, today = new Date()): FullReading {
  const A = analyze(me), B = analyze(them);
  const compat = compatibility(me.pillars, them.pillars);
  const rel = relations(A, B);
  const lm = luckNow(A, me, me.birth, today), lt = luckNow(B, them, them.birth, today);
  const year = today.getFullYear();
  const yp = splitGanzhi(year - 4);
  return {
    me: A, them: B, compat, relations: rel,
    themSections: personSections(B, lt),
    coupleSections: coupleSections(A, B, rel, compat),
    timingSections: timingSections(A, B, lm, lt, year, yp),
    luck: { me: lm, them: lt, year, yearPillar: yp },
  };
}
