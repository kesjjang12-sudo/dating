// 서버 세션 레이어 — 익명 로그인 → 내 프로필/지갑 생성, 엽전 RPC, 신호·메시지 미러링.
// 모든 함수는 실패 시 조용히 물러나고 앱은 로컬 모드로 계속 동작한다.
// (Supabase 대시보드에서 Authentication → Anonymous sign-ins 활성화 필요)

import { SeedProfile } from './data/profiles';
import { getServerId, upsertProfile } from './data/registry';
import { PROFILE_COLUMNS, ProfileRow, rowToProfile } from './data/remote';
import { ganzhiIndex } from './saju/ganzhi';
import { fromDateString } from './saju/manseryeok';
import { getSupabase } from './supabase';

export interface ServerMsg { from: 'me' | 'them'; text: string; ts: number; }

export interface ServerUser {
  name: string;
  gender: 'M' | 'F';
  birth: string;
  hourBranch: number | null;
}

let myProfileId: string | null = null;
let myAuthId: string | null = null;
const matchIds: Record<string, number> = {}; // 상대 handle → match id

export const getMyHandle = (): string | null => (myAuthId ? `u_${myAuthId.slice(0, 8)}` : null);
export const isServerReady = (): boolean => myProfileId !== null;

/** 익명 세션 + 내 프로필/지갑 확보. 성공 시 서버 엽전 잔액 반환, 실패 시 null */
export async function ensureServerSession(user: ServerUser): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    let session = (await sb.auth.getSession()).data.session;
    if (!session) {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error || !data.session) return null; // 익명 로그인 비활성 상태 등
      session = data.session;
    }
    const authId = session.user.id;
    myAuthId = authId;

    let { data: prof } = await sb.from('profiles').select('id').eq('auth_id', authId).maybeSingle();
    if (!prof) {
      const p = fromDateString(user.birth, user.hourBranch);
      const { data: ins, error } = await sb.from('profiles').insert({
        auth_id: authId,
        handle: `u_${authId.slice(0, 8)}`,
        nickname: user.name,
        gender: user.gender,
        birth_date: user.birth,
        hour_branch: user.hourBranch,
        pillar_year: ganzhiIndex(p.year),
        pillar_month: ganzhiIndex(p.month),
        pillar_day: ganzhiIndex(p.day),
        pillar_hour: p.hour ? ganzhiIndex(p.hour) : null,
      }).select('id').single();
      if (error || !ins) return null;
      prof = ins;
    }
    myProfileId = prof.id;
    return await serverBalance();
  } catch {
    return null;
  }
}

export async function serverBalance(): Promise<number | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  try {
    const { data } = await sb.from('wallets').select('balance').eq('user_id', myProfileId).maybeSingle();
    return data?.balance ?? null;
  } catch {
    return null;
  }
}

/** 엽전 차감 (서버 원장). 성공: 새 잔액 / 잔액 부족: 'insufficient' / 네트워크 등: null */
export async function serverSpend(amount: number, reason: string, ref?: string): Promise<number | 'insufficient' | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  try {
    const { data, error } = await sb.rpc('rpc_spend', { amount, reason, ref: ref ?? null });
    if (error) return error.message.includes('insufficient') ? 'insufficient' : null;
    return data as number;
  } catch {
    return null;
  }
}

/** 오늘의 운세 적립. 성공: 새 잔액 / 이미 받음: 'claimed' / 실패: null */
export async function serverClaimFortune(): Promise<number | 'claimed' | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  try {
    const { data, error } = await sb.rpc('rpc_claim_fortune');
    if (error) return error.message.includes('already_claimed') ? 'claimed' : null;
    return data as number;
  } catch {
    return null;
  }
}

/** 엽전 충전 (데모 RPC). 성공: 새 잔액 */
export async function serverTopup(amount: number): Promise<number | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  try {
    const { data, error } = await sb.rpc('rpc_topup_demo', { amount });
    return error ? null : (data as number);
  } catch {
    return null;
  }
}

/** 신호 서버 기록 — 봇 상대면 DB 트리거가 수락·매칭·첫 메시지까지 처리 */
export async function serverSendSignal(receiverHandle: string, score: number): Promise<void> {
  const sb = getSupabase();
  const receiver = getServerId(receiverHandle);
  if (!sb || !myProfileId || !receiver) return;
  try {
    await sb.from('signals').insert({ sender: myProfileId, receiver, compat_score: score });
  } catch { /* 중복 신호 등은 무시 */ }
}

