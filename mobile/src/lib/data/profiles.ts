// 시드 프로필 — 생년월일·시진은 실제 만세력으로 계산되어 궁합 정렬에 쓰인다.

export interface SeedProfile {
  id: string;
  name: string;
  gender: 'F' | 'M';
  birth: string;             // YYYY-MM-DD
  hourBranch: number | null; // 0=자시 … 11=해시, null=미상
  job: string;
  distKm: number;
  tags: string[];
  colors: [string, string];  // 아바타 그라디언트 (사진 없을 때)
  photoUrl?: string;         // 프로필 사진 (Storage 공개 URL) — 매칭 후 상호 동의 전엔 블러. 반려(rejected)면 비움
  photoStatus?: string;      // none | pending | auto_ok | approved | rejected
  photoRejectReason?: string | null;
  lat?: number | null;
  lng?: number | null;
  intro: string;
  firstMsg: string;          // 매칭 시 첫 메시지
  replies: string[];         // 채팅 자동 응답
  acceptsInstantly: boolean; // 신호 수락 여부(데모)
  viewedMe?: boolean;        // 관심함 '조회' 시드
  sentSignal?: boolean;      // 나에게 신호를 보낸 프로필
  // 계정 프로필 (실유저가 직접 입력)
  bio?: string;
  heightCm?: number | null;
  region?: string;
  goal?: string;
  drink?: string;
  smoke?: string;
  mbti?: string;
  answers?: { q: string; a: string }[];
}

export const SEED_PROFILES: SeedProfile[] = [
  {
    id: 'p1', name: '소연', gender: 'F', birth: '1999-03-08', hourBranch: 6,
    job: '플로리스트', distKm: 8.2, tags: ['결혼 의향도 있어요', '반려식물', '주말 등산'],
    colors: ['#4E6E8E', '#8FB0C9'],
    intro: '꽃처럼 계절마다 다른 사람이고 싶어요.',
    firstMsg: '신호 잘 받았어요 :) 궁합 풀이 보고 한참 웃었네요, 저희 초반에 티키타카 격하다던데요?',
    replies: ['저는 주말마다 화성 근처 산 다녀요! 등산 좋아하세요?', 'ㅋㅋㅋ 그건 좀 의외네요. 만나서 더 듣고 싶은걸요?'],
    acceptsInstantly: true,
  },
  {
    id: 'p2', name: '다인', gender: 'F', birth: '1997-06-15', hourBranch: null,
    job: '마케터', distKm: 14.6, tags: ['일단 연애부터', '맛집 투어', '전시 관람'],
    colors: ['#7E5A44', '#C9A227'],
    intro: '주말엔 전시, 평일엔 맛집. 같이 다닐 사람 찾아요.',
    firstMsg: '안녕하세요! 프로필 문답 보고 웃음 많으신 분 같아서 좋았어요.',
    replies: ['혹시 요즘 가본 전시 중에 최고 뭐였어요?'],
    acceptsInstantly: false, viewedMe: true,
  },
  {
    id: 'p3', name: '하람', gender: 'F', birth: '2000-11-02', hourBranch: 3,
    job: '초등교사', distKm: 21.3, tags: ['진지한 연애', '고양이 집사', '홈카페'],
    colors: ['#5E7250', '#9DB08A'],
    intro: '아이들과 고양이, 그리고 커피가 제 하루예요.',
    firstMsg: '먼저 신호 주셔서 감사해요. 궁합에 "다듬는 합"이라고 나온 거 인상적이었어요.',
    replies: ['고양이 알레르기는 없으시죠? 그게 제일 중요해요 ㅎㅎ'],
    acceptsInstantly: true,
  },
  {
    id: 'p4', name: '서윤', gender: 'F', birth: '1999-08-27', hourBranch: 9,
    job: '간호사', distKm: 12.4, tags: ['결혼 의향도 있어요', '러닝', '캠핑'],
    colors: ['#6E4A7E', '#B93359'],
    intro: '3교대라 부지런한 사람이 좋아요.',
    firstMsg: '연결됐네요! 저 이런 거 먼저 못 보내는 성격인데 궁합 보고 용기냈어요.',
    replies: ['이번 주말에 시간 어떠세요? 날씨 좋다던데.'],
    acceptsInstantly: true, sentSignal: true,
  },
  {
    id: 'p5', name: '하늘', gender: 'F', birth: '1995-04-19', hourBranch: 0,
    job: '회사원', distKm: 35.5, tags: ['결혼 의향도 있어요', '재테크', '홈트'],
    colors: ['#B93359', '#E08A5C'],
    intro: '계획적인 편이지만 사람 앞에선 잘 웃어요.',
    firstMsg: '프로필 조회하고 갔었는데 알아봐주셨네요 :)',
    replies: ['수원 쪽으로 오실 일 있으면 말씀주세요. 맛집은 제가 다 알아요.'],
    acceptsInstantly: true, viewedMe: true,
  },
  {
    id: 'p6', name: '유리', gender: 'F', birth: '1998-01-30', hourBranch: null,
    job: '디자이너', distKm: 27.9, tags: ['일단 친구부터', '드로잉', 'LP 수집'],
    colors: ['#8A97AC', '#5A6B84'],
    intro: '느리게 친해지는 편이에요. 대신 오래 가요.',
    firstMsg: '안녕하세요, 천천히 알아가요 우리.',
    replies: ['요즘 듣는 LP 하나 추천해드릴까요?'],
    acceptsInstantly: false, viewedMe: true,
  },
  {
    id: 'p7', name: '지우', gender: 'F', birth: '2001-07-07', hourBranch: 7,
    job: '대학원생', distKm: 18.1, tags: ['아직 모르겠어요', '보드게임', '베이킹'],
    colors: ['#4E8E7F', '#8FC9B9'],
    intro: '논문과 마들렌 사이 어딘가.',
    firstMsg: '신호 감사해요! 베이킹 하는데 시식단 해주실래요?',
    replies: ['다음 주에 스콘 굽는데 진짜 오실래요? ㅋㅋ'],
    acceptsInstantly: false,
  },
  {
    id: 'p8', name: '민서', gender: 'F', birth: '1996-10-11', hourBranch: 5,
    job: '약사', distKm: 9.7, tags: ['진지한 연애', '필라테스', '와인'],
    colors: ['#7E4A5E', '#C97B8F'],
    intro: '건강하게 오래 만날 사람을 찾아요.',
    firstMsg: '궁합 점수 보고 놀라서 수락했어요. 저희 잘 맞나봐요?',
    replies: ['와인 좋아하세요? 좋은 바를 알아뒀거든요.'],
    acceptsInstantly: true,
  },
  {
    id: 'p9', name: '태오', gender: 'M', birth: '1996-05-23', hourBranch: 8,
    job: '개발자', distKm: 6.3, tags: ['진지한 연애', '클라이밍', '커피'],
    colors: ['#33506C', '#6E8CA8'],
    intro: '코드보다 사람이 어렵지만, 그래서 재밌어요.',
    firstMsg: '반갑습니다. 궁합 풀이가 저희 꽤 좋게 나왔더라고요.',
    replies: ['클라이밍 한번 배워보실래요? 초보 환영입니다.'],
    acceptsInstantly: true,
  },
  {
    id: 'p10', name: '준혁', gender: 'M', birth: '1994-12-03', hourBranch: 2,
    job: '요리사', distKm: 11.8, tags: ['결혼 의향도 있어요', '시장 투어', '등산'],
    colors: ['#5E4A36', '#A98455'],
    intro: '맛있는 걸 해주는 게 제 애정 표현이에요.',
    firstMsg: '신호 잘 받았어요. 뭐 좋아하세요? 다음에 해드릴게요.',
    replies: ['새벽 시장 투어 같이 가실래요? 재밌어요 은근.'],
    acceptsInstantly: true,
  },
  {
    id: 'p11', name: '도윤', gender: 'M', birth: '1998-09-14', hourBranch: null,
    job: '물리치료사', distKm: 16.5, tags: ['일단 연애부터', '야구 직관', '수영'],
    colors: ['#4A6E5E', '#7FA893'],
    intro: '주말엔 야구장에 있어요. 응원팀 다르면 각오하세요.',
    firstMsg: '어느 팀 응원하세요? 이게 제일 중요합니다.',
    replies: ['직관 한번 같이 가시죠. 제가 치킨 삽니다.'],
    acceptsInstantly: false, viewedMe: true,
  },
  {
    id: 'p12', name: '시헌', gender: 'M', birth: '1995-02-28', hourBranch: 10,
    job: '금융권', distKm: 24.2, tags: ['결혼 의향도 있어요', '골프', '독서'],
    colors: ['#3E3A50', '#7A7290'],
    intro: '숫자는 정확하게, 마음은 넉넉하게.',
    firstMsg: '안녕하세요. 진지하게 만남을 생각하고 있습니다.',
    replies: ['주말에 책 읽기 좋은 카페를 알고 있는데, 같이 가실래요?'],
    acceptsInstantly: true,
  },
];

