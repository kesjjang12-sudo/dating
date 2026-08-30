// 공용 소형 컴포넌트 — 버튼, 칩, 섹션 라벨, 엽전 배지

import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { C, R } from '../lib/theme';

export function Btn({
  label, onPress, kind = 'primary', cost, small, disabled, style,
}: {
  label: string;
  onPress?: () => void;
  kind?: 'primary' | 'ghost';
  cost?: number | string;
  small?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        kind === 'primary' ? s.primary : s.ghost,
        small && s.small,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text style={[s.btnTxt, kind === 'primary' ? { color: C.onAccent } : { color: C.ink }, small && { fontSize: 13.5 }]}>
        {label}
      </Text>
      {cost !== undefined && (
        <View style={[s.cost, kind === 'primary' ? s.costOnAccent : s.costGhost]}>
          <Text style={[s.costTxt, kind === 'primary' ? { color: C.onAccent } : { color: C.coin }]}>
            {typeof cost === 'number' ? `엽전 ${cost}` : cost}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function Chip({ label, tone = 'mut', style }: { label: string; tone?: 'acc' | 'good' | 'mut'; style?: ViewStyle }) {
  const bg = tone === 'acc' ? C.accentSoft : tone === 'good' ? C.goodSoft : '#F1ECDF';
  const fg = tone === 'acc' ? C.accentDeep : tone === 'good' ? C.good : C.muted;
  return (
    <View style={[s.chip, { backgroundColor: bg }, style]}>
      <Text style={[s.chipTxt, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Sect({ label, style }: { label: string; style?: TextStyle }) {
  return <Text style={[s.sect, style]}>{label}</Text>;
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: R.md, paddingVertical: 14, paddingHorizontal: 18,
  },
  primary: { backgroundColor: C.accent },
  ghost: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line2 },
  small: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: R.sm },
  btnTxt: { fontWeight: '700', fontSize: 15 },
  cost: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1 },
  costOnAccent: { backgroundColor: 'rgba(255,255,255,0.22)' },
  costGhost: { backgroundColor: C.coinSoft },
  costTxt: { fontSize: 12, fontWeight: '600' },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2.5, alignSelf: 'flex-start' },
  chipTxt: { fontSize: 11.5, fontWeight: '700' },
  sect: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: C.muted,
    marginTop: 22, marginBottom: 10, marginHorizontal: 2,
  },
});
