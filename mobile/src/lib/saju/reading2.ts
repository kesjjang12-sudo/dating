// 상세 풀이 확장 — "이 사람은 나에게 어떤 별인가": 십신 관계·일주 궁합·계절 조후·띠·오행 보완표,
// 연애 단계별 흐름, 함께 하면 좋은 것/조심할 것, 나의 사주 요약, 상대의 건강·대인·인생 흐름,
// 시기 확장(현재·다음 대운, 3년 세운, 이번 달), 총평. reading.ts의 분석 결과를 입력으로 받는다.

import { CompatResult } from './compat';
import { daeun } from './daeun';
import {
  BRANCH_ANIMALS, BRANCHES_KO, branchesClash, branchesSixHarmony, branchesTrine, Element, ELEMENTS, pillarKo,
  Pillar, splitGanzhi, STEMS_HANJA, STEMS_KO,
} from './ganzhi';
import { monthPillar } from './manseryeok';
import { CHEONEUL, DM, GROUP_OF, PersonAnalysis, Relation, Section, sipsin, sipsinB, Sipsin, stage12 } from './reading';

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

// ── 십신: 상대 일간이 나에게 어떤 별인가 (연애 문맥) ─────────
const STAR: Record<Sipsin, string> = {
  비견: '나와 같은 기운, 같은 음양의 사람입니다. 친구처럼 편하고 설명이 필요 없는 상대예요. 단점도 같습니다 — 둘 다 양보가 없어 주도권 다툼이 나면 길어집니다.',
  겁재: '같은 오행이지만 음양이 다른 사람입니다. 닮았는데 미묘하게 달라 자극과 경쟁이 함께 있는 상대예요. 함께 있으면 승부욕이 생기고, 그만큼 서로를 끌어올립니다.',
  식신: '내가 생(生)하는 기운의 사람입니다. 곁에 있으면 말이 많아지고 잘해 주고 싶어지는 상대 — 내가 아끼고 표현하는 쪽이 됩니다. 여유롭고 즐겁고 잘 먹고 잘 웃는 관계예요.',
  상관: '내가 생하는 기운에 음양이 다른 사람입니다. 내 재능과 끼를 밖으로 끌어내는 상대예요. 만나면 더 화려해지고 대담해지지만, 규칙을 깨고 싶어지는 자리이기도 합니다.',
  편재: '내가 다루는 기운의 사람입니다. 만나면 활력이 생기고 밖으로 나가고 싶어지며 재물의 흐름이 함께 도는 상대 — 열정적이되, 소유하려 들면 손에서 빠져나갑니다.',
  정재: '내가 아끼고 지키는 기운의 사람입니다. 안정과 실속의 상대 — 함께 있으면 자연스럽게 미래를 계산하게 되고 살림이 그려집니다. 오래 가는 인연의 전형이에요.',
  편관: '나를 극(克)하는 기운에 음양이 같은 사람입니다. 긴장과 매력이 함께 오는 상대 — 나를 단련시키는 자리라 만나면 성장하지만 피로도 있습니다. 강렬하게 끌리는 종류의 인연이에요.',
  정관: '나를 바로잡는 기운의 사람입니다. 규범과 신뢰의 상대 — 함께 있으면 나 자신이 단정해지고, 관계가 공식적인 형태(소개·약속·결혼)를 갖추기 쉬운 자리입니다.',
  편인: '나를 생하는 기운에 음양이 같은 사람입니다. 독특한 방식으로 나를 이해해 주는 상대 — 정신적 교감이 깊고 둘만의 세계가 생깁니다. 다만 현실과 멀어지지 않게 챙겨야 해요.',
  정인: '나를 생하고 키우는 기운의 사람입니다. 어른처럼 든든하고 배울 것이 많은 상대 — 곁에 있으면 안정되고 성장합니다. 받는 것에 익숙해지지 않도록 돌려주는 연습이 필요해요.',
};
const STAR_GENDER = (s: Sipsin, meGender: 'M' | 'F'): string => {
  const g = GROUP_OF[s];
  if (meGender === 'M' && g === '재성') return ' 남자 사주에서 재성은 연인·아내의 별입니다 — 이 사람은 명리적으로 당신의 배우자 자리에 해당하는 기운이에요.';
  if (meGender === 'F' && g === '관성') return ' 여자 사주에서 관성은 연인·남편의 별입니다 — 이 사람은 명리적으로 당신의 배우자 자리에 해당하는 기운이에요.';
  if (meGender === 'M' && g === '관성') return ' 남자 사주에서 관성은 직장·명예의 별이라, 이 사람은 연인이면서 나를 세상에 세워 주는 쪽에 가깝습니다.';
  if (meGender === 'F' && g === '재성') return ' 여자 사주에서 재성은 재물·현실의 별이라, 이 사람은 연인이면서 살림과 현실을 함께 세우는 쪽에 가깝습니다.';
  return '';
};

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

