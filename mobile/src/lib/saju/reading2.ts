// 상세 풀이 확장 — "이 사람은 나에게 어떤 별인가": 십신 관계·일주 궁합·계절 조후·띠·오행 보완표,
// 연애 단계별 흐름, 함께 하면 좋은 것/조심할 것, 나의 사주 요약, 상대의 건강·대인·인생 흐름,
// 시기 확장(현재·다음 대운, 3년 세운, 이번 달), 결론 카드·총평·용어 풀이. reading.ts의 분석 결과를 입력으로 받는다.
// 문장 원칙: 결론(tldr) 한 줄 → 근거. 명리 용어는 그대로 쓰되 처음 나올 때 괄호로 뜻을 붙인다.

import { CompatResult } from './compat';
import { daeun } from './daeun';
import {
  BRANCH_ANIMALS, BRANCHES_KO, branchesClash, branchesSixHarmony, branchesTrine, Element, ELEMENTS, pillarKo,
  Pillar, splitGanzhi, STEMS_HANJA, STEMS_KO,
} from './ganzhi';
import { monthPillar } from './manseryeok';
import { askLine, characterLine, CHEONEUL, DM, GROUP_OF, PersonAnalysis, Relation, Section, sipsin, sipsinB, Sipsin, spouseElement, stage12 } from './reading';

const hasFinal = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
const GA = (w: string) => (hasFinal(w) ? '이' : '가');
const EUN = (w: string) => (hasFinal(w) ? '은' : '는');

// ── 오행 의미 ────────────────────────────────────────────
const EL_MEAN: Record<Element, { gives: string; lack: string; over: string; date: string }> = {
  목: { gives: '성장 의지·계획·앞으로 나아가는 힘', lack: '방향을 잡고 뻗어나가는 힘이 약해 시작을 미루기 쉬움', over: '고집과 앞서가는 성향이 강해 상대를 끌고 가려 함', date: '산책·숲·식물 있는 공간, 함께 계획 세우기' },
  화: { gives: '온기·표현·밝은 에너지', lack: '표현이 적고 몸이 차며 관계의 온도가 늦게 오름', over: '감정이 앞서고 쉽게 달아오르고 쉽게 지침', date: '낮 데이트·따뜻한 음식·마음을 말로 전하기' },
  토: { gives: '안정·신뢰·묵묵히 받쳐 주는 힘', lack: '뿌리가 얕아 불안이 잦고 관계가 붕 뜨기 쉬움', over: '변화를 꺼리고 답답하게 느껴질 수 있음', date: '익숙한 동네·집밥·규칙적인 만남' },
  금: { gives: '결단·기준·정리하는 힘', lack: '맺고 끊는 게 약해 관계가 늘어지기 쉬움', over: '날이 서고 비판이 앞서 상대가 위축될 수 있음', date: '계획된 여행·정돈된 공간·둘의 규칙 정하기' },
  수: { gives: '지혜·유연함·깊은 대화', lack: '융통성이 적고 감정을 안으로 담아 둠', over: '생각이 많아 결정이 늦고 불안이 번짐', date: '바다·강가·밤 산책·오래 이야기하기' },
};
const EL_WORD: Record<Element, string> = { 목: '나무', 화: '불', 토: '흙', 금: '금속', 수: '물' };

// ── 십신: 상대 일간이 나에게 어떤 별인가 ─────────────────────
// who: 결론 한 줄(이 사람은 나에게 …한 사람), feel: 같이 있으면 …, full: 근거 설명
const STAR: Record<Sipsin, { gloss: string; who: string; feel: string; full: string }> = {
  비견: { gloss: '나와 같은 기운·같은 음양', who: '나와 똑같이 생긴 친구 같은 사람', feel: '설명이 필요 없고 편해요. 대신 둘 다 양보가 없어요',
    full: '친구처럼 편하고 설명이 필요 없는 상대예요. 단점도 같습니다 — 둘 다 양보가 없어 주도권 다툼이 나면 길어집니다.' },
  겁재: { gloss: '나와 같은 오행·다른 음양', who: '닮았는데 미묘하게 달라 승부욕이 생기는 사람', feel: '자극과 경쟁이 함께 있어 서로를 끌어올려요',
    full: '닮았는데 미묘하게 달라 자극과 경쟁이 함께 있는 상대예요. 함께 있으면 승부욕이 생기고, 그만큼 서로를 끌어올립니다.' },
  식신: { gloss: '내가 낳아 기르는 기운', who: '내가 아끼고 잘해 주고 싶어지는 사람', feel: '말이 많아지고 잘 먹고 잘 웃게 돼요',
    full: '곁에 있으면 말이 많아지고 잘해 주고 싶어지는 상대 — 내가 아끼고 표현하는 쪽이 됩니다. 여유롭고 즐겁고 잘 먹고 잘 웃는 관계예요.' },
  상관: { gloss: '내가 낳는 기운·다른 음양', who: '내 끼와 재능을 밖으로 끌어내는 사람', feel: '더 화려해지고 대담해져요. 규칙을 깨고 싶어지기도 해요',
    full: '내 재능과 끼를 밖으로 끌어내는 상대예요. 만나면 더 화려해지고 대담해지지만, 규칙을 깨고 싶어지는 자리이기도 합니다.' },
  편재: { gloss: '내가 다루는 기운·같은 음양', who: '내가 이끌고 싶어지는, 활력을 주는 사람', feel: '활력이 생기고 자꾸 밖으로 나가고 싶어져요',
    full: '만나면 활력이 생기고 밖으로 나가고 싶어지며 재물의 흐름이 함께 도는 상대예요. 열정적이되, 소유하려 들면 손에서 빠져나갑니다.' },
  정재: { gloss: '내가 아끼고 지키는 기운', who: '자연스럽게 미래를 그리게 되는 사람', feel: '안정되고 실속이 생겨요. 살림이 그려져요',
    full: '안정과 실속의 상대예요. 함께 있으면 자연스럽게 미래를 계산하게 되고 살림이 그려집니다. 오래 가는 인연의 전형이에요.' },
  편관: { gloss: '나를 누르고 단련하는 기운·같은 음양', who: '긴장과 매력이 함께 오는, 강렬하게 끌리는 사람', feel: '대충 못 하게 되고 성장하지만, 피로도 있어요',
    full: '나를 단련시키는 자리라 만나면 성장하지만 피로도 있습니다. 강렬하게 끌리는 종류의 인연이에요.' },
  정관: { gloss: '나를 바로잡는 기운', who: '나를 단정하게 만드는, 믿음이 가는 사람', feel: '내가 단정해지고, 관계가 공식적인 모양을 갖춰요',
    full: '규범과 신뢰의 상대예요. 함께 있으면 나 자신이 단정해지고, 관계가 공식적인 형태(소개·약속·결혼)를 갖추기 쉬운 자리입니다.' },
  편인: { gloss: '나를 낳아 주는 기운·같은 음양', who: '독특한 방식으로 나를 이해해 주는 사람', feel: '둘만의 세계가 생겨요. 현실과 멀어지지 않게 챙겨야 해요',
    full: '정신적 교감이 깊고 둘만의 세계가 생기는 상대예요. 다만 현실과 멀어지지 않게 챙겨야 합니다.' },
  정인: { gloss: '나를 낳고 키우는 기운', who: '어른처럼 든든하고 배울 게 많은 사람', feel: '안정되고 자라요. 받기만 하지 않게 돌려주는 연습이 필요해요',
    full: '곁에 있으면 안정되고 성장하는 상대예요. 받는 것에 익숙해지지 않도록 돌려주는 연습이 필요합니다.' },
};
const STAR_GENDER = (s: Sipsin, meGender: 'M' | 'F'): string => {
  const g = GROUP_OF[s];
  if (meGender === 'M' && g === '재성') return ' 남자 사주에서 재성은 연인·아내의 별입니다 — 이 사람은 명리적으로 당신의 배우자 자리에 해당하는 기운이에요.';
  if (meGender === 'F' && g === '관성') return ' 여자 사주에서 관성은 연인·남편의 별입니다 — 이 사람은 명리적으로 당신의 배우자 자리에 해당하는 기운이에요.';
  if (meGender === 'M' && g === '관성') return ' 남자 사주에서 관성은 직장·명예의 별이라, 이 사람은 연인이면서 나를 세상에 세워 주는 쪽에 가깝습니다.';
  if (meGender === 'F' && g === '재성') return ' 여자 사주에서 재성은 재물·현실의 별이라, 이 사람은 연인이면서 살림과 현실을 함께 세우는 쪽에 가깝습니다.';
  return '';
};
/** "나" 시점으로 쓰인 문장을 상대 시점으로 — 나는 상대에게 어떤 별인가를 말할 때 */
const fromTheir = (t: string, name: string) => t.replace(/나를 /g, `${name}님을 `).replace(/나와 /g, `${name}님과 `).replace(/내가 /g, `${name}님이 `).replace(/내 /g, `${name}님의 `).replace(/나에게/g, `${name}님에게`);
const isSpouseStar = (s: Sipsin, meGender: 'M' | 'F') => (meGender === 'M' && GROUP_OF[s] === '재성') || (meGender === 'F' && GROUP_OF[s] === '관성');

