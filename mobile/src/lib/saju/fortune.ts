// 오늘의 운세 — 오늘의 일진(일간지)과 사용자 일간의 십신 관계로 결정론 생성.

import {
  branchElement, BRANCHES_KO, branchesSixHarmony, Element, ELEMENT_DIRECTION,
  elementRelation, HOUR_RANGES, pillarHanja, pillarKo, stemElement,
} from './ganzhi';
import { dayPillar, FourPillars } from './manseryeok';

export interface DailyFortune {
  dateLabel: string;      // "8월 30일 토요일 · 정유일"
  title: string;
  body: string;
  luckyDirection: string;
  luckyHour: string;      // "오후 5–7시 (유시)"
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type Category = '비견' | '식상' | '재성' | '관성' | '인성';

const TITLES: Record<Category, string> = {
  비견: '나와 닮은 기운이 곁에 서는 날',
  식상: '표현의 기운이 열리는 날',
  재성: '움직인 만큼 돌아오는 날',
  관성: '한 템포 늦추면 길한 날',
  인성: '받아들이는 것이 이기는 날',
};

const BODIES: Record<Category, string> = {
  비견: '오늘은 당신과 같은 기운이 힘을 보태는 날입니다. 혼자 망설이던 일을 동행과 나누면 절반의 무게가 됩니다. 새 인연에게는 담백한 첫마디가 가장 잘 통해요.',
  식상: '마음에 담아둔 말이 자연스럽게 흘러나오는 날. 미뤄둔 연락을 먼저 건네면 뜻밖의 답이 돌아옵니다. 신호를 보내기에 가장 길한 하루예요.',
  재성: '부지런히 움직인 만큼 결실이 따르는 날입니다. 약속을 만들고, 자리를 옮기고, 먼저 다가가세요. 다만 지갑은 계획한 만큼만 여는 것이 길합니다.',
  관성: '기운이 당신을 시험하는 날 — 서두르면 어긋나고, 정중하면 통합니다. 오늘의 인연에게는 신중한 한마디가 열 마디보다 깊게 남아요.',
  인성: '주기보다 받는 것이 순리인 날입니다. 도움과 호의를 사양하지 마세요. 연장자나 먼저 다가오는 인연에게 귀인의 기운이 실려 있습니다.',
};

function categoryOf(userDayStem: number, todayStem: number): Category {
  const me = stemElement(userDayStem), today = stemElement(todayStem);
  const rel = elementRelation(me, today);
  switch (rel) {
    case 'same': return '비견';
    case 'a-gives-b': return '식상';   // 내가 생하는 기운
    case 'a-controls-b': return '재성'; // 내가 극하는 기운
    case 'b-controls-a': return '관성'; // 나를 극하는 기운
    case 'b-gives-a': return '인성';   // 나를 생하는 기운
  }
}

/** 사용자 일지와 육합하는 지지의 시진 → 길한 시간 */
function luckyHourOf(userDayBranch: number): string {
  for (let b = 0; b < 12; b++) {
    if (branchesSixHarmony(userDayBranch, b)) {
      return `${HOUR_RANGES[b]} (${BRANCHES_KO[b]}시)`;
    }
  }
  return '11:30–13:30 (오시)';
}

export function dailyFortune(date: Date, user: FourPillars): DailyFortune {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const today = dayPillar(y, m, d);
  const cat = categoryOf(user.day.stem, today.stem);
  const todayElem: Element = branchElement(today.branch);
  return {
    dateLabel: `${m}월 ${d}일 ${WEEKDAYS[date.getDay()]}요일 · ${pillarKo(today)}일(${pillarHanja(today)})`,
    title: TITLES[cat],
    body: BODIES[cat],
    luckyDirection: ELEMENT_DIRECTION[todayElem],
    luckyHour: luckyHourOf(user.day.branch),
  };
}

/** 이번 주 연애운(유료 풀이) — 일주일치 카테고리를 훑어 문단 생성 */
export function weeklyFortune(from: Date, user: FourPillars): string {
  const best: { day: string; cat: Category }[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const p = dayPillar(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    best.push({ day: `${WEEKDAYS[dt.getDay()]}요일`, cat: categoryOf(user.day.stem, p.stem) });
  }
  const signalDay = best.find((b) => b.cat === '식상') ?? best.find((b) => b.cat === '재성') ?? best[0];
  const careDay = best.find((b) => b.cat === '관성');
  const helpDay = best.find((b) => b.cat === '인성');
  const parts = [
    `이번 주 인연의 문이 가장 크게 열리는 날은 ${signalDay.day} — 먼저 신호를 보내기에 길합니다.`,
    helpDay ? `${helpDay.day}에는 먼저 다가오는 인연에 귀인의 기운이 실려 있으니 흘려보내지 마세요.` : '',
    careDay ? `${careDay.day}은 기운이 당신을 시험하는 날이라 약속을 잡기보다 다듬는 데 쓰는 편이 좋습니다.` : '',
    '전체적으로 주 중반으로 갈수록 기운이 차오르는 흐름입니다.',
  ];
  return parts.filter(Boolean).join(' ');
}