// ── 계절 조후 ────────────────────────────────────────────
type Season = '봄' | '여름' | '가을' | '겨울';
const seasonOf = (b: number): Season => ([2, 3, 4].includes(b) ? '봄' : [5, 6, 7].includes(b) ? '여름' : [8, 9, 10].includes(b) ? '가을' : '겨울');
const SEASON_PAIR: Record<string, string> = {
  '봄|봄': '둘 다 봄에 태어나 시작하는 힘과 성장 욕구가 닮았습니다. 함께 무언가를 벌이기 좋지만, 마무리는 둘 다 약해 역할을 정해 두면 좋아요.',
  '여름|여름': '둘 다 여름생 — 열기가 넘칩니다. 표현이 크고 관계의 온도가 빨리 오르지만, 식히는 기운이 없어 다툼도 뜨거워요. 물(水)의 시간(밤·바다·휴식)을 의식적으로 넣으세요.',
  '가을|가을': '둘 다 가을생 — 정리하고 거두는 기질이 닮아 현실적이고 안정적입니다. 대신 감정 표현이 둘 다 건조할 수 있어 따뜻한 말은 연습이 필요해요.',
  '겨울|겨울': '둘 다 겨울생 — 속이 깊고 생각이 많은 두 사람입니다. 말없이도 통하지만 둘 다 온기가 아쉬워 따뜻한 것(불·낮·표현)을 함께 찾아야 합니다.',
  '봄|여름': '봄생과 여름생 — 성장과 열기의 조합. 함께 있으면 일이 커지고 밖으로 뻗습니다. 속도가 빨라 브레이크를 누가 잡을지 정해 두세요.',
  '봄|가을': '봄생과 가을생 — 시작하는 사람과 거두는 사람. 명리에서 반기는 보완 구조로, 한쪽이 벌리면 한쪽이 정리합니다. 다만 속도 차이로 답답함이 생길 수 있어요.',
  '봄|겨울': '봄생과 겨울생 — 겨울의 물이 봄의 나무를 키우는 배열입니다. 겨울생이 깊이를, 봄생이 방향을 줍니다. 봄생이 겨울생의 침묵을 기다려 줄 수 있느냐가 관건이에요.',
  '여름|가을': '여름생과 가을생 — 열기와 결단의 조합. 서로 다른 온도라 처음엔 낯설지만, 여름생의 표현이 가을생의 건조함을 녹이고 가을생의 정리가 여름생의 과열을 잡아 줍니다.',
  '여름|겨울': '여름생과 겨울생 — 조후(調候)로 최고의 보완입니다. 뜨거운 사람에게 시원함을, 차가운 사람에게 온기를. 기질은 정반대라 이해에 시간이 걸리지만 맞물리면 가장 오래 가는 조합이에요.',
  '가을|겨울': '가을생과 겨울생 — 둘 다 차가운 계절입니다. 현실적이고 깊이 있는 관계가 되지만 온기가 아쉬워요. 둘 중 화(火) 기운을 가진 쪽이 관계의 불씨 역할을 해야 합니다.',
};
const seasonPair = (a: Season, b: Season) => SEASON_PAIR[`${a}|${b}`] ?? SEASON_PAIR[`${b}|${a}`];