// ── 십이운성: 상대의 배우자궁에 내 일간이 놓이면 ─────────────
const STAGE_ON: Record<string, string> = {
  장생: '상대 곁이 내 기운이 새로 태어나는 자리 — 함께 있으면 생기가 돌고 시작하는 힘이 납니다.',
  목욕: '상대 곁이 설레고 흔들리는 자리 — 연애 감정은 강한데 안정은 늦게 옵니다.',
  관대: '상대 곁이 내가 어른이 되는 자리 — 책임을 배우고 사회적으로 서게 됩니다.',
  건록: '상대 곁이 내가 제 뿌리를 얻는 자리 — 안정감과 실력이 함께 자랍니다.',
  제왕: '상대 곁이 내 기운이 가장 강해지는 자리 — 자신감이 붙지만 고집도 세집니다.',
  쇠: '상대 곁이 한숨 돌리는 자리 — 편안하고 무리하지 않게 되는 관계입니다.',
  병: '상대 곁이 마음이 약해지는 자리 — 기대고 싶어지고 예민해지기도 합니다.',
  사: '상대 곁이 멈춰 서는 자리 — 정적이고 조용한 관계, 활력은 밖에서 채워야 합니다.',
  묘: '상대 곁이 안으로 갈무리되는 자리 — 깊이 있지만 겉으로 표현이 적어집니다.',
  절: '상대 곁이 끊고 다시 시작하는 자리 — 극과 극을 오가며 정드는 관계입니다.',
  태: '상대 곁이 무언가 잉태되는 자리 — 새 계획·새 정체성이 이 관계에서 생깁니다.',
  양: '상대 곁이 길러지는 자리 — 보호받는 느낌, 천천히 자라는 관계입니다.',
};
export const STAGE_SHORT: Record<string, string> = {
  장생: '살아나요', 목욕: '설레지만 흔들려요', 관대: '어른이 돼요', 건록: '뿌리를 내려요', 제왕: '가장 세져요', 쇠: '한숨 돌려요',
  병: '기대고 싶어져요', 사: '조용해져요', 묘: '안으로 갈무리돼요', 절: '극과 극을 오가요', 태: '새 계획이 생겨요', 양: '보호받는 느낌이에요',
};

// ── 계절 조후 ────────────────────────────────────────────
type Season = '봄' | '여름' | '가을' | '겨울';
const seasonOf = (b: number): Season => ([2, 3, 4].includes(b) ? '봄' : [5, 6, 7].includes(b) ? '여름' : [8, 9, 10].includes(b) ? '가을' : '겨울');
const SEASON_PAIR: Record<string, { tl: string; full: string }> = {
  '봄|봄': { tl: '시작하는 힘은 둘 다 넘치고, 마무리는 둘 다 약해요.', full: '둘 다 봄에 태어나 시작하는 힘과 성장 욕구가 닮았습니다. 함께 무언가를 벌이기 좋지만, 마무리는 둘 다 약해 역할을 정해 두면 좋아요.' },
  '여름|여름': { tl: '온도가 빨리 오르고 다툼도 뜨거워요 — 식히는 시간을 일부러 넣어야 해요.', full: '둘 다 여름생이라 열기가 넘칩니다. 표현이 크고 관계의 온도가 빨리 오르지만, 식히는 기운이 없어 다툼도 뜨거워요. 물(水)의 시간(밤·바다·휴식)을 의식적으로 넣으세요.' },
  '가을|가을': { tl: '현실적이고 안정적인데, 따뜻한 말은 둘 다 연습이 필요해요.', full: '둘 다 가을생이라 정리하고 거두는 기질이 닮아 현실적이고 안정적입니다. 대신 감정 표현이 둘 다 건조할 수 있어 따뜻한 말은 연습이 필요해요.' },
  '겨울|겨울': { tl: '말없이도 통하지만, 온기는 둘 다 아쉬워요.', full: '둘 다 겨울생이라 속이 깊고 생각이 많은 두 사람입니다. 말없이도 통하지만 둘 다 온기가 아쉬워 따뜻한 것(불·낮·표현)을 함께 찾아야 합니다.' },
  '봄|여름': { tl: '같이 있으면 일이 커지고 빨라져요 — 브레이크 담당을 정하세요.', full: '봄생과 여름생, 성장과 열기의 조합입니다. 함께 있으면 일이 커지고 밖으로 뻗습니다. 속도가 빨라 브레이크를 누가 잡을지 정해 두세요.' },
  '봄|가을': { tl: '한쪽이 벌리고 한쪽이 정리하는 보완 구조예요.', full: '봄생과 가을생, 시작하는 사람과 거두는 사람입니다. 명리에서 반기는 보완 구조로 한쪽이 벌리면 한쪽이 정리합니다. 다만 속도 차이로 답답함이 생길 수 있어요.' },
  '봄|겨울': { tl: '겨울이 깊이를, 봄이 방향을 주는 조합이에요.', full: '봄생과 겨울생, 겨울의 물이 봄의 나무를 키우는 배열입니다. 겨울생이 깊이를, 봄생이 방향을 줍니다. 봄생이 겨울생의 침묵을 기다려 줄 수 있느냐가 관건이에요.' },
  '여름|가을': { tl: '표현이 건조함을 녹이고, 정리가 과열을 잡아 줘요.', full: '여름생과 가을생, 열기와 결단의 조합입니다. 서로 다른 온도라 처음엔 낯설지만, 여름생의 표현이 가을생의 건조함을 녹이고 가을생의 정리가 여름생의 과열을 잡아 줍니다.' },
  '여름|겨울': { tl: '기질은 정반대인데, 맞물리면 가장 오래 가는 조합이에요.', full: '여름생과 겨울생은 조후(調候 — 사주의 온도를 맞추는 것)로 최고의 보완입니다. 뜨거운 사람에게 시원함을, 차가운 사람에게 온기를. 기질은 정반대라 이해에 시간이 걸리지만 맞물리면 가장 오래 가는 조합이에요.' },
  '가을|겨울': { tl: '깊이 있고 현실적인데, 불씨 역할을 누가 하느냐가 관건이에요.', full: '가을생과 겨울생, 둘 다 차가운 계절입니다. 현실적이고 깊이 있는 관계가 되지만 온기가 아쉬워요. 둘 중 화(火) 기운을 가진 쪽이 관계의 불씨 역할을 해야 합니다.' },
};
const seasonPair = (a: Season, b: Season) => SEASON_PAIR[`${a}|${b}`] ?? SEASON_PAIR[`${b}|${a}`];

