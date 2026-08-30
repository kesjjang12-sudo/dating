// 전역 토스트 — store.toast를 구독해 2.2초 표시

import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useApp } from '../lib/store';
import { C } from '../lib/theme';

export function Toast() {
  const toast = useApp((st) => st.toast);
  const [msg, setMsg] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    setMsg(toast.msg);
    Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMsg(null));
    }, 2200);
    return () => clearTimeout(t);
  }, [toast, fade]);

  if (!msg) return null;
  return (
    <Animated.View pointerEvents="none" style={[s.toast, { opacity: fade }]}>
      <Text style={s.txt}>{msg}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 100, alignSelf: 'center', backgroundColor: C.ink,
    borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10, maxWidth: '92%', zIndex: 99,
  },
  txt: { color: C.bg, fontSize: 13.5, fontWeight: '600' },
});
