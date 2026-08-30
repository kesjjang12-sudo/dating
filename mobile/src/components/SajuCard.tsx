// 사주팔자 카드 — 온보딩 완료·운세 탭에서 사용

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ELEMENT_HANJA, pillarHanja, pillarKo, stemElement, STEMS_HANJA, STEMS_KO } from '../lib/saju/ganzhi';
import { FourPillars } from '../lib/saju/manseryeok';
import { C, F, R } from '../lib/theme';

export function SajuCard({ pillars, birthLabel }: { pillars: FourPillars; birthLabel: string }) {
  const cols: { t: string; p: typeof pillars.year | null; accent?: boolean }[] = [
    { t: '시주', p: pillars.hour },
    { t: '일주', p: pillars.day, accent: true },
    { t: '월주', p: pillars.month },
    { t: '연주', p: pillars.year },
  ];
  const dm = stemElement(pillars.day.stem);
  return (
    <View style={s.card}>
      <Text style={s.lbl}>{birthLabel}</Text>
      <View style={s.row}>
        {cols.map((c) => (
          <View key={c.t} style={s.pillar}>
            <Text style={s.t}>{c.t}</Text>
            <Text style={[s.h, c.accent && { color: C.accentDeep }]}>{c.p ? pillarHanja(c.p) : '未知'}</Text>
            <Text style={s.r}>{c.p ? pillarKo(c.p) : '미상'}</Text>
          </View>
        ))}
      </View>
      <Text style={s.desc}>
        일간 <Text style={{ color: C.accentDeep, fontWeight: '700' }}>
          {STEMS_KO[pillars.day.stem]}{dm}({STEMS_HANJA[pillars.day.stem]}{ELEMENT_HANJA[dm]})
        </Text> — {DM_LINES[dm]}
      </Text>
      {pillars.hour === null && (
        <Text style={s.warn}>출생시간 미상 — 삼주 기준, 정확도 75%로 계산돼요</Text>
      )}
      {pillars.boundaryBirth && (
        <Text style={s.warn}>절기 경계일 출생 — 정밀 만세력 확인을 권장해요</Text>
      )}
    </View>
  );
}

const DM_LINES: Record<string, string> = {
  목: '곧게 자라는 나무의 기운. 함께 클 수 있는 인연과 잘 맞아요.',
  화: '주변을 밝히는 불의 기운. 당신을 담아주는 인연을 만나면 오래 타올라요.',
  토: '만물을 품는 흙의 기운. 흔들리는 상대에게 뿌리가 되어주는 사주예요.',
  금: '단단한 무쇠의 기운. 물(水)을 품은 인연을 만나면 비로소 빛나요.',
  수: '낮은 곳으로 흐르는 물의 기운. 방향을 함께 정해줄 인연과 깊어져요.',
};

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line2, borderRadius: R.xl, padding: 20, alignItems: 'center' },
  lbl: { fontSize: 12, letterSpacing: 1.4, color: C.muted, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8, marginVertical: 14, alignSelf: 'stretch' },
  pillar: { flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  t: { fontSize: 11, color: C.faint, fontWeight: '600' },
  h: { fontFamily: F.serif, fontSize: 23, color: C.ink, marginTop: 4 },
  r: { fontSize: 11, color: C.muted, marginTop: 3 },
  desc: { fontSize: 13.5, color: C.muted, lineHeight: 22, textAlign: 'center' },
  warn: { fontSize: 12, color: C.accentDeep, marginTop: 10, fontWeight: '600' },
});