// ── 띠 ─────────────────────────────────────────────────
const ANIMAL_TRAIT: Record<string, string> = {
  쥐: '눈치가 빠르고 부지런하며 실속을 챙기는', 소: '묵묵하고 성실하며 한번 정한 길을 끝까지 가는', 호랑이: '용감하고 앞장서며 의리가 있는',
  토끼: '온화하고 섬세하며 평화를 중시하는', 용: '포부가 크고 존재감이 있으며 이상을 좇는', 뱀: '지혜롭고 신중하며 속을 잘 보이지 않는',
  말: '활달하고 자유로우며 열정적인', 양: '다정하고 예술적이며 배려가 깊은', 원숭이: '재치 있고 다재다능하며 호기심 많은',
  닭: '꼼꼼하고 기준이 분명하며 부지런한', 개: '충직하고 정의로우며 사람을 지키는', 돼지: '너그럽고 솔직하며 복이 따르는',
};

// ── 용어 풀이 (화면 하단) ───────────────────────────────────
export const GLOSSARY: { term: string; mean: string }[] = [
  { term: '일간(日干)', mean: '태어난 날의 천간. 사주에서 "나"를 뜻하는 글자라 모든 풀이의 기준점이에요.' },
  { term: '십신(十神)', mean: '다른 글자가 일간(나)에게 어떤 관계인지 열 가지로 나눈 이름. 비겁(나와 같은 기운)·식상(내가 낳는 기운)·재성(내가 다루는 기운)·관성(나를 누르는 기운)·인성(나를 낳는 기운).' },
  { term: '배우자궁(일지)', mean: '태어난 날의 지지. 사주에서 배우자·가장 가까운 관계를 보는 칸이에요.' },
  { term: '합(合) · 충(沖) · 원진(怨嗔)', mean: '두 글자의 관계. 합은 붙는 기운(천간합·육합·삼합), 충은 부딪혀 움직이는 기운, 원진은 이유 없이 거슬리는 기운.' },
  { term: '십이운성(十二運星)', mean: '기운의 나이. 장생(태어남)→건록·제왕(가장 셈)→병·사·묘(기울고 쉼)→절·태·양(다시 잉태) 열두 단계.' },
  { term: '신강 · 신약', mean: '내 기운이 센가 약한가. 신약은 나쁘다는 뜻이 아니라 사람·배움에 기댈 때 잘 되는 사주라는 뜻이에요.' },
  { term: '용신(用神)', mean: '내 사주에 가장 필요한 기운. 이 기운을 가진 사람이나 환경이 "약"이 돼요.' },
  { term: '격국(格局)', mean: '태어난 달(월지)로 정하는 사주의 틀. 이 사람이 세상에 나서는 방식이에요.' },
  { term: '대운(大運) · 세운(歲運)', mean: '대운은 10년마다 바뀌는 큰 운, 세운은 한 해의 운. 인연 대운은 배우자 별이 대운으로 들어온 10년.' },
  { term: '신살(神煞)', mean: '특정 글자 조합에 붙는 별. 천을귀인(도와주는 사람)·도화·홍염(매력)·역마(이동)·화개(몰입)·공망(빈 자리) 등.' },
];

// ── 결과 타입 ─────────────────────────────────────────────
export interface ElementRow { el: Element; mine: number; theirs: number; note: string; tone: 'good' | 'warn' | 'mut'; }
export interface LuckPair { pillar: Pillar; label: string; stemS: Sipsin; branchS: Sipsin; stage: string; startAge: number; }
export interface YearRow { year: number; pillar: Pillar; me: string; them: string; }
export interface ExtraReading {
  verdict: Section;
  teaser: Section;          // 미열람 상태에 보이는 결론 앞부분 + 절벽(cliffhanger)
  lockQuestions: string[];  // 잠긴 내용을 "답을 알게 되는 질문"으로
  criteria: string;         // 계산 기준 공개 한 줄
  meSections: Section[];
  themMore: Section[];
  relationSections: Section[];
  elementTable: ElementRow[];
  stageSections: Section[];
  timing: { me: LuckPair[]; them: LuckPair[]; years: YearRow[]; month: { pillar: Pillar; me: string; them: string } };
  timingSections: Section[];
  summary: Section;
}

// ── 결론 카드: 얘랑 나랑 어떻다 → 그래서 이런 느낌 ───────────────
function verdict(me: PersonAnalysis, them: PersonAnalysis, rel: Relation[], c: CompatResult, table: ElementRow[]): Section {
  const toMe = sipsin(me.dayStem, them.dayStem), toThem = sipsin(them.dayStem, me.dayStem);
  const P = STAR[toMe], Q = STAR[toThem];
  const haps = rel.filter((x) => x.kind.endsWith('합') && !x.kind.includes('삼합') && !x.kind.includes('육합')).length;
  const jiHap = rel.filter((x) => x.kind.includes('육합') || x.kind.includes('삼합') || x.kind === '일지 동일').length;
  const warns = rel.filter((x) => x.tone === 'warn');
  const fills = table.filter((r) => r.tone === 'good').map((r) => r.el);
  const stMe = stage12(me.dayStem, them.pillars[1].p!.branch);
  const band = c.total >= 85 ? '억지로 맞추지 않아도 맞는 사이' : c.total >= 75 ? '큰 틀이 맞아 작은 데서만 조율하면 되는 사이' : c.total >= 65 ? '다른 만큼 배울 게 많은 사이 — 규칙 몇 개면 오래 가요' : '기질이 많이 달라 끌림은 있어도 노력이 꼭 필요한 사이';

  const together = [
    haps >= 2 ? '천간합이 겹으로 있어 처음부터 이유 없이 편해요.' : haps === 1 ? '천간합이 있어 처음부터 자연스럽게 호감이 가요.' : '천간합은 없어 처음엔 담담하고, 만날수록 데워져요.',
    jiHap ? `지지의 합이 ${jiHap}개라 같이 있는 시간이 편하고 오래 갈수록 붙어요.` : '',
    fills.length ? `내게 부족한 ${fills.join('·')} 기운을 이 사람이 갖고 있어서, 같이 있으면 내가 더 온전해져요.` : '',
    `${them.name}님 곁에서 내 기운은 ${STAGE_SHORT[stMe]}(십이운성 ${stMe}).`,
  ].filter(Boolean).join(' ');

  const careful = warns.length
    ? `${[...new Set(warns.map((w) => w.kind))].join('·')} 자리가 ${warns.length}곳 있어요. ${warns[0].kind === '원진' ? '이유 없이 거슬리는 순간이 오는데, 말로 꺼내 웃어 버리면 힘을 잃어요.' : '리듬과 우선순위가 어긋나는 순간이 오는데, 영역을 나누고 누가 옳은지 겨루지 않으면 파도로 끝나요.'}`
    : '크게 부딪힐 자리는 없어요. 대신 익숙해지는 게 빨라서, 새로운 걸 같이 하는 습관이 필요해요.';

  return {
    key: 'verdict', label: '먼저 결론부터', title: `${them.name}님은 나에게 ${P.who}`,
    tldr: `궁합 ${c.total}점 — ${band}.`,
    paras: [
      `나부터 — ${me.name}님, ${askLine(me)} 일지 ${me.pillars[1].branchSipsin}의 기질이에요. 이 기질이 ${them.name}님을 만나면 아래처럼 됩니다.`,
      `${them.name}님은 나에게 — ${toMe}(${P.gloss}). ${P.who}이고, 같이 있으면 ${P.feel}.${isSpouseStar(toMe, me.gender) ? ' 명리에서 말하는 내 배우자 자리의 별이에요.' : ''}`,
      `나는 ${them.name}님에게 — ${toThem}(${fromTheir(Q.gloss, them.name)}). ${them.name}님에게 나는 ${fromTheir(Q.who, them.name)}이고, ${them.name}님은 나와 있을 때 ${fromTheir(Q.feel, them.name)}.${isSpouseStar(toThem, them.gender) ? ` ${them.name}님 입장에서도 배우자 자리의 별이에요.` : ''}`,
      `함께 있으면 — ${together}`,
      `조심할 곳 — ${careful}`,
      `그래서 — ${band}. 아래 장들은 이 결론의 근거예요.`,
    ],
  };
}

