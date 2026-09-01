// 서버 세션 레이어 — 익명 로그인 → 내 프로필/지갑 생성, 엽전 RPC, 신호·메시지 미러링.
// 모든 함수는 실패 시 조용히 물러나고 앱은 로컬 모드로 계속 동작한다.
// (Supabase 대시보드에서 Authentication → Anonymous sign-ins 활성화 필요)

import { getServerId } from './data/registry';
import { ganzhiIndex } from './saju/ganzhi';
import { fromDateString } from './saju/manseryeok';
import { getSupabase } from './supabase';

export interface ServerUser {
  name: string;
  gender: 'M' | 'F';
  birth: string;
  hourBranch: number | null;
}

let myProfileId: string | null = null;
const matchIds: Record<string, number> = {}; // 상대 handle → match id

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
  for (const k of Object.keys(matchIds)) delete matchIds[k];
  try { await sb?.auth.signOut(); } catch { /* noop */ }
}
