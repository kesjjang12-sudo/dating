// 원격 데이터 레이어 — Supabase에서 프로필·피드를 가져온다.
// 실패하면 null을 돌려주고 앱은 로컬 시드로 계속 동작한다 (store를 import하지 않는다 — 순환 방지).

import { supabase } from '../supabase';
import { FeedPost, SeedProfile } from './profiles';

const TIMEOUT_MS = 5000;

function withTimeout<T>(p: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(p),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT_MS)),
  ]);
}

interface ProfileRow {
  handle: string;
  nickname: string;
  gender: 'M' | 'F';
  birth_date: string;
  hour_branch: number | null;
  job: string | null;
  intro: string | null;
  tags: string[] | null;
  demo_meta: Record<string, unknown> | null;
}

function rowToProfile(r: ProfileRow): SeedProfile {
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
    colors: m.colors ?? ['#8A97AC', '#5A6B84'],
    intro: r.intro ?? '',
    firstMsg: m.first_msg ?? '반가워요! 궁합이 좋게 나와서 연결됐네요.',
    replies: m.replies ?? [],
    acceptsInstantly: m.accepts_instantly ?? false,
    viewedMe: m.viewed_me,
    sentSignal: m.sent_signal,
  };
}

export async function fetchRemoteProfiles(): Promise<SeedProfile[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await withTimeout(
      supabase.from('profiles')
        .select('handle,nickname,gender,birth_date,hour_branch,job,intro,tags,demo_meta')
        .limit(100)
    );
    if (error || !data || data.length === 0) return null;
    return (data as ProfileRow[]).map(rowToProfile);
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