// ── 미열람 티저: 칭찬 → 절벽. 절벽은 실제 계산된 자리(충·원진·십이운성·대운)로 만든다 ──
function teaser(me: PersonAnalysis, them: PersonAnalysis, rel: Relation[], c: CompatResult, lm: LuckPair[], lt: LuckPair[]): Section {
  const toMe = sipsin(me.dayStem, them.dayStem);
  const P = STAR[toMe];
  const warns = rel.filter((x) => x.tone === 'warn');
  const stMe = stage12(me.dayStem, them.pillars[1].p!.branch);
  const bad = new Set(['절', '묘', '사', '병']);
  const praise = c.total >= 75 ? `이 정도면 흔한 궁합이 아니에요. ${P.who}${GA(P.who)} 맞고, 같이 있으면 ${P.feel}.` : `${P.who}이에요. 같이 있으면 ${P.feel}.`;
  let cliff: string;
  if (warns.length) {
    const w = warns[0];
    cliff = `두 사주 사이에 걸리는 글자가 ${warns.length}개 있어요. ${w.kind} — ${w.left} × ${w.right}. 이게 연애 어느 단계에서 터지는지, 피하는 방법은—`;
  } else if (bad.has(stMe)) {
    cliff = `${them.name}님 곁에서 내 기운은 ${STAGE_SHORT[stMe]}(십이운성 ${stMe}). 왜 그런지, 어떻게 뒤집는지는—`;
  } else {
    const meM = lm[0] ? ['재성', '관성'].includes(GROUP_OF[lm[0].stemS]) || ['재성', '관성'].includes(GROUP_OF[lm[0].branchS]) : false;
    cliff = `점수보다 중요한 게 하나 있어요. 두 사람의 인연 대운이 지금 겹치는지 — ${meM ? '한쪽은 들어와 있는데 다른 한쪽은' : '때가 맞는지는'}—`;
  }
  return {
    key: 'teaser', label: '먼저 결론부터', title: `${them.name}님은 나에게 ${P.who}`,
    paras: [
      `나부터 — ${me.name}님, ${askLine(me)} 일지 ${me.pillars[1].branchSipsin}의 기질이에요. 이 기질이 ${them.name}님을 만나면—`,
      `${them.name}님은 나에게 — ${toMe}(${P.gloss}). ${praise}`,
      `그런데 — ${cliff}`,
    ],
  };
}
export function lockQuestions(me: PersonAnalysis, them: PersonAnalysis): string[] {
  const n = them.name;
  return [
    `${n}님은 나에게 어떤 별인가 — 배우자 자리의 별인가`,
    `${n}님 곁에서 내 기운이 살아나는가, 죽는가`,
    '같이 살기 시작하면 어디서 부딪히는가',
    '내게 없는 기운을 이 사람이 채워 주는가',
    '첫 만남 → 연애 → 결혼 후, 흐름은 어떻게 바뀌는가',
    '두 사람의 인연 대운이 겹치는 해는 언제인가',
    '앞으로 3년, 두 사람의 해는 어떤가',
    '도령의 총평 — 두 사람에게 한마디',
  ];
}
export const CRITERIA = '만세력: 절기 입기 시각을 태양 황경으로 계산 · 시진은 한국 30분 보정(점신·사주도령과 같은 경계) · 십신은 지지 본기, 십이운성은 음간 역행 기준';

// ── 나의 사주 요약 ───────────────────────────────────────
function meSections(me: PersonAnalysis): Section[] {
  const dm = DM[me.dayStem];
  const dominant = (Object.entries(me.groupCount) as [string, number][]).sort((x, y) => y[1] - x[1])[0][0];
  const spouseEl = spouseElement(me);
  const ch = characterLine(me);
  return [{
    key: 'me', label: '나의 사주 한눈에', title: `${me.nick}의 ${me.element} — ${me.gyeokguk}, ${me.weak ? '신약' : '신강'}`,
    tldr: `${ch.who}, ${ch.spoken}. 연애는 ${ch.love}. 잘 맞는 짝은 ${EL_WORD[spouseEl]}(${spouseEl}) 기운의 사람.`,
    paras: [
      `${me.name}님의 일간(사주에서 "나"를 뜻하는 글자)은 ${STEMS_KO[me.dayStem]}${me.element}(${STEMS_HANJA[me.dayStem]}), ${me.nick}입니다. ${dm.who.split('. ').slice(0, 2).join('. ')}.`,
      `${me.weak ? `신약한 명식이라 ${me.favorable.join('·')} 기운을 반기고, ${me.avoid} 기운이 더 오면 부담이 됩니다.` : `신강한 명식이라 ${me.favorable.join('·')} 기운으로 풀어내야 편해집니다.`} 십성으로는 ${dominant}의 기운이 가장 두드러져요. 아래 궁합은 이 기준에서 "상대가 나에게 무엇을 보태고 무엇을 흔드는가"로 읽습니다.`,
      `연애에서의 ${me.name}님: ${dm.love}`,
    ],
  }];
}