async function matchIdWith(handle: string): Promise<number | null> {
  if (matchIds[handle]) return matchIds[handle];
  const sb = getSupabase();
  const other = getServerId(handle);
  if (!sb || !myProfileId || !other) return null;
  const a = myProfileId < other ? myProfileId : other;
  const b = myProfileId < other ? other : myProfileId;
  try {
    const { data } = await sb.from('matches').select('id').eq('user_a', a).eq('user_b', b).maybeSingle();
    if (data) { matchIds[handle] = data.id; return data.id; }
  } catch { /* noop */ }
  return null;
}

/** 채팅 메시지 서버 기록 — 봇 답장은 DB 트리거가 생성 */
export async function serverSendMessage(receiverHandle: string, body: string): Promise<void> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return;
  const mid = await matchIdWith(receiverHandle);
  if (!mid) return;
  try {
    await sb.from('messages').insert({ match_id: mid, sender: myProfileId, body });
  } catch { /* noop */ }
}

export async function serverSignOut(): Promise<void> {
  const sb = getSupabase();
  myProfileId = null;
  myAuthId = null;
  for (const k of Object.keys(matchIds)) delete matchIds[k];
  try { await sb?.auth.signOut(); } catch { /* noop */ }
}

// ── 실시간 채팅 ────────────────────────────────────────

const rowToMsg = (r: { sender: string; body: string; created_at: string }): ServerMsg => ({
  from: r.sender === myProfileId ? 'me' : 'them',
  text: r.body,
  ts: new Date(r.created_at).getTime(),
});

/** 서버 매칭의 기존 메시지. 매칭이 서버에 없으면 null (→ 로컬 렌더링 유지) */
export async function fetchServerMessages(handle: string): Promise<ServerMsg[] | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  const mid = await matchIdWith(handle);
  if (!mid) return null;
  try {
    const { data, error } = await sb.from('messages')
      .select('sender,body,created_at').eq('match_id', mid).order('id');
    if (error || !data) return null;
    return data.map(rowToMsg);
  } catch {
    return null;
  }
}

/** 새 메시지 실시간 구독 — 채널 조인 완료까지 기다린 뒤 반환 (이후 fetch로 과거분을 채우면 유실 없음) */
export async function subscribeMessages(handle: string, onMsg: (m: ServerMsg) => void): Promise<(() => void) | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  const mid = await matchIdWith(handle);
  if (!mid) return null;
  const ch = sb.channel(`msgs-${mid}-${Date.now()}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${mid}` },
      (payload) => onMsg(rowToMsg(payload.new as { sender: string; body: string; created_at: string })));
  await new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 4000); // 조인 실패해도 앱은 계속 (폴백: fetch 시점 데이터)
    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') { clearTimeout(t); resolve(); }
    });
  });
  return () => { void sb.removeChannel(ch); };
}

// ── 실유저 수신 신호 ──────────────────────────────────

export interface IncomingSignal { signalId: number; profile: SeedProfile; score: number; }

export async function fetchIncomingSignals(): Promise<IncomingSignal[]> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return [];
  try {
    const { data, error } = await sb.from('signals')
      .select(`id, compat_score, sender:profiles!signals_sender_fkey(${PROFILE_COLUMNS})`)
      .eq('receiver', myProfileId).eq('status', 'pending');
    if (error || !data) return [];
    return data.map((r) => {
      const row = r.sender as unknown as ProfileRow;
      const profile = rowToProfile(row);
      upsertProfile(profile, row.id); // 앱 로드 후 가입한 유저도 채팅/궁합 가능하도록 편입
      return { signalId: r.id as number, profile, score: r.compat_score as number };
    });
  } catch {
    return [];
  }
}

/** 내 서버 매칭 전체 — 상대 프로필을 레지스트리에 편입하고 handle 목록 반환.
 *  신호를 보낸 쪽도 상대의 수락을 이걸로 알게 된다. */
export async function fetchMyMatches(): Promise<string[]> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return [];
  try {
    const { data } = await sb.from('matches')
      .select(`id, user_a, user_b, pa:profiles!matches_user_a_fkey(${PROFILE_COLUMNS}), pb:profiles!matches_user_b_fkey(${PROFILE_COLUMNS})`)
      .or(`user_a.eq.${myProfileId},user_b.eq.${myProfileId}`);
    if (!data) return [];
    const handles: string[] = [];
    for (const r of data) {
      const other = (r.user_a === myProfileId ? r.pb : r.pa) as unknown as ProfileRow | null;
      if (!other) continue;
      const prof = rowToProfile(other);
      upsertProfile(prof, other.id);
      matchIds[prof.id] = r.id as number;
      handles.push(prof.id);
    }
    return handles;
  } catch {
    return [];
  }
}

/** 수신 신호 수락 — DB 트리거가 매칭을 생성한다 */
export async function acceptSignal(signalId: number): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('signals').update({ status: 'accepted' }).eq('id', signalId);
    return !error;
  } catch {
    return false;
  }
}