// ── 띠 ─────────────────────────────────────────────────
const ANIMAL_TRAIT: Record<string, string> = {
  쥐: '눈치가 빠르고 부지런하며 실속을 챙기는', 소: '묵묵하고 성실하며 한번 정한 길을 끝까지 가는', 호랑이: '용감하고 앞장서며 의리가 있는',
  토끼: '온화하고 섬세하며 평화를 중시하는', 용: '포부가 크고 존재감이 있으며 이상을 좇는', 뱀: '지혜롭고 신중하며 속을 잘 보이지 않는',
  말: '활달하고 자유로우며 열정적인', 양: '다정하고 예술적이며 배려가 깊은', 원숭이: '재치 있고 다재다능하며 호기심 많은',
  닭: '꼼꼼하고 기준이 분명하며 부지런한', 개: '충직하고 정의로우며 사람을 지키는', 돼지: '너그럽고 솔직하며 복이 따르는',
};

// ── 결과 타입 ─────────────────────────────────────────────
export interface ElementRow { el: Element; mine: number; theirs: number; note: string; tone: 'good' | 'warn' | 'mut'; }
export interface LuckPair { pillar: Pillar; label: string; stemS: Sipsin; branchS: Sipsin; stage: string; startAge: number; }
export interface YearRow { year: number; pillar: Pillar; me: string; them: string; }
export interface ExtraReading {
  meSections: Section[];
  themMore: Section[];
  relationSections: Section[];
  elementTable: ElementRow[];
  stageSections: Section[];
  timing: { me: LuckPair[]; them: LuckPair[]; years: YearRow[]; month: { pillar: Pillar; me: string; them: string } };
  timingSections: Section[];
  summary: Section;
}

// ── 나의 사주 요약 ───────────────────────────────────────
function meSections(me: PersonAnalysis, them: PersonAnalysis): Section[] {
  const dm = DM[me.dayStem];
  const dominant = (Object.entries(me.groupCount) as [string, number][]).sort((x, y) => y[1] - x[1])[0][0];
  return [{
    key: 'me', label: '나의 사주 한눈에', title: `${me.nick}의 ${me.element} — ${me.gyeokguk}, ${me.weak ? '신약' : '신강'}`,
    paras: [
      `${me.name}님의 일간은 ${STEMS_KO[me.dayStem]}${me.element}(${STEMS_HANJA[me.dayStem]}), ${me.nick}입니다. ${dm.who.split('. ').slice(0, 2).join('. ')}.`,
      `${me.weak ? `신약한 명식이라 ${me.favorable.join('·')} 기운을 반기고, ${me.avoid} 기운이 더 오면 부담이 됩니다.` : `신강한 명식이라 ${me.favorable.join('·')} 기운으로 풀어내야 편해집니다.`} 십성으로는 ${dominant}의 기운이 가장 두드러져요. 아래 궁합은 이 기준에서 "상대가 나에게 무엇을 보태고 무엇을 흔드는가"로 읽습니다.`,
      `연애에서의 ${me.name}님: ${dm.love}`,
    ],
  }];
}