// ── 개인 추가: 건강·대인·인생 흐름 (상대 또는 나) ────────────────
export function themMore(a: PersonAnalysis): Section[] {
  const el = a.element;
  const HEALTH: Record<Element, string> = {
    목: '목(木) 일간은 간·근육·신경과 통합니다. 스트레스를 몸으로 받는 편이라 과로하면 어깨·목이 먼저 굳고 잠이 얕아져요.',
    화: '화(火) 일간은 심장·혈관·눈과 통합니다. 과로하면 눈 피로·불면·가슴 답답함이 먼저 오고, 감정이 몸에 그대로 실립니다.',
    토: '토(土) 일간은 위장·소화와 통합니다. 걱정이 많아지면 소화가 먼저 막히고, 규칙적인 식사가 컨디션을 좌우해요.',
    금: '금(金) 일간은 폐·호흡기·피부와 통합니다. 계절 바뀔 때 잔병이 오고, 건조한 환경에서 예민해집니다.',
    수: '수(水) 일간은 신장·방광·귀와 통합니다. 몸이 차면 전체 컨디션이 떨어지고, 잠과 온기가 곧 약입니다.',
  };
  const HEALTH_TL: Record<Element, string> = { 목: '어깨·목이 먼저 굳는 몸 — 스트레스를 몸으로 받아요.', 화: '눈과 잠이 먼저 상하는 몸 — 감정이 몸에 실려요.', 토: '걱정하면 소화부터 막히는 몸이에요.', 금: '환절기와 건조함에 약한 몸이에요.', 수: '몸이 차면 다 떨어지는 몸 — 잠과 온기가 약이에요.' };
  const missing = ELEMENTS.filter((e) => a.elementCount[e] === 0);
  const over = ELEMENTS.filter((e) => a.elementCount[e] >= 3);
  const health = [HEALTH[el]];
  if (missing.length) health.push(`명식에 ${missing.join('·')} 기운이 비어 있어 — ${missing.map((m) => EL_MEAN[m].lack).join(', ')} 쪽을 살펴야 합니다.`);
  if (over.length) health.push(`${over.join('·')} 기운이 넘쳐 ${over.map((m) => EL_MEAN[m].over).join(', ')} 경향이 있어요.`);
  if (a.weak) health.push('신약한 명식의 공통 처방은 하나 — 잠. 이 사주는 쉬는 만큼 채워집니다.');

  const rel: string[] = [];
  const relTl: string[] = [];
  if (a.groupCount.비겁 >= 2) { rel.push('비겁(나와 같은 기운)이 강해 친구·동료 운이 좋고 사람 사이에서 기가 살지만, 자기 몫을 양보하는 데는 서툽니다.'); relTl.push('친구·동료 운이 좋음'); }
  if (a.groupCount.인성 >= 2) { rel.push('인성(나를 키우는 기운)이 있어 스승·멘토·나이 많은 조력자를 잘 만납니다. 혼자 뚫는 사람이 아니라 좋은 어른을 만나 뚫리는 사람이에요.'); relTl.push('좋은 어른을 만나 풀림'); }
  if (a.groupCount.식상 >= 2) { rel.push('식상(표현의 기운)이 강해 틀린 걸 보면 말하고 마는 성정 — 윗사람과 부딪히기 쉽고, 정확한 말을 조금 늦게 하는 것이 인간관계의 요령입니다.'); relTl.push('할 말은 하는 편'); }
  if (a.groupCount.관성 >= 2) { rel.push('관성(나를 누르는 기운)이 강해 예의 바르고 참는 게 많습니다. 불편한 걸 불편하다고 말하는 연습이 필요해요 — 말 안 하고 끊는 게 이 사주의 나쁜 버릇입니다.'); relTl.push('참다가 조용히 끊는 편'); }
  if (a.badges.some((b) => b.label === '천을귀인')) { rel.push('천을귀인(天乙貴人 — 도와주는 사람의 별)이 있어 어려울 때 도와주는 사람이 나타나는 명식입니다. 인복이 있다는 뜻이에요.'); relTl.push('인복 있음'); }
  if (!rel.length) { rel.push('십성이 고르게 퍼져 특정 관계에 치우치지 않습니다. 넓게 두루 어울리되 깊이는 스스로 선택하는 유형이에요.'); relTl.push('두루 어울리는 편'); }

  const stages = a.pillars.map((pi) => pi.stage);
  const good = ['장생', '건록', '제왕', '관대'], bad = ['절', '묘', '사', '병'];
  const early = good.includes(stages[3] ?? '') ? '어린 시절의 뿌리가 단단해 기가 눌리지 않는 사람입니다.' : bad.includes(stages[3] ?? '') ? '성장기의 환경이 넉넉하지 않았거나 기가 눌리는 일이 있었을 수 있어요 — 그만큼 일찍 어른이 된 사람입니다.' : '어린 시절은 평탄한 편입니다.';
  const social = good.includes(stages[2] ?? '') ? '사회에 나가서 힘을 얻는 유형이라 일에서 인정받기 쉽습니다.' : bad.includes(stages[2] ?? '') ? '청년기 사회생활에서 부침이 있어 늦게 자리 잡는 편이에요.' : '사회생활은 무난하게 굴러갑니다.';
  const flow = [
    `십이운성(기운의 나이)으로 읽는 인생의 흐름 — 년주 ${stages[3] ?? '—'}(어린 시절·집안), 월주 ${stages[2] ?? '—'}(청년기·사회), 일주 ${stages[1] ?? '—'}(배우자·중년), ${a.hasStage ? `시주 ${stages[0]}(말년·자식)` : '시주 미상'}.`,
    `${early} ${social}`,
  ];
  return [
    { key: 'health', label: '건강', title: `${el}(${STEMS_HANJA[a.dayStem]}) 일간의 몸`, paras: health, tldr: HEALTH_TL[el] },
    { key: 'people', label: '대인관계', title: rel.length > 1 ? '사람 사이에서의 이 사람' : '두루 어울리는 사람', paras: rel, tldr: relTl.join(' · ') + '.' },
    { key: 'flow', label: '인생의 흐름', title: '십이운성으로 읽는 네 자리', paras: flow, tldr: `${good.includes(stages[2] ?? '') ? '사회에 나가서 힘을 얻는 사람' : bad.includes(stages[2] ?? '') ? '늦게 자리 잡지만 그만큼 단단해지는 사람' : '무난하게 굴러가는 사회생활'}, ${good.includes(stages[1] ?? '') ? '배우자 자리는 든든해요.' : bad.includes(stages[1] ?? '') ? '가까운 관계에서 예민해지기 쉬워요.' : '배우자 자리는 무난해요.'}` },
  ];
}

