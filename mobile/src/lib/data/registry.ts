// 프로필 레지스트리 — 기본은 로컬 시드, 서버 데이터가 도착하면 교체된다.
// 시드와 서버 데이터는 handle(p1…)이 동일해 영속 상태(매칭·신호)의 참조가 그대로 유지된다.

import { SEED_PROFILES, SeedProfile } from './profiles';

let current: SeedProfile[] = SEED_PROFILES;

export const getProfiles = (): SeedProfile[] => current;

export function setProfiles(next: SeedProfile[]): void {
  if (next.length > 0) current = next;
}
