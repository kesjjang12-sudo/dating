// 원격 데이터 레이어 — Supabase에서 프로필·피드를 가져온다.
// 실패하면 null을 돌려주고 앱은 로컬 시드로 계속 동작한다 (store를 import하지 않는다 — 순환 방지).

import { getSupabase } from '../supabase';
import { FeedPost, SeedProfile } from './profiles';
import { DeckPin, setPins, setServerIds } from './registry';

const TIMEOUT_MS = 5000;

function withTimeout<T>(p: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS)),
  ]);
}

export interface ProfileRow {
  id: string;
  handle: string;
  nickname: string;
  gender: 'M' | 'F';
  birth_date: string;
  hour_branch: number | null;
  job: string | null;
  intro: string | null;
  tags: string[] | null;
  photos: string[] | null;
  lat: number | null;
  lng: number | null;
  demo_meta: Record<string, unknown> | null;
}

// 실유저(사진 없을 때) 아바타 색 — handle 해시로 결정
const REAL_PALETTES: [string, string][] = [
  ['#4E6E8E', '#8FB0C9'], ['#7E5A44', '#C9A227'], ['#5E7250', '#9DB08A'],
  ['#6E4A7E', '#B93359'], ['#4E8E7F', '#8FC9B9'], ['#33506C', '#6E8CA8'],
];
const hashColors = (s: string): [string, string] => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return REAL_PALETTES[h % REAL_PALETTES.length];
};

export function rowToProfile(r: ProfileRow): SeedProfile {
  const m = (r.demo_meta ?? {}) as {
    colors?: [string, string]; dist_km?: number; first_msg?: string; replies?: string[];
    accepts_instantly?: boolean; viewed_me?: boolean; sent_signal?: boolean;
  };
  return {
    id: r.handle,
    name: r.nickname,
    gender: r.gender,
    birth: r.birth_date,
    hourBranch: r.hour_branch,
    job: r.job ?? '회사원',
    distKm: m.dist_km ?? 10,
    tags: r.tags ?? [],
    colors: m.colors ?? hashColors(r.handle),
    photoUrl: r.photos?.[0],
    lat: r.lat,
    lng: r.lng,
    intro: r.intro ?? '',
    firstMsg: m.first_msg ?? '반가워요! 궁합이 좋게 나와서 연결됐네요.',
    replies: m.replies ?? [],
    acceptsInstantly: m.accepts_instantly ?? false,
    viewedMe: m.viewed_me,
    sentSignal: m.sent_signal,
  };
}

export const PROFILE_COLUMNS = 'id,handle,nickname,gender,birth_date,hour_branch,job,intro,tags,photos,lat,lng,demo_meta';

export async function fetchRemoteProfiles(): Promise<SeedProfile[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.from('profiles')
        .select(PROFILE_COLUMNS) // 실유저 포함 — 본인 프로필은 덱 생성 시 제외
        .limit(200)
    );
    if (error || !data || data.length === 0) return null;
    const rows = data as ProfileRow[];
    setServerIds(Object.fromEntries(rows.map((r) => [r.handle, r.id])));
    return rows.map(rowToProfile);
  } catch {
    return null;
  }
}

function timeLabel(iso: string): string {
  const diffMin = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return '지금 막';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return `${Math.floor(diffMin / 1440)}일 전`;
}

interface PostRow {
  id: number; category: string; title: string; body: string;
  likes: number; views: number; created_at: string;
}

export async function fetchRemotePosts(): Promise<FeedPost[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.from('posts')
        .select('id,category,title,body,likes,views,created_at')
        .order('created_at', { ascending: false })
        .limit(30)
    );
    if (error || !data || data.length === 0) return null;
    return (data as PostRow[]).map((r) => ({
      id: `srv-${r.id}`,
      cat: r.category,
      title: r.title,
      body: r.body,
      likes: r.likes,
      comments: 0,
      views: r.views,
      timeLabel: timeLabel(r.created_at),
    }));
  } catch {
    return null;
  }
}

/** 데모 글쓰기(비인증) — posts_insert_demo 정책 필요. 실패해도 앱은 로컬로 유지 */
export async function submitRemotePost(cat: string, title: string, body: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await withTimeout(
      supabase.from('posts').insert({ category: cat, title, body, anonymous: true })
    );
    return !error;
  } catch {
    return false;
  }
}

/** 고정 추천 목록 (deck_pins) — 레지스트리에 바로 반영 */
export async function fetchDeckPins(): Promise<DeckPin[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await withTimeout(supabase.from('deck_pins').select('viewer_nickname,pinned_nickname'));
    if (error || !data) return null;
    const pins = (data as { viewer_nickname: string; pinned_nickname: string }[]).map((r) => ({ viewer: r.viewer_nickname, pinned: r.pinned_nickname }));
    setPins(pins);
    return pins;
  } catch {
    return null;
  }
}