// ── 이 사람은 나에게 ─────────────────────────────────────
function relationSections(me: PersonAnalysis, them: PersonAnalysis): Section[] {
  const toMe = sipsin(me.dayStem, them.dayStem), toThem = sipsin(them.dayStem, me.dayStem);
  const star: string[] = [
    `${me.name}님의 일간 ${STEMS_KO[me.dayStem]}${me.element}에서 보면 ${them.name}님의 일간 ${STEMS_KO[them.dayStem]}${them.element}${EUN(them.element)} ${toMe}(${STAR[toMe].gloss})입니다. ${STAR[toMe].full}${STAR_GENDER(toMe, me.gender)}`,
    `거꾸로 ${them.name}님에게 ${me.name}님은 ${toThem}(${STAR[toThem].gloss})입니다. ${STAR[toThem].full}${STAR_GENDER(toThem, them.gender)}`,
    GROUP_OF[toMe] === GROUP_OF[toThem] ? '두 방향이 같은 종류의 별이라 관계의 무게가 대등합니다.' : `${me.name}님에게는 ${GROUP_OF[toMe]}, ${them.name}님에게는 ${GROUP_OF[toThem]} — 서로 다른 것을 주고 받는 관계라 역할이 자연스럽게 나뉩니다.`,
  ];

  const stMe = stage12(me.dayStem, them.pillars[1].p!.branch), stThem = stage12(them.dayStem, me.pillars[1].p!.branch);
  const ilju = [
    `${me.name}님은 ${pillarKo(me.pillars[1].p!)}일주, ${them.name}님은 ${pillarKo(them.pillars[1].p!)}일주입니다. 일주(日柱)는 태어난 날의 간지이고, 내 일간을 상대의 배우자궁(일지)에 올려 십이운성으로 읽는 것이 일주 궁합의 요령이에요.`,
    `${me.name}님의 ${STEMS_KO[me.dayStem]}${GA(STEMS_KO[me.dayStem])} ${them.name}님의 일지 ${BRANCHES_KO[them.pillars[1].p!.branch]}에 놓이면 ${stMe} — ${STAGE_ON[stMe]}`,
    `${them.name}님의 ${STEMS_KO[them.dayStem]}${GA(STEMS_KO[them.dayStem])} ${me.name}님의 일지 ${BRANCHES_KO[me.pillars[1].p!.branch]}에 놓이면 ${stThem} — ${STAGE_ON[stThem].replace('상대 곁', `${me.name}님 곁`).replace('내 기운', `${them.name}님의 기운`).replace(/내가 /g, `${them.name}님이 `)}`,
  ];

  const sa = seasonOf(me.pillars[2].p!.branch), sb = seasonOf(them.pillars[2].p!.branch);
  const sp = seasonPair(sa, sb);
  const season = [`${me.name}님은 ${sa}생, ${them.name}님은 ${sb}생입니다. 조후(調候)는 두 사주의 온도가 서로 맞는지를 보는 것이에요. ${sp.full}`];

  const ya = me.pillars[3].p!.branch, yb = them.pillars[3].p!.branch;
  const an = me.animal, bn = them.animal;
  let zod = `${an}띠(${ANIMAL_TRAIT[an]} 기질)와 ${bn}띠(${ANIMAL_TRAIT[bn]} 기질)의 만남. `;
  let zodTl: string;
  if (branchesTrine(ya, yb)) { zod += '두 띠는 삼합(三合) — 같은 방향을 바라보는 동지의 합입니다. 큰 결정에서 뜻이 맞고, 나이 들수록 더 잘 맞는 띠 궁합이에요.'; zodTl = '띠끼리 삼합 — 큰 결정에서 뜻이 맞는 사이예요.'; }
  else if (branchesSixHarmony(ya, yb)) { zod += '두 띠는 육합(六合) — 일상의 합입니다. 함께 있는 시간이 편안하고 생활 리듬이 맞아요.'; zodTl = '띠끼리 육합 — 생활 리듬이 맞는 사이예요.'; }
  else if (branchesClash(ya, yb)) { zod += '두 띠는 충(沖) — 옛 어른들이 "띠가 맞지 않는다" 했던 자리입니다. 기질이 반대라 초반에 부딪히지만, 충은 움직임의 기운이라 서로를 바꾸며 정드는 관계이기도 해요.'; zodTl = '띠끼리 충 — 초반에 부딪히지만 서로를 바꾸며 정들어요.'; }
  else if (ya === yb) { zod += '같은 띠 — 닮은 기질이라 편하지만 닮은 약점도 같아, 둘 다 못 하는 일은 밖에서 도움을 받아야 합니다.'; zodTl = '같은 띠 — 편하지만 약점도 닮았어요.'; }
  else { zod += '두 띠 사이에 특별한 합도 충도 없어 — 띠보다는 일간과 일지가 이 관계를 결정합니다.'; zodTl = '띠는 무난 — 이 관계는 일간과 일지가 결정해요.'; }

  return [
    { key: 'star', label: '이 사람은 나에게', title: `${them.name}님은 나의 ${toMe}, 나는 ${them.name}님의 ${toThem}`, paras: star,
      tldr: `${them.name}님은 나에게 ${STAR[toMe].who}, 나는 ${them.name}님에게 ${fromTheir(STAR[toThem].who, them.name)}.` },
    { key: 'ilju', label: '일주 궁합', title: `${stMe} · ${stThem}`, paras: ilju,
      tldr: `${them.name}님 곁에서 나는 ${STAGE_SHORT[stMe]}, 내 곁에서 ${them.name}님은 ${STAGE_SHORT[stThem]}.` },
    { key: 'season', label: '계절 조후', title: `${sa}생과 ${sb}생`, paras: season, tldr: sp.tl },
    { key: 'zodiac', label: '띠 궁합', title: `${an}띠 × ${bn}띠`, paras: [zod], tldr: zodTl },
  ];
}

// ── 오행 보완표 ─────────────────────────────────────────
function elementTable(me: PersonAnalysis, them: PersonAnalysis): ElementRow[] {
  return ELEMENTS.map((el) => {
    const a = me.elementCount[el], b = them.elementCount[el];
    let note = '', tone: 'good' | 'warn' | 'mut' = 'mut';
    if (a === 0 && b >= 1) { note = `내게 없는 기운을 상대가 채워 줘요 — ${EL_MEAN[el].gives}`; tone = 'good'; }
    else if (a === 0 && b === 0) { note = `둘 다 비어 있어요 — ${EL_MEAN[el].lack}. 함께 밖에서 찾아야 할 기운`; tone = 'warn'; }
    else if (a >= 3 && b === 0) { note = `내게 넘치는 기운을 상대는 안 갖고 있어요 — 내 ${EL_MEAN[el].over.split('·')[0]}을(를) 상대가 받아 줍니다`; }
    else if (a >= 3 && b >= 3) { note = `둘 다 넘쳐요 — ${EL_MEAN[el].over}`; tone = 'warn'; }
    else if (a <= 1 && b >= 2) { note = `상대가 넉넉히 보태 줘요 — ${EL_MEAN[el].gives}`; tone = 'good'; }
    else if (me.favorable.includes(el) && b >= 1) { note = `내가 반기는 기운을 상대가 갖고 있어요`; tone = 'good'; }
    else note = '비슷하게 갖고 있어요';
    return { el, mine: a, theirs: b, note, tone };
  });
}

