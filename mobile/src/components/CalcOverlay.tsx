// 궁합 계산 연출 — 상대 페이지를 처음 열 때 3초 남짓, 실제로 계산된 사실(합·충 개수, 십신, 대운)을 단계별로 보여 준다.
// 가짜 숫자·가짜 후기는 넣지 않는다. 탭하면 건너뛴다.

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, F } from '../lib/theme';

export interface CalcStep { doing: string; found: string; }

const STEP_MS = 900;

export function CalcOverlay({ steps, total, criteria, onDone }: { steps: CalcStep[]; total: number; criteria: string; onDone: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (i >= steps.length) { const t = setTimeout(onDone, 700); return () => clearTimeout(t); }
    const t = setTimeout(() => setI(i + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [i, steps.length, onDone]);
  return (
    <Pressable style={s.wrap} onPress={onDone} accessibilityLabel="계산 연출 건너뛰기">
      <View style={s.card}>
        <Text style={s.k}>두 사주를 대조하는 중</Text>
        {steps.map((st, idx) => (
          <View key={idx} style={[s.row, idx > i && { opacity: 0.25 }]}>
            <Text style={s.dot}>{idx < i ? '●' : idx === i ? '◐' : '○'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.doing}>{st.doing}</Text>
              {idx < i && <Text style={s.found}>{st.found}</Text>}
            </View>
          </View>
        ))}
        {i >= steps.length && <Text style={s.total}>궁합 {total}점</Text>}
        <Text style={s.crit}>{criteria}</Text>
        <Text style={s.skip}>탭하면 바로 보기</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(253,251,246,0.96)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 20 },
  card: { alignSelf: 'stretch', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 20, gap: 12 },
  k: { fontFamily: F.serif, fontSize: 19, color: C.ink, marginBottom: 4 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 16, fontSize: 12, color: C.accentDeep, marginTop: 3 },
  doing: { fontSize: 14, color: C.ink, fontWeight: '600' },
  found: { fontSize: 13, color: C.accentDeep, marginTop: 3, lineHeight: 19 },
  total: { fontFamily: F.serif, fontSize: 26, color: C.accentDeep, textAlign: 'center', marginTop: 6 },
  crit: { fontSize: 11, color: C.faint, lineHeight: 16, marginTop: 6 },
  skip: { fontSize: 11.5, color: C.muted, textAlign: 'center' },
});