// ── 상대 사주 추가: 건강·대인·인생 흐름 ────────────────────
function themMore(a: PersonAnalysis): Section[] {
  const el = a.element;
  const HEALTH: Record<Element, string> = {
    목: '목(木) 일간은 간·근육·신경과 통합니다. 스트레스를 몸으로 받는 편이라 과로하면 어깨·목이 먼저 굳고 잠이 얕아져요.',
    화: '화(火) 일간은 심장·혈관·눈과 통합니다. 과로하면 눈 피로·불면·가슴 답답함이 먼저 오고, 감정이 몸에 그대로 실립니다.',
    토: '토(土) 일간은 위장·소화와 통합니다. 걱정이 많아지면 소화가 먼저 막히고, 규칙적인 식사가 컨디션을 좌우해요.',
    금: '금(金) 일간은 폐·호흡기·피부와 통합니다. 계절 바뀔 때 잔병이 오고, 건조한 환경에서 예민해집니다.',
    수: '수(水) 일간은 신장·방광·귀와 통합니다. 몸이 차면 전체 컨디션이 떨어지고, 잠과 온기가 곧 약입니다.',
  };
  const missing = ELEMENTS.filter((e) => a.elementCount[e] === 0);
  const over = ELEMENTS.filter((e) => a.elementCount[e] >= 3);
  const health = [HEALTH[el]];
  if (missing.length) health.push(`명식에 ${missing.join('·')} 기운이 비어 있어 — ${missing.map((m) => EL_MEAN[m].lack).join(', ')} 쪽을 살펴야 합니다.`);
  if (over.length) health.push(`${over.join('·')} 기운이 넘쳐 ${over.map((m) => EL_MEAN[m].over).join(', ')} 경향이 있어요.`);
  if (a.weak) health.push('신약한 명식의 공통 처방은 하나 — 잠. 이 사주는 쉬는 만큼 채워집니다.');

  const rel: string[] = [];
  if (a.groupCount.비겁 >= 2) rel.push('비겁이 강해 친구·동료 운이 좋고 사람 사이에서 기가 살지만, 자기 몫을 양보하는 데는 서툽니다.');
  if (a.groupCount.인성 >= 2) rel.push('인성이 있어 스승·멘토·나이 많은 조력자를 잘 만납니다. 혼자 뚫는 사람이 아니라 좋은 어른을 만나 뚫리는 사람이에요.');
  if (a.groupCount.식상 >= 2) rel.push('식상이 강해 틀린 걸 보면 말하고 마는 성정 — 윗사람과 부딪히기 쉽고, 정확한 말을 조금 늦게 하는 것이 인간관계의 요령입니다.');
  if (a.groupCount.관성 >= 2) rel.push('관성이 강해 예의 바르고 참는 게 많습니다. 불편한 걸 불편하다고 말하는 연습이 필요해요 — 말 안 하고 끊는 게 이 사주의 나쁜 버릇입니다.');
  if (a.badges.some((b) => b.label === '천을귀인')) rel.push('천을귀인이 있어 어려울 때 도와주는 사람이 나타나는 명식입니다. 인복이 있다는 뜻이에요.');
  if (!rel.length) rel.push('십성이 고르게 퍼져 특정 관계에 치우치지 않습니다. 넓게 두루 어울리되 깊이는 스스로 선택하는 유형이에요.');

  const stages = a.pillars.map((pi) => pi.stage);
  const flow = [
    `십이운성으로 읽는 인생의 흐름 — 년주 ${stages[3] ?? '—'}(어린 시절·집안), 월주 ${stages[2] ?? '—'}(청년기·사회), 일주 ${stages[1] ?? '—'}(배우자·중년), ${a.hasStage ? `시주 ${stages[0]}(말년·자식)` : '시주 미상'}.`,
    `${['장생', '건록', '제왕', '관대'].includes(stages[3] ?? '') ? '어린 시절의 뿌리가 단단해 기가 눌리지 않는 사람입니다.' : ['절', '묘', '사', '병'].includes(stages[3] ?? '') ? '성장기의 환경이 넉넉하지 않았거나 기가 눌리는 일이 있었을 수 있어요 — 그만큼 일찍 어른이 된 사람입니다.' : '어린 시절은 평탄한 편입니다.'} ${['장생', '건록', '제왕', '관대'].includes(stages[2] ?? '') ? '사회에 나가서 힘을 얻는 유형이라 일에서 인정받기 쉽습니다.' : ['절', '묘', '사', '병'].includes(stages[2] ?? '') ? '청년기 사회생활에서 부침이 있어 늦게 자리 잡는 편이에요.' : '사회생활은 무난하게 굴러갑니다.'}`,
  ];
  return [
    { key: 'health', label: '건강', title: `${el}(${STEMS_HANJA[a.dayStem]}) 일간의 몸`, paras: health },
    { key: 'people', label: '대인관계', title: rel.length > 1 ? '사람 사이에서의 이 사람' : '두루 어울리는 사람', paras: rel },
    { key: 'flow', label: '인생의 흐름', title: '십이운성으로 읽는 네 자리', paras: flow },
  ];
}