// ── 연애 단계별 흐름 · 함께 하면 좋은 것 ─────────────────────
function stageSections(me: PersonAnalysis, them: PersonAnalysis, rel: Relation[], c: CompatResult, table: ElementRow[]): Section[] {
  const haps = rel.filter((x) => x.kind.endsWith('합') && !x.kind.includes('삼합') && !x.kind.includes('육합')).length;
  const dayRel = rel.find((x) => x.left.includes(' 일지') && x.right.includes(' 일지'));
  const yearGood = rel.filter((x) => (x.kind.includes('삼합') || x.kind.includes('육합')) && (x.left.includes(' 년지') || x.right.includes(' 년지'))).length;
  const stMe = them.pillars[1].stage ?? '', stThem = me.pillars[1].stage ?? '';
  const good = new Set(['장생', '건록', '제왕', '관대']), bad = new Set(['절', '묘', '사', '병']);
  const paras = [
    `첫 만남 — ${haps >= 2 ? '천간합이 겹으로 있어 처음부터 이유 없이 편하고 자꾸 눈이 가는 조합입니다.' : haps === 1 ? '천간합이 하나 있어 첫인상에서 호감이 자연스럽게 생깁니다.' : '천간합이 없어 첫눈에 확 끌리는 종류는 아닙니다. 두세 번 만나면서 서서히 데워지는 쪽이에요.'} ${c.parts[1].score >= 80 ? '일간 궁합도 좋아 대화가 잘 붙습니다.' : c.parts[1].score >= 65 ? '일간 기질은 무난하게 맞습니다.' : '일간 기질이 달라 처음엔 낯설 수 있지만, 그 다름이 이 관계의 재미가 됩니다.'}`,
    `연애 — ${dayRel ? (dayRel.tone === 'good' ? `배우자궁끼리 ${dayRel.kind}이라 사귀기 시작하면 빠르게 가까워지고 마음의 안쪽이 서로 붙습니다.` : `배우자궁끼리 ${dayRel.kind}이라 사랑의 온도는 높은데 일상의 결이 달라, 함께 지내기 시작하면 조율이 필요합니다.`) : '배우자궁 사이에 합도 충도 없어 연애 초반은 담담하게 흘러갑니다. 자극보다 편안함이 먼저 오는 관계예요.'} ${c.parts[4].score >= 85 ? '음양이 정확히 보완되어 한쪽이 달리면 한쪽이 잡아 줍니다.' : ''}`,
    `오래 만나면 — ${yearGood ? '년지에 합이 있어 인생관과 큰 방향이 맞습니다. 결혼 초보다 결혼 10년 후가 더 좋은, 오래 갈수록 붙는 조합이에요.' : '년지 합은 없어 큰 방향은 대화로 맞춰 가야 합니다. 대신 서로 다른 세계를 가진 사람들이라 지루하지 않아요.'} ${table.filter((r) => r.tone === 'good').length >= 2 ? '오행으로도 서로의 결핍을 채워 주는 자리가 여럿이라, 함께 지낼수록 각자가 더 온전해지는 관계입니다.' : ''}`,
    `결혼 후 — ${them.name}님의 배우자궁은 ${stMe}, ${me.name}님의 배우자궁은 ${stThem}. ${good.has(stMe) && good.has(stThem) ? '두 사람 모두 배우자 자리가 살아 있어 결혼이 서로에게 힘이 되는 배열입니다.' : bad.has(stMe) && bad.has(stThem) ? '두 사람 모두 배우자 자리가 흔들리는 십이운성이라, 결혼 후 가장 가까운 사이에서 예민해지기 쉽습니다. 서로의 인내가 결혼의 재료예요.' : good.has(stMe) || good.has(stThem) ? `${good.has(stMe) ? them.name : me.name}님 쪽 배우자 자리가 살아 있어 결혼이 그쪽에 특히 힘이 되고, 다른 한쪽은 배우자에게 기대는 법을 배우는 관계입니다.` : '두 사람의 배우자 자리는 무난한 편이라, 결혼 생활은 사주보다 두 사람의 습관과 선택에 달려 있습니다.'}`,
  ];
  const stagesTl = `${haps ? '처음부터 편하고' : '천천히 데워지고'}, ${dayRel ? (dayRel.tone === 'good' ? '사귀면 빨리 가까워지고' : '같이 살 때 조율이 필요하고') : '연애 초반은 담담하고'}, ${yearGood ? '오래 갈수록 붙는' : '큰 방향은 대화로 맞춰 가는'} 흐름이에요.`;

  const dos: string[] = [];
  for (const r of table.filter((x) => x.tone === 'good').slice(0, 2)) dos.push(`${EL_MEAN[r.el].date} — ${them.name}님의 ${r.el} 기운이 ${me.name}님에게 스며드는 시간`);
  const theirNeed = them.favorable.find((e) => me.elementCount[e] >= 2);
  if (theirNeed) dos.push(`${EL_MEAN[theirNeed].date} — 거꾸로 ${me.name}님의 ${theirNeed} 기운이 ${them.name}님을 채우는 시간`);
  if (!dos.length) dos.push('둘 다 비어 있는 기운을 함께 찾는 활동 — 새 취미 하나를 같이 시작하기');
  const donts: string[] = [];
  for (const w of rel.filter((x) => x.tone === 'warn')) {
    if (w.left.includes(' 일지') && w.right.includes(' 일지')) donts.push('집안일·정리·쉬는 방식을 상대에게 강요하지 않기 — 배우자궁 충은 영역을 나눠야 풀립니다');
    else if (w.left.includes(' 월지') || w.right.includes(' 월지')) donts.push('일정은 서로 먼저 통보하기 — 사회궁(월지)과의 충은 시간 다툼으로 옵니다');
    else if (w.kind === '원진') donts.push('사소한 습관을 지적하는 대신 웃어 버리기 — 원진은 말로 꺼내면 힘을 잃습니다');
    else donts.push('우선순위가 어긋나는 순간, 누가 옳은지 겨루지 않기');
  }
  if (!donts.length) donts.push('부딪힐 자리가 없는 대신 익숙해지는 속도가 빠릅니다 — 함께 새로운 것을 하는 습관 만들기');
  const uniqDonts = [...new Set(donts)];
  return [
    { key: 'stages', label: '연애의 흐름', title: '첫 만남에서 결혼 후까지', paras, tldr: stagesTl },
    { key: 'dos', label: '함께 하면 좋은 것', title: '두 사주가 서로에게 스며드는 시간', paras: dos.map((d, i) => `${i + 1}. ${d}`), tldr: dos[0].split(' — ')[0] + ' 같은 시간이 두 사람에게 약이에요.' },
    { key: 'donts', label: '조심할 것', title: '다툼이 나는 자리 미리 알기', paras: uniqDonts.map((d, i) => `${i + 1}. ${d}`), tldr: uniqDonts[0].split(' — ')[0] + '.' },
  ];
}

