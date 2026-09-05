// 풀이 한 장 — 라벨 / 제목 / 결론 한 줄(tldr) / 근거 문단. 궁합 상세·내 사주 풀이 공용.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Section } from '../lib/saju/reading';
import { C, F } from '../lib/theme';

export function Topic({ sec }: { sec: Section }) {
  return (
    <View style={s.topic}>
      <Text style={s.topicLab}>{sec.label}</Text>
      <Text style={s.topicH}>{sec.title}</Text>
      {sec.tldr ? (
        <View style={s.tldr}>
          <Text style={s.tldrK}>결론</Text>
          <Text style={s.tldrTxt}>{sec.tldr}</Text>
        </View>
      ) : null}
      {sec.paras.map((t, i) => <Text key={i} style={s.topicP}>{t}</Text>)}
    </View>
  );
}

/** 상단 결론 카드 — 얘랑 나랑 어떻다 → 그래서 이런 느낌 */
export function VerdictCard({ sec }: { sec: Section }) {
  return (
    <View style={s.verdict}>
      <Text style={s.vLab}>{sec.label}</Text>
      <Text style={s.vTitle}>{sec.title}</Text>
      {sec.tldr ? <Text style={s.vTl}>{sec.tldr}</Text> : null}
      <View style={{ height: 6 }} />
      {sec.paras.map((t, i) => {
        const cut = t.indexOf(' — ');
        const k = cut > 0 ? t.slice(0, cut) : null, body = cut > 0 ? t.slice(cut + 3) : t;
        const cliff = k === '그런데';
        return (
          <View key={i} style={[s.vRow, cliff && s.vCliff]}>
            {k && <Text style={[s.vK, cliff && { color: C.accentDeep }]}>{k}</Text>}
            <Text style={[s.vP, cliff && s.vCliffTxt]}>{body}</Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  topic: { paddingVertical: 18, borderTopWidth: 1, borderTopColor: C.line, marginTop: 6 },
  topicLab: { fontSize: 11.5, color: C.accentDeep, fontWeight: '700', letterSpacing: 1 },
  topicH: { fontFamily: F.serif, fontSize: 18, color: C.ink, lineHeight: 27, marginTop: 6 },
  tldr: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: C.accentSoft, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10 },
  tldrK: { fontSize: 11, fontWeight: '800', color: C.accentDeep, letterSpacing: 1, marginTop: 3 },
  tldrTxt: { flex: 1, fontSize: 14.5, fontWeight: '700', color: C.ink, lineHeight: 22 },
  topicP: { fontSize: 14.5, color: C.ink, lineHeight: 24.5, marginTop: 10 },
  verdict: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.accent, borderRadius: 18, padding: 18, marginTop: 16 },
  vLab: { fontSize: 11.5, color: C.accentDeep, fontWeight: '800', letterSpacing: 1.2 },
  vTitle: { fontFamily: F.serif, fontSize: 21, color: C.ink, lineHeight: 31, marginTop: 6 },
  vTl: { fontSize: 14, fontWeight: '700', color: C.accentDeep, marginTop: 6, lineHeight: 21 },
  vRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line },
  vK: { fontSize: 12, fontWeight: '800', color: C.muted, letterSpacing: 0.4, marginBottom: 4 },
  vP: { fontSize: 14.5, color: C.ink, lineHeight: 23 },
  vCliff: { borderTopColor: C.accent },
  vCliffTxt: { fontFamily: F.serif, fontSize: 16.5, lineHeight: 26, color: C.ink },
});
