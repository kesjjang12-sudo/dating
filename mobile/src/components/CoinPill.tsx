// 상단 엽전 잔액 — 누르면 스토어 시트

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useApp } from '../lib/store';
import { C } from '../lib/theme';

export function CoinPill({ onPress }: { onPress?: () => void }) {
  const coins = useApp((st) => st.coins);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.pill, pressed && { opacity: 0.8 }]}>
      <View style={s.coin}><View style={s.hole} /></View>
      <Text style={s.txt}>{coins.toLocaleString()}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.coinSoft,
    borderRadius: 999, paddingVertical: 4, paddingLeft: 8, paddingRight: 12,
    borderWidth: 1, borderColor: C.coinLine,
  },
  coin: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.coin, alignItems: 'center', justifyContent: 'center' },
  hole: { width: 6, height: 6, borderRadius: 1.5, backgroundColor: C.coinSoft },
  txt: { color: C.coin, fontWeight: '700', fontSize: 13.5, fontVariant: ['tabular-nums'] },
});
