// 프로필 필드 정의 — 편집 화면·표시·완성도 계산이 공유한다.

export const GOALS = ['진지한 연애', '결혼을 생각하며', '천천히 알아가기', '좋은 친구부터'] as const;
export const DRINKS = ['안 마셔요', '가끔 한 잔', '즐기는 편'] as const;
export const SMOKES = ['비흡연', '가끔', '흡연'] as const;
export const MBTIS = ['ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP', 'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'] as const;
export const INTEREST_TAGS = [
  '맛집 투어', '카페', '요리', '와인', '커피', '영화', '전시 관람', '독서', '음악', '공연',
  '등산', '러닝', '헬스', '요가', '자전거', '여행', '캠핑', '사진', '반려동물', '반려식물',
  '게임', '드라마', '재테크', '자기계발', '봉사', '사주·타로',
] as const;
export const MAX_TAGS = 5;

/** 연분 문답 — 세 가지 질문에 짧게 답한다 */
export const PROMPTS = [
  '주말의 나는 보통',
  '이런 사람에게 마음이 열려요',
  '나를 웃게 하는 것',
] as const;

export interface Answer { q: string; a: string; }

export interface ProfileFields {
  job?: string;
  intro?: string;
  bio?: string;
  heightCm?: number | null;
  region?: string;
  goal?: string;
  drink?: string;
  smoke?: string;
  mbti?: string;
  tags?: string[];
  answers?: Answer[];
}

/** 완성도 0~100 — 상대에게 보이는 항목 가중 */
export function completeness(p: ProfileFields & { photoUrl?: string | null }): number {
  let s = 0;
  if (p.photoUrl) s += 20;
  if (p.job?.trim()) s += 12;
  if (p.intro?.trim()) s += 12;
  if ((p.bio?.trim().length ?? 0) >= 30) s += 16;
  if (p.region?.trim()) s += 8;
  if (p.goal) s += 8;
  if ((p.tags?.length ?? 0) >= 3) s += 12;
  if ((p.answers?.filter((a) => a.a.trim()).length ?? 0) >= 2) s += 12;
  return Math.min(100, s);
}
