// 궁합 5요소 바 차트

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../lib/theme';

export function ElemBars({ parts }: { parts: { label: string; score: number }[] }) {
  return (
    <View style={{ gap: 12, marginVertical: 6 }}>
      {parts.map((p) => (
        <View key={p.label}>
          <View style={s.row}>
            <Text style={s.label}>{p.label}</Text>
            <Text style={s.score}>{p.score}</Text>
          </View>
          <View style={s.track}>
            <View style={[s.fill, { width: `${p.score}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 13, fontWeight: '600', color: C.ink },
  score: { fontSize: 13, fontWeight: '700', color: C.accentDeep, fontVariant: ['tabular-nums'] },
  track: { height: 7, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: C.accent },
});
