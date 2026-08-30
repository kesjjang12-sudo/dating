// 궁합 점수 링

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C } from '../lib/theme';

export function ScoreRing({ score, sub, size = 74 }: { score: number; sub: string; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.28)" strokeWidth={stroke} fill="rgba(24,10,14,0.72)" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={C.accent} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${(circ * score) / 100} ${circ}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={s.num}>{score}</Text>
      <Text style={s.sub}>{sub}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  num: { color: '#fff', fontSize: 20, fontWeight: '700', lineHeight: 22, fontVariant: ['tabular-nums'] },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 9.5, marginTop: 1 },
});
