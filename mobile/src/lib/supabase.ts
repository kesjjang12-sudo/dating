// Supabase 클라이언트 — 환경변수가 없으면 null (앱은 로컬 시드로 폴백).
// 정적 렌더링(SSR, window 없음) 중에는 생성하지 않는다 — 세션 복원이 window를 요구함.
// mobile/.env 에 설정:
//   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
//   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  if (!url || !key || typeof window === 'undefined') {
    client = null;
    return client;
  }
  client = createClient(url, key, {
    auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
