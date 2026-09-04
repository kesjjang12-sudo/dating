// 프로필 레지스트리 — 기본은 로컬 시드, 서버 데이터가 도착하면 교체된다.
// 시드와 서버 데이터는 handle(p1…)이 동일해 영속 상태(매칭·신호)의 참조가 그대로 유지된다.

import { SEED_PROFILES, SeedProfile } from './profiles';

let current: SeedProfile[] = SEED_PROFILES;
let serverIds: Record<string, string> = {}; // handle → 서버 프로필 uuid

export const getProfiles = (): SeedProfile[] => current;

export function setProfiles(next: SeedProfile[]): void {
  if (next.length > 0) current = next;
}

export const getServerId = (handle: string): string | undefined => serverIds[handle];
export function setServerIds(map: Record<string, string>): void {
  serverIds = map;
}

/** 개별 프로필 추가/갱신 — 앱 로드 후 가입한 실유저(수신 신호의 발신자 등) 편입용 */
export function upsertProfile(p: SeedProfile, serverId: string): void {
  const i = current.findIndex((x) => x.id === p.id);
  if (i >= 0) current = [...current.slice(0, i), p, ...current.slice(i + 1)];
  else current = [...current, p];
  serverIds = { ...serverIds, [p.id]: serverId };
}

// 테스트용 고정 추천(핀): viewer 닉네임의 덱 맨 앞에 pinned 닉네임을 무조건 노출
export interface DeckPin { viewer: string; pinned: string; }
let pilotPinAllReal = false;
export const getPilotPinAllReal = (): boolean => pilotPinAllReal;
export function setPilotPinAllReal(v: boolean): void { pilotPinAllReal = v; }
let pins: DeckPin[] = [];
export const getPins = (): DeckPin[] => pins;
export function setPins(next: DeckPin[]): void { pins = next; }