// ── 이 사람은 나에게 ─────────────────────────────────────
function relationSections(me: PersonAnalysis, them: PersonAnalysis, rel: Relation[]): Section[] {
  const toMe = sipsin(me.dayStem, them.dayStem), toThem = sipsin(them.dayStem, me.dayStem);
  const star: string[] = [
    `${me.name}님의 일간 ${STEMS_KO[me.dayStem]}${me.element}에서 보면 ${them.name}님의 일간 ${STEMS_KO[them.dayStem]}${them.element}${EUN(them.element)} ${toMe}입니다. ${STAR[toMe]}${STAR_GENDER(toMe, me.gender)}`,
    `거꾸로 ${them.name}님에게 ${me.name}님은 ${toThem}입니다. ${STAR[toThem]}${STAR_GENDER(toThem, them.gender)}`,
    GROUP_OF[toMe] === GROUP_OF[toThem] ? '두 방향이 같은 종류의 별이라 관계의 무게가 대등합니다.' : `${me.name}님에게는 ${GROUP_OF[toMe]}, ${them.name}님에게는 ${GROUP_OF[toThem]} — 서로 다른 것을 주고 받는 관계라 역할이 자연스럽게 나뉩니다.`,
  ];

  const stMe = stage12(me.dayStem, them.pillars[1].p!.branch), stThem = stage12(them.dayStem, me.pillars[1].p!.branch);
  const ilju = [
    `${me.name}님은 ${pillarKo(me.pillars[1].p!)}일주, ${them.name}님은 ${pillarKo(them.pillars[1].p!)}일주입니다. 내 일간을 상대의 배우자궁(일지)에 올려 보는 것이 일주 궁합의 요령이에요.`,
    `${me.name}님의 ${STEMS_KO[me.dayStem]}${GA(STEMS_KO[me.dayStem])} ${them.name}님의 일지 ${BRANCHES_KO[them.pillars[1].p!.branch]}에 놓이면 ${stMe} — ${STAGE_ON[stMe]}`,
    `${them.name}님의 ${STEMS_KO[them.dayStem]}${GA(STEMS_KO[them.dayStem])} ${me.name}님의 일지 ${BRANCHES_KO[me.pillars[1].p!.branch]}에 놓이면 ${stThem} — ${STAGE_ON[stThem].replace('상대 곁', `${me.name}님 곁`).replace('내 기운', `${them.name}님의 기운`).replace(/내가 /g, `${them.name}님이 `)}`,
  ];

  const sa = seasonOf(me.pillars[2].p!.branch), sb = seasonOf(them.pillars[2].p!.branch);
  const season = [`${me.name}님은 ${sa}생, ${them.name}님은 ${sb}생입니다. ${seasonPair(sa, sb)}`];

  const ya = me.pillars[3].p!.branch, yb = them.pillars[3].p!.branch;
  const an = me.animal, bn = them.animal;
  let zod = `${an}띠(${ANIMAL_TRAIT[an]} 기질)와 ${bn}띠(${ANIMAL_TRAIT[bn]} 기질)의 만남. `;
  if (branchesTrine(ya, yb)) zod += '두 띠는 삼합(三合) — 같은 방향을 바라보는 동지의 합입니다. 큰 결정에서 뜻이 맞고, 나이 들수록 더 잘 맞는 띠 궁합이에요.';
  else if (branchesSixHarmony(ya, yb)) zod += '두 띠는 육합(六合) — 일상의 합입니다. 함께 있는 시간이 편안하고 생활 리듬이 맞아요.';
  else if (branchesClash(ya, yb)) zod += '두 띠는 충(沖) — 옛 어른들이 "띠가 맞지 않는다" 했던 자리입니다. 기질이 반대라 초반에 부딪히지만, 충은 움직임의 기운이라 서로를 바꾸며 정드는 관계이기도 해요.';
  else if (ya === yb) zod += '같은 띠 — 닮은 기질이라 편하지만 닮은 약점도 같아, 둘 다 못 하는 일은 밖에서 도움을 받아야 합니다.';
  else zod += '두 띠 사이에 특별한 합도 충도 없어 — 띠보다는 일간과 일지가 이 관계를 결정합니다.';

  return [
    { key: 'star', label: '이 사람은 나에게', title: `${them.name}님은 나의 ${toMe}, 나는 ${them.name}님의 ${toThem}`, paras: star },
    { key: 'ilju', label: '일주 궁합', title: `${stMe} · ${stThem}`, paras: ilju },
    { key: 'season', label: '계절 조후', title: `${sa}생과 ${sb}생`, paras: season },
    { key: 'zodiac', label: '띠 궁합', title: `${an}띠 × ${bn}띠`, paras: [zod] },
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

  const dos: string[] = [];
  for (const r of table.filter((x) => x.tone === 'good').slice(0, 2)) dos.push(`${EL_MEAN[r.el].date} — ${them.name}님의 ${r.el} 기운이 ${me.name}님에게 스며드는 시간`);
  const theirNeed = them.favorable.find((e) => me.elementCount[e] >= 2);
  if (theirNeed) dos.push(`${EL_MEAN[theirNeed].date} — 거꾸로 ${me.name}님의 ${theirNeed} 기운이 ${them.name}님을 채우는 시간`);
  if (!dos.length) dos.push('둘 다 비어 있는 기운을 함께 찾는 활동 — 새 취미 하나를 같이 시작하기');
  const donts: string[] = [];
  for (const w of rel.filter((x) => x.tone === 'warn')) {
    if (w.left.includes(' 일지') && w.right.includes(' 일지')) donts.push('집안일·정리·쉬는 방식을 상대에게 강요하지 않기 — 배우자궁 충은 영역을 나눠야 풀립니다');
    else if (w.left.includes(' 월지') || w.right.includes(' 월지')) donts.push('일정은 서로 먼저 통보하기 — 사회궁과의 충은 시간 다툼으로 옵니다');
    else if (w.kind === '원진') donts.push('사소한 습관을 지적하는 대신 웃어 버리기 — 원진은 말로 꺼내면 힘을 잃습니다');
    else donts.push('우선순위가 어긋나는 순간, 누가 옳은지 겨루지 않기');
  }
  if (!donts.length) donts.push('부딪힐 자리가 없는 대신 익숙해지는 속도가 빠릅니다 — 함께 새로운 것을 하는 습관 만들기');
  return [
    { key: 'stages', label: '연애의 흐름', title: '첫 만남에서 결혼 후까지', paras },
    { key: 'dos', label: '함께 하면 좋은 것', title: '두 사주가 서로에게 스며드는 시간', paras: dos.map((d, i) => `${i + 1}. ${d}`) },
    { key: 'donts', label: '조심할 것', title: '다툼이 나는 자리 미리 알기', paras: [...new Set(donts)].map((d, i) => `${i + 1}. ${d}`) },
  ];
}

// ── 시기 확장 ────────────────────────────────────────────
function luckPairs(a: PersonAnalysis, birth: { y: number; m: number; d: number }, hb: number | null, gender: 'M' | 'F', pillarsAll: import('./manseryeok').FourPillars, today: Date): LuckPair[] {
  const hh = hb === null ? 12 : (hb * 2) % 24;
  const dd = daeun(birth.y, birth.m, birth.d, hh, 0, gender, pillarsAll);
  if (!dd) return [];
  const age = today.getFullYear() - birth.y;
  const idx = Math.max(0, dd.cycles.findLastIndex((c) => c.startAge <= age));
  return [dd.cycles[idx], dd.cycles[idx + 1]].filter(Boolean).map((c, i) => ({
    pillar: c.pillar, label: i === 0 ? '지금' : '다음', stemS: sipsin(a.dayStem, c.pillar.stem), branchS: sipsinB(a.dayStem, c.pillar.branch),
    stage: stage12(a.dayStem, c.pillar.branch), startAge: c.startAge,
  }));
}
const YEAR_ONE: Record<string, string> = {
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
function timingSections(me: PersonAnalysis, them: PersonAnalysis, lm: LuckPair[], lt: LuckPair[], years: YearRow[], month: { pillar: Pillar; me: string; them: string }, today: Date): Section[] {
  const out: Section[] = [];
  const nextLine = (a: PersonAnalysis, l: LuckPair[]) => l[1]
    ? `${a.name}님의 다음 대운은 ${l[1].startAge}세(${pillarKo(l[1].pillar)})부터 ${l[1].stemS}·${l[1].branchS}, 십이운성 ${l[1].stage}. ${GROUP_OF[l[1].stemS] === GROUP_OF[l[0].stemS] ? '지금과 같은 계열의 기운이 이어져 흐름이 크게 바뀌지 않습니다.' : `${YEAR_ONE[GROUP_OF[l[0].stemS]]}의 시기에서 ${YEAR_ONE[GROUP_OF[l[1].stemS]]}의 시기로 계절이 바뀝니다.`}`
    : `${a.name}님의 다음 대운은 계산 범위 밖입니다.`;
  out.push({
    key: 'daeun2', label: '다음 계절', title: '두 사람의 대운이 바뀌는 때',
    paras: [nextLine(me, lm), nextLine(them, lt), '대운이 바뀌는 해 전후 1~2년은 관계의 단계도 함께 바뀌기 쉬운 때입니다. 두 사람의 교운 시기가 가까우면 그 무렵 큰 결정(동거·결혼·이사)이 몰리니 미리 이야기해 두면 좋아요.'],
  });
  out.push({
    key: 'month', label: '이번 달', title: `${pillarKo(month.pillar)}월, 두 사람의 이달`,
    paras: [`${me.name}님의 이달은 ${month.me}. ${them.name}님의 이달은 ${month.them}.`, '월운은 그날그날의 바람 같은 것 — 대운·세운이 바탕이고, 월운은 "이달에 말을 꺼내기 좋은가" 정도로 가볍게 참고하세요.'],
  });
  return out;
}

// ── 총평 ────────────────────────────────────────────────
function summary(me: PersonAnalysis, them: PersonAnalysis, rel: Relation[], c: CompatResult, table: ElementRow[]): Section {
  const band = c.total >= 85 ? '천생연분급' : c.total >= 75 ? '좋은 궁합' : c.total >= 65 ? '노력하면 오래 가는 궁합' : '배울 것이 많은 인연';
  const goods = rel.filter((r) => r.tone === 'good').map((r) => r.kind);
  const warns = rel.filter((r) => r.tone === 'warn').map((r) => r.kind);
  const fills = table.filter((r) => r.tone === 'good').map((r) => r.el);
  const strong = c.parts.filter((p) => p.score >= 85).map((p) => p.label);
  const weakest = [...c.parts].sort((a, b) => a.score - b.score)[0];
  const paras = [
    `${me.name}님과 ${them.name}님의 궁합은 ${c.total}점, ${band}입니다. ${strong.length ? `${strong.join('·')}${GA(strong[strong.length - 1])} 특히 좋고, ` : ''}${weakest.label}(${weakest.score}점)이 이 관계의 숙제예요.`,
    `강점은 ${[...new Set(goods)].length ? `${[...new Set(goods)].join('·')}의 자리` : '기운의 간섭이 적은 담담함'}${fills.length ? `, 그리고 ${fills.join('·')} 기운을 상대가 채워 준다는 것` : ''}입니다. ${warns.length ? `조심할 자리는 ${[...new Set(warns)].join('·')} — 위 "조심할 것"에 적은 규칙만 지키면 파도로 끝납니다.` : '부딪힐 자리가 없으니 관계의 관건은 익숙함을 어떻게 새롭게 하느냐예요.'}`,
    `${me.name}님께 한마디 — ${me.groupCount.식상 - me.groupCount.관성 > 0 ? '정확한 말을 조금 늦게 하세요. 이기는 말 대신 빛나는 말을.' : me.groupCount.관성 - me.groupCount.식상 > 0 ? '참다가 끊지 말고, 불편한 건 불편하다고 말하세요.' : me.weak ? '이 사람에게 기대는 것을 어려워하지 마세요. 신약한 명식은 사람으로 채워집니다.' : '가진 힘이 넉넉한 만큼 상대의 속도를 한 박자 기다려 주세요.'} ${them.name}님께 한마디 — ${them.groupCount.식상 - them.groupCount.관성 > 0 ? '틀린 걸 보면 말하는 성정, 그 말의 타이밍이 관계를 결정합니다.' : them.groupCount.관성 - them.groupCount.식상 > 0 ? '마음은 말로 때 줘야 상대가 온기를 압니다.' : them.weak ? '혼자 다 짊어지지 말고 이 사람에게 나눠 주세요.' : '주도권을 겨루지 않으면 이 인연은 점수보다 훨씬 멀리 갑니다.'}`,
  ];
  return { key: 'summary', label: '도령의 총평', title: `${c.total}점 — ${band}`, paras };
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
    meSections: meSections(me, them),
    themMore: themMore(them),
    relationSections: relationSections(me, them, rel),
    elementTable: table,
    stageSections: stageSections(me, them, rel, c, table),
    timing: { me: lm, them: lt, years, month },
    timingSections: timingSections(me, them, lm, lt, years, month, today),
    summary: summary(me, them, rel, c, table),
  };
}
