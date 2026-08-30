// 앱 전역 상태 — zustand + AsyncStorage 영속화.
// 데이터 레이어는 로컬(시드) 기준이며, supabase/ 스키마로 백엔드 이관을 전제로 설계됐다.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FeedPost, SEED_POSTS, SEED_PROFILES, SeedProfile } from './data/profiles';
import { EARN, START_COINS } from './economy';
import { compatibility, CompatResult } from './saju/compat';
import { daysFromEpoch, fromDateString, FourPillars } from './saju/manseryeok';

export interface UserInfo {
  name: string;
  gender: 'M' | 'F';
  birth: string;             // YYYY-MM-DD (PASS 인증값 — 수정 불가)
  hourBranch: number | null; // 시진, null=미상
  hourEdits: number;         // 출생시간 수정 횟수 (최대 2)
}

export interface ChatMsg { from: 'me' | 'them'; text: string; ts: number; }

interface AppState {
  onboarded: boolean;
  user: UserInfo | null;
  coins: number;

  deckDate: string;
  deckIds: string[];
  deckPos: number;

  unlockedDetails: Record<string, boolean>;
  passed: Record<string, boolean>;
  sentSignals: Record<string, 'pending' | 'accepted'>;
  incomingHandled: Record<string, 'connected' | 'dismissed'>;
  blurUnlocked: boolean;
  matches: string[];
  chats: Record<string, ChatMsg[]>;
  replyIdx: Record<string, number>;

  fortuneDate: string | null;
  streak: number;
  weeklyKey: string | null;

  posts: FeedPost[];
  toast: { msg: string; ts: number } | null;

  completeOnboarding: (u: Omit<UserInfo, 'hourEdits'>) => void;
  ensureDeck: () => void;
  passCurrent: () => void;
  advanceDeck: () => void;
  refreshDeckPaid: () => void;
  spend: (cost: number) => boolean;
  earn: (n: number) => void;
  unlockDetail: (id: string) => void;
  sendSignal: (id: string) => 'accepted' | 'pending';
  connectIncoming: (id: string) => void;
  dismissIncoming: (id: string) => void;
  setBlurUnlocked: () => void;
  claimFortune: () => { earned: number; streakBonus: boolean } | null;
  unlockWeekly: () => void;
  sendMessage: (id: string, text: string) => void;
  receiveReply: (id: string) => void;
  addPost: (cat: string, title: string, body: string) => void;
  toggleLike: (id: string) => void;
  editHour: (hourBranch: number | null) => boolean;
  buyPack: (coins: number) => void;
  showToast: (msg: string) => void;
  resetAll: () => void;
}

