// Supabase 클라이언트 — 환경변수가 없으면 null (앱은 로컬 시드로 폴백)
// mobile/.env 에 설정:
//   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
//   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null;
