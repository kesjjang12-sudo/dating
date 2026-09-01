import { Hahmlet_600SemiBold, Hahmlet_700Bold, useFonts } from '@expo-google-fonts/hahmlet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Toast } from '../components/Toast';
import { fetchRemotePosts, fetchRemoteProfiles } from '../lib/data/remote';
import { ensureServerSession } from '../lib/server';
import { useApp } from '../lib/store';
import { C } from '../lib/theme';

export default function RootLayout() {
  const [loaded, fontError] = useFonts({ Hahmlet_600SemiBold, Hahmlet_700Bold });

  useEffect(() => {
    (async () => {
      const [profiles, posts] = await Promise.all([fetchRemoteProfiles(), fetchRemotePosts()]);
      if (profiles || posts) useApp.getState().applyRemote(profiles, posts);
      // 서버 세션 (익명 로그인 활성화 시) — 서버 지갑이 엽전의 진실이 된다
      const { user, onboarded, setServerMode } = useApp.getState();
      if (onboarded && user) setServerMode(await ensureServerSession(user));
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