export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const weekKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-W${Math.floor(daysFromEpoch(d.getFullYear(), d.getMonth() + 1, d.getDate()) / 7)}`;
};

export const profileById = (id: string): SeedProfile => SEED_PROFILES.find((p) => p.id === id)!;

/** 사용자 사주 (없으면 null) */
export function myPillars(user: UserInfo | null): FourPillars | null {
  if (!user) return null;
  return fromDateString(user.birth, user.hourBranch);
}

const compatCache = new Map<string, CompatResult>();
/** 나 ↔ 프로필 궁합 (캐시) */
export function compatWith(user: UserInfo, profileId: string): CompatResult {
  const key = `${user.birth}|${user.hourBranch}|${profileId}`;
  const hit = compatCache.get(key);
  if (hit) return hit;
  const p = profileById(profileId);
  const res = compatibility(fromDateString(user.birth, user.hourBranch), fromDateString(p.birth, p.hourBranch));
  compatCache.set(key, res);
  return res;
}

/** 궁합 정렬 후 날짜 기반 회전으로 3명 선택 — "궁합은 정렬이지 필터가 아니다" */
function buildDeck(user: UserInfo, exclude: Set<string>): string[] {
  const candidates = SEED_PROFILES
    .filter((p) => p.gender !== user.gender && !exclude.has(p.id) && !p.sentSignal)
    .sort((a, b) => compatWith(user, b.id).total - compatWith(user, a.id).total);
  if (candidates.length === 0) return [];
  const d = new Date();
  const rot = daysFromEpoch(d.getFullYear(), d.getMonth() + 1, d.getDate()) % candidates.length;
  const rotated = [...candidates.slice(rot), ...candidates.slice(0, rot)]
    .sort((a, b) => compatWith(user, b.id).total - compatWith(user, a.id).total);
  return rotated.slice(0, 3).map((p) => p.id);
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      user: null,
      coins: START_COINS,
      deckDate: '',
      deckIds: [],
      deckPos: 0,
      unlockedDetails: {},
      passed: {},
      sentSignals: {},
      incomingHandled: {},
      blurUnlocked: false,
      matches: [],
      chats: {},
      replyIdx: {},
      fortuneDate: null,
      streak: 0,
      weeklyKey: null,
      posts: SEED_POSTS,
      toast: null,

      completeOnboarding: (u) => {
        const user: UserInfo = { ...u, hourEdits: 0 };
        set({ user, onboarded: true, deckDate: todayStr(), deckIds: buildDeck(user, new Set()), deckPos: 0 });
      },

      ensureDeck: () => {
        const { user, deckDate, matches } = get();
        if (!user || deckDate === todayStr()) return;
        const exclude = new Set([...matches, ...Object.keys(get().passed)]);
        set({ deckDate: todayStr(), deckIds: buildDeck(user, exclude), deckPos: 0 });
      },

      passCurrent: () => {
        const { deckIds, deckPos } = get();
        const id = deckIds[deckPos];
        if (id) set({ passed: { ...get().passed, [id]: true }, deckPos: deckPos + 1 });
      },

      advanceDeck: () => set({ deckPos: get().deckPos + 1 }),

      refreshDeckPaid: () => {
        const { user, matches, passed, deckIds } = get();
        if (!user) return;
        const exclude = new Set([...matches, ...Object.keys(passed), ...deckIds]);
        let next = buildDeck(user, exclude);
        if (next.length === 0) next = buildDeck(user, new Set(matches));
        set({ deckIds: next, deckPos: 0 });
      },

      spend: (cost) => {
        if (get().coins < cost) return false;
        set({ coins: get().coins - cost });
        return true;
      },
      earn: (n) => set({ coins: get().coins + n }),

      unlockDetail: (id) => set({ unlockedDetails: { ...get().unlockedDetails, [id]: true } }),

      sendSignal: (id) => {
        const p = profileById(id);
        const accepted = p.acceptsInstantly;
        const next: AppState['sentSignals'] = { ...get().sentSignals, [id]: accepted ? 'accepted' : 'pending' };
        if (accepted) {
          set({
            sentSignals: next,
            matches: [...get().matches, id],
            chats: { ...get().chats, [id]: [{ from: 'them', text: p.firstMsg, ts: Date.now() }] },
            deckPos: get().deckPos + 1,
          });
          return 'accepted';
        }
        set({ sentSignals: next, deckPos: get().deckPos + 1 });
        return 'pending';
      },

      connectIncoming: (id) => {
        const p = profileById(id);
        set({
          incomingHandled: { ...get().incomingHandled, [id]: 'connected' },
          matches: [...get().matches, id],
          chats: { ...get().chats, [id]: [{ from: 'them', text: p.firstMsg, ts: Date.now() }] },
        });
      },

      dismissIncoming: (id) => set({ incomingHandled: { ...get().incomingHandled, [id]: 'dismissed' } }),

      setBlurUnlocked: () => set({ blurUnlocked: true }),

      claimFortune: () => {
        const { fortuneDate, streak } = get();
        const today = todayStr();
        if (fortuneDate === today) return null;
        const y = new Date(Date.now() - 86400000);
        const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
        const nextStreak = fortuneDate === yesterday ? streak + 1 : 1;
        const streakBonus = nextStreak > 0 && nextStreak % 7 === 0;
        const earned = EARN.dailyFortune + (streakBonus ? EARN.streak7 : 0);
        set({ fortuneDate: today, streak: nextStreak, coins: get().coins + earned });
        return { earned, streakBonus };
      },

      unlockWeekly: () => set({ weeklyKey: weekKey() }),

      sendMessage: (id, text) => {
        const msgs = get().chats[id] ?? [];
        set({ chats: { ...get().chats, [id]: [...msgs, { from: 'me', text, ts: Date.now() }] } });
      },

      receiveReply: (id) => {
        const p = profileById(id);
        const i = get().replyIdx[id] ?? 0;
        if (i >= p.replies.length) return;
        const msgs = get().chats[id] ?? [];
        set({
          chats: { ...get().chats, [id]: [...msgs, { from: 'them', text: p.replies[i], ts: Date.now() }] },
          replyIdx: { ...get().replyIdx, [id]: i + 1 },
        });
      },

      addPost: (cat, title, body) => {
        const post: FeedPost = {
          id: `mine-${Date.now()}`, cat, title, body,
          likes: 0, comments: 0, views: 1, timeLabel: '지금 막', mine: true,
        };
        set({ posts: [post, ...get().posts] });
      },

      toggleLike: (id) =>
        set({
          posts: get().posts.map((p) =>
            p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
          ),
        }),

      editHour: (hourBranch) => {
        const { user } = get();
        if (!user || user.hourEdits >= 2) return false;
        compatCache.clear();
        set({ user: { ...user, hourBranch, hourEdits: user.hourEdits + 1 } });
        return true;
      },

      buyPack: (coins) => set({ coins: get().coins + coins }),

      showToast: (msg) => set({ toast: { msg, ts: Date.now() } }),

      resetAll: () => {
        compatCache.clear();
        set({
          onboarded: false, user: null, coins: START_COINS,
          deckDate: '', deckIds: [], deckPos: 0,
          unlockedDetails: {}, passed: {}, sentSignals: {}, incomingHandled: {},
          blurUnlocked: false, matches: [], chats: {}, replyIdx: {},
          fortuneDate: null, streak: 0, weeklyKey: null, posts: SEED_POSTS, toast: null,
        });
      },
    }),
    {
      name: 'yeonbun-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ toast, ...rest }) => rest,
    }
  )
);

export const isWeeklyUnlocked = (key: string | null): boolean => key === weekKey();