// ── 시기 확장 ────────────────────────────────────────────
function luckPairs(a: PersonAnalysis, birth: { y: number; m: number; d: number }, hb: number | null, gender: 'M' | 'F', pillarsAll: import('./manseryeok').FourPillars, today: Date): LuckPair[] {
  const hh = hb === null ? 12 : (hb * 2) % 24;
  const dd = daeun(birth.y, birth.m, birth.d, hh, 30, gender, pillarsAll);
  if (!dd) return [];
  const age = today.getFullYear() - birth.y;
  const idx = Math.max(0, dd.cycles.findLastIndex((c) => c.startAge <= age));
  return [dd.cycles[idx], dd.cycles[idx + 1]].filter(Boolean).map((c, i) => ({
    pillar: c.pillar, label: i === 0 ? '지금' : '다음', stemS: sipsin(a.dayStem, c.pillar.stem), branchS: sipsinB(a.dayStem, c.pillar.branch),
    stage: stage12(a.dayStem, c.pillar.branch), startAge: c.startAge,
  }));
}
export const YEAR_ONE: Record<string, string> = {
  비겁: '자립·주도권', 식상: '표현·결과물', 재성: '재물·인연', 관성: '책임·공식화', 인성: '배움·정리',
};
function yearRows(me: PersonAnalysis, them: PersonAnalysis, year: number): YearRow[] {
  return [0, 1, 2].map((i) => {
    const y = year + i, p = splitGanzhi(y - 4);
    const f = (a: PersonAnalysis) => {
      const ss = sipsin(a.dayStem, p.stem), bs = sipsinB(a.dayStem, p.branch);
      const gi = CHEONEUL[a.dayStem].includes(p.branch);
      return `${ss}·${bs} — ${YEAR_ONE[GROUP_OF[ss]]}${gi ? ' · 귀인' : ''}${a.pillars.some((pi) => pi.p && branchesClash(pi.p.branch, p.branch)) ? ' · 충(변동)' : ''}`;
    };
    return { year: y, pillar: p, me: f(me), them: f(them) };
  });
}
function timingSections(me: PersonAnalysis, them: PersonAnalysis, lm: LuckPair[], lt: LuckPair[], month: { pillar: Pillar; me: string; them: string }): Section[] {
  const out: Section[] = [];
  const nextLine = (a: PersonAnalysis, l: LuckPair[]) => l[1]
    ? `${a.name}님의 다음 대운은 ${l[1].startAge}세(${pillarKo(l[1].pillar)})부터 ${l[1].stemS}·${l[1].branchS}, 십이운성 ${l[1].stage}. ${GROUP_OF[l[1].stemS] === GROUP_OF[l[0].stemS] ? '지금과 같은 계열의 기운이 이어져 흐름이 크게 바뀌지 않습니다.' : `${YEAR_ONE[GROUP_OF[l[0].stemS]]}의 시기에서 ${YEAR_ONE[GROUP_OF[l[1].stemS]]}의 시기로 계절이 바뀝니다.`}`
    : `${a.name}님의 다음 대운은 계산 범위 밖입니다.`;
  const gap = lm[1] && lt[1] ? Math.abs(lm[1].startAge - lt[1].startAge) : null;
  out.push({
    key: 'daeun2', label: '다음 계절', title: '두 사람의 대운이 바뀌는 때',
    tldr: lm[1] && lt[1] ? `${me.name}님은 ${lm[1].startAge}세, ${them.name}님은 ${lt[1].startAge}세에 대운이 바뀌어요.${gap !== null && gap <= 2 ? ' 교운 시기가 가까워 큰 결정이 그 무렵 몰려요.' : ''}` : '다음 대운은 한쪽이 계산 범위 밖이에요.',
    paras: [nextLine(me, lm), nextLine(them, lt), '대운이 바뀌는 해 전후 1~2년은 관계의 단계도 함께 바뀌기 쉬운 때입니다. 두 사람의 교운 시기가 가까우면 그 무렵 큰 결정(동거·결혼·이사)이 몰리니 미리 이야기해 두면 좋아요.'],
  });
  out.push({
    key: 'month', label: '이번 달', title: `${pillarKo(month.pillar)}월, 두 사람의 이달`,
    tldr: `이달은 ${me.name}님에게 ${month.me.split(' — ')[1]}, ${them.name}님에게 ${month.them.split(' — ')[1]}.`,
    paras: [`${me.name}님의 이달은 ${month.me}. ${them.name}님의 이달은 ${month.them}.`, '월운은 그날그날의 바람 같은 것 — 대운·세운이 바탕이고, 월운은 "이달에 말을 꺼내기 좋은가" 정도로 가볍게 참고하세요.'],
  });
  return out;
}

// ── 총평 ────────────────────────────────────────────────
function summary(me: PersonAnalysis, them: PersonAnalysis, rel: Relation[], c: CompatResult, table: ElementRow[]): Section {
  const band = c.total >= 85 ? '천생연분급' : c.total >= 75 ? '좋은 궁합' : c.total >= 65 ? '노력하면 오래 가는 궁합' : '배울 것이 많은 인연';
  const toMe = sipsin(me.dayStem, them.dayStem);
  const goods = rel.filter((r) => r.tone === 'good').map((r) => r.kind);
  const warns = rel.filter((r) => r.tone === 'warn').map((r) => r.kind);
  const fills = table.filter((r) => r.tone === 'good').map((r) => r.el);
  const strong = c.parts.filter((p) => p.score >= 85).map((p) => p.label);
  const weakest = [...c.parts].sort((a, b) => a.score - b.score)[0];
  const meWord = me.groupCount.식상 - me.groupCount.관성 > 0 ? '정확한 말을 조금 늦게 하세요. 이기는 말 대신 빛나는 말을.' : me.groupCount.관성 - me.groupCount.식상 > 0 ? '참다가 끊지 말고, 불편한 건 불편하다고 말하세요.' : me.weak ? '이 사람에게 기대는 것을 어려워하지 마세요. 신약한 명식은 사람으로 채워집니다.' : '가진 힘이 넉넉한 만큼 상대의 속도를 한 박자 기다려 주세요.';
  const themWord = them.groupCount.식상 - them.groupCount.관성 > 0 ? '틀린 걸 보면 말하는 성정, 그 말의 타이밍이 관계를 결정합니다.' : them.groupCount.관성 - them.groupCount.식상 > 0 ? '마음은 말로 꺼내 줘야 상대가 온기를 압니다.' : them.weak ? '혼자 다 짊어지지 말고 이 사람에게 나눠 주세요.' : '주도권을 겨루지 않으면 이 인연은 점수보다 훨씬 멀리 갑니다.';
  const paras = [
    `한마디로 — ${them.name}님은 나에게 ${STAR[toMe].who}이고, 같이 있으면 ${STAR[toMe].feel}. 궁합 ${c.total}점, ${band}입니다.`,
    `점수로 보면 ${strong.length ? `${strong.join('·')}${GA(strong[strong.length - 1])} 특히 좋고, ` : ''}${weakest.label}(${weakest.score}점)이 이 관계의 숙제예요.`,
    `강점은 ${[...new Set(goods)].length ? `${[...new Set(goods)].join('·')}의 자리` : '기운의 간섭이 적은 담담함'}${fills.length ? `, 그리고 ${fills.join('·')} 기운을 상대가 채워 준다는 것` : ''}입니다. ${warns.length ? `조심할 자리는 ${[...new Set(warns)].join('·')} — 위 "조심할 것"에 적은 규칙만 지키면 파도로 끝납니다.` : '부딪힐 자리가 없으니 관계의 관건은 익숙함을 어떻게 새롭게 하느냐예요.'}`,
    `${me.name}님께 한마디 — ${meWord} ${them.name}님께 한마디 — ${themWord}`,
  ];
  return { key: 'summary', label: '도령의 총평', title: `${c.total}점 — ${band}`, paras, tldr: `${STAR[toMe].who}. ${band}.` };
}

// ── 진입점 ──────────────────────────────────────────────
export function extraReading(
  me: PersonAnalysis, them: PersonAnalysis, rel: Relation[], c: CompatResult,
  meBirth: { y: number; m: number; d: number }, themBirth: { y: number; m: number; d: number },
  mePillars: import('./manseryeok').FourPillars, themPillars: import('./manseryeok').FourPillars, today = new Date(),
): ExtraReading {
  const table = elementTable(me, them);
  const lm = luckPairs(me, meBirth, mePillars.hour?.branch ?? null, me.gender, mePillars, today);
  const lt = luckPairs(them, themBirth, themPillars.hour?.branch ?? null, them.gender, themPillars, today);
  const years = yearRows(me, them, today.getFullYear());
  const mp = monthPillar(today.getFullYear(), today.getMonth() + 1, today.getDate(), null);
  const mline = (a: PersonAnalysis) => `${sipsin(a.dayStem, mp.stem)}·${sipsinB(a.dayStem, mp.branch)} — ${YEAR_ONE[GROUP_OF[sipsin(a.dayStem, mp.stem)]]}의 달`;
  const month = { pillar: mp, me: mline(me), them: mline(them) };
  return {
    verdict: verdict(me, them, rel, c, table),
    teaser: teaser(me, them, rel, c, lm, lt),
    lockQuestions: lockQuestions(me, them),
    criteria: CRITERIA,
    meSections: meSections(me),
    themMore: themMore(them),
    relationSections: relationSections(me, them),
    elementTable: table,
    stageSections: stageSections(me, them, rel, c, table),
    timing: { me: lm, them: lt, years, month },
    timingSections: timingSections(me, them, lm, lt, month),
    summary: summary(me, them, rel, c, table),
  };
}