// ── 블라인드 얼굴 공개 ────────────────────────────────

export interface RevealState {
  mine: boolean; theirs: boolean; revealed: boolean;
  mineMsgs: number; theirMsgs: number; required: number; eligible: boolean; // 대화 후 공개 — 양쪽 각 required 마디 이상
}

export async function revealState(handle: string): Promise<RevealState | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  const mid = await matchIdWith(handle);
  if (!mid) return null;
  try {
    const { data, error } = await sb.rpc('rpc_reveal_state', { p_match_id: mid });
    return error ? null : (data as RevealState);
  } catch {
    return null;
  }
}

/** 내 쪽 공개 동의 — 상대가 봇이면 즉시 상호 공개(데모) */
export async function revealFace(handle: string): Promise<RevealState | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  const mid = await matchIdWith(handle);
  if (!mid) return null;
  try {
    const { data, error } = await sb.rpc('rpc_reveal_face', { p_match_id: mid });
    return error ? null : (data as RevealState);
  } catch {
    return null;
  }
}

// ── 미션 실지급 ───────────────────────────────────────

/** 사진 등록 미션 +50. 성공: 새 잔액 / 이미 수령: 'claimed' / 사진 없음: 'no_photo' */
export async function claimMissionPhoto(): Promise<number | 'claimed' | 'no_photo' | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  try {
    const { data, error } = await sb.rpc('rpc_claim_mission_photo');
    if (error) {
      if (error.message.includes('already_claimed')) return 'claimed';
      if (error.message.includes('no_photo')) return 'no_photo';
      return null;
    }
    return data as number;
  } catch {
    return null;
  }
}

/** 초대 코드 적용 — 양쪽 +100. 성공: 새 잔액 / 이미 사용: 'claimed' / 잘못된 코드: 'bad_code' */
export async function applyReferral(code: string): Promise<number | 'claimed' | 'bad_code' | null> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return null;
  try {
    const { data, error } = await sb.rpc('rpc_apply_referral', { code: code.trim() });
    if (error) {
      if (error.message.includes('already_claimed')) return 'claimed';
      if (error.message.includes('bad_code')) return 'bad_code';
      return null;
    }
    return data as number;
  } catch {
    return null;
  }
}

// ── 위치 ──────────────────────────────────────────────

export async function updateMyLocation(lat: number, lng: number): Promise<void> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return;
  try {
    await sb.from('profiles').update({ lat, lng }).eq('id', myProfileId);
  } catch { /* noop */ }
}

// ── 프로필 사진 업로드 ────────────────────────────────

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const n1 = B64.indexOf(clean[i]);
    const n2 = B64.indexOf(clean[i + 1]);
    const n3 = i + 2 < clean.length ? B64.indexOf(clean[i + 2]) : -1;
    const n4 = i + 3 < clean.length ? B64.indexOf(clean[i + 3]) : -1;
    bytes.push(((n1 << 2) | (n2 >> 4)) & 255);
    if (n3 >= 0) bytes.push((((n2 & 15) << 4) | (n3 >> 2)) & 255);
    if (n4 >= 0) bytes.push((((n3 & 3) << 6) | n4) & 255);
  }
  return new Uint8Array(bytes);
}

/** 아바타 업로드 → 프로필에 반영 → 공개 URL 반환 */
export async function uploadAvatar(base64: string, contentType: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb || !myAuthId || !myProfileId) return null;
  try {
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    // 업로드마다 새 경로 — upsert의 RLS 충돌과 CDN 캐시 문제를 함께 회피
    const path = `${myAuthId}/avatar-${Date.now()}.${ext}`;
    const bytes = base64ToBytes(base64);
    const { error } = await sb.storage.from('avatars').upload(path, bytes, { contentType });
    if (error) return null;
    const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    await sb.from('profiles').update({ photos: [url] }).eq('id', myProfileId);
    return url;
  } catch {
    return null;
  }
}

// ── 내 프로필 저장 (직업·소개·키·지역·목표·음주·흡연·MBTI·관심사·문답) ──
export async function serverUpdateProfile(f: import('./profile').ProfileFields): Promise<boolean> {
  const sb = getSupabase();
  if (!sb || !myProfileId) return false;
  try {
    const { error } = await sb.from('profiles').update({
      job: f.job ?? null, intro: f.intro ?? null, bio: f.bio ?? null, height_cm: f.heightCm ?? null,
      region: f.region ?? null, goal: f.goal ?? null, drink: f.drink ?? null, smoke: f.smoke ?? null,
      mbti: f.mbti ?? null, tags: f.tags ?? [], answers: f.answers ?? [],
    }).eq('id', myProfileId);
    return !error;
  } catch { return false; }
}
