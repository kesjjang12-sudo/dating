import { Hahmlet_600SemiBold, Hahmlet_700Bold, useFonts } from '@expo-google-fonts/hahmlet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { Toast } from '../components/Toast';
import * as Location from 'expo-location';
import { fetchDeckPins, fetchRemotePosts, fetchRemoteProfiles } from '../lib/data/remote';
import { ensureServerSession, updateMyLocation } from '../lib/server';
import { useApp } from '../lib/store';
import { C } from '../lib/theme';

export default function RootLayout() {
  const [loaded, fontError] = useFonts({ Hahmlet_600SemiBold, Hahmlet_700Bold });

  useEffect(() => {
    // 모바일 브라우저: 주소창/키보드로 실제 표시 영역이 100vh보다 작아져 하단이 잘리는 문제 — 동적 뷰포트(dvh)로 고정
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const st = document.createElement('style');
      st.textContent = '@supports (height: 100dvh) { html, body, #root { height: 100dvh !important; } } html { color-scheme: only light; }';
      document.head.appendChild(st);
      // 안드로이드 크롬 자동 다크모드가 라이트 전용 팔레트를 반전시키지 않도록
      const meta = document.createElement('meta');
      meta.name = 'color-scheme'; meta.content = 'only light';
      document.head.appendChild(meta);
    }
    (async () => {
      const [profiles, posts] = await Promise.all([fetchRemoteProfiles(), fetchRemotePosts(), fetchDeckPins()]);
      if (profiles || posts) useApp.getState().applyRemote(profiles, posts);
      // 서버 세션 (익명 로그인 활성화 시) — 서버 지갑이 엽전의 진실이 된다
      const { user, onboarded, setServerMode } = useApp.getState();
      if (onboarded && user) { setServerMode(await ensureServerSession(user)); useApp.getState().hydrateMyProfile(); void useApp.getState().loadBlocks(); }
      // 위치 — 허용 시 실거리 계산 + 서버 프로필에 반영
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          useApp.getState().setMyCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          void updateMyLocation(pos.coords.latitude, pos.coords.longitude);
        }
      } catch { /* 거부/미지원 시 기본 거리 표기 유지 */ }
    })();
  }, []);

  if (!loaded && !fontError) return null; // 폰트 실패 시 시스템 폰트로 진행
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
      <Toast />
    </View>
  );
}