export interface FeedPost {
  id: string;
  cat: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
  views: number;
  timeLabel: string;
  mine?: boolean;
  liked?: boolean;
  anonymous?: boolean;     // false = 셀소(닉네임·프로필 공개). 미지정 = 익명
  authorHandle?: string;   // 셀소 작성자 프로필 id(handle)
  authorName?: string;
}

export const SEED_POSTS: FeedPost[] = [
  {
    id: 'f1', cat: '고민상담', title: '일간 갑목인데 경금 남자분이랑 잘 될까요?',
    body: '궁합 91 떠서 신호 받았는데 금극목이라 걱정돼요. 근데 풀이에서는 "다듬어주는 관계"라고 나오네요… 경험담 있으신 분?',
    likes: 12, comments: 8, views: 156, timeLabel: '4분 전',
  },
  {
    id: 'f2', cat: '사주풀이', title: '축시생인지 인시생인지 애매하신 분들',
    body: '병원 출생기록 떼는 법 정리해봤어요. 시주 넣으니까 정밀 궁합 배지 붙어서 신호 수락률이 확 달라짐…',
    likes: 45, comments: 23, views: 511, timeLabel: '32분 전',
  },
  {
    id: 'f3', cat: '자유', title: '오늘의 운세 적중률 뭐냐',
    body: '"서쪽에서 인연이 온다"길래 웃었는데 수원 사는 분이랑 매칭됨ㅋㅋ 나 화성 삶',
    likes: 31, comments: 14, views: 402, timeLabel: '1시간 전',
  },
  {
    id: 'f4', cat: '셀소', title: '96년생 을묘일주 셀소합니다',
    body: '홈카페 8년차, 고양이 두 마리. 임수·계수 일간분들 특히 환영해요. 궁합 보고 놀라지 마세요.',
    likes: 27, comments: 19, views: 388, timeLabel: '2시간 전',
  },
];
