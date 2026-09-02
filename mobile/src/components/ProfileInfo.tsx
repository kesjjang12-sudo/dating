// 상대(또는 나)의 계정 프로필 표시 — 기본 정보 · 소개 · 관심사 · 연분 문답

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SeedProfile } from '../lib/data/profiles';
import { C, F, R } from '../lib/theme';
import { Chip } from './ui';

export function ProfileInfo({ p, compact }: { p: SeedProfile; compact?: boolean }) {
  const facts: { k: string; v: string }[] = [];
  if (p.job) facts.push({ k: '직업', v: p.job });
  if (p.region) facts.push({ k: '지역', v: p.region });
  if (p.heightCm) facts.push({ k: '키', v: `${p.heightCm}cm` });
  if (p.goal) facts.push({ k: '바라는 관계', v: p.goal });
  if (p.drink) facts.push({ k: '음주', v: p.drink });
  if (p.smoke) facts.push({ k: '흡연', v: p.smoke });
  if (p.mbti) facts.push({ k: 'MBTI', v: p.mbti });
  const answers = (p.answers ?? []).filter((a) => a.a?.trim());
  const empty = facts.length === 0 && !p.intro && !p.bio && p.tags.length === 0 && answers.length === 0;

  if (empty) {
    return (
      <View style={s.emptyBox}>
        <Text style={s.emptyTxt}>아직 프로필을 작성하지 않은 분이에요.{'\n'}사주 궁합과 대화로 먼저 알아가 보세요.</Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 14 }}>
      {p.intro ? <Text style={s.intro}>“{p.intro}”</Text> : null}
      {facts.length > 0 && (
        <View style={s.facts}>
          {facts.map((f) => (
            <View key={f.k} style={s.fact}>
              <Text style={s.factK}>{f.k}</Text>
              <Text style={s.factV}>{f.v}</Text>
            </View>
          ))}
        </View>
      )}
      {p.bio ? (
        <View>
          <Text style={s.lab}>자기소개</Text>
          <Text style={s.bio} numberOfLines={compact ? 4 : undefined}>{p.bio}</Text>
        </View>
      ) : null}
      {p.tags.length > 0 && (
        <View>
          <Text style={s.lab}>관심사</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {p.tags.map((t) => <Chip key={t} label={t} />)}
          </View>
        </View>
      )}
      {answers.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={s.lab}>연분 문답</Text>
          {answers.map((a) => (
            <View key={a.q} style={s.qa}>
              <Text style={s.q}>{a.q}</Text>
              <Text style={s.a}>{a.a}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  emptyBox: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 18 },
  emptyTxt: { fontSize: 13.5, color: C.muted, lineHeight: 21, textAlign: 'center' },
  intro: { fontFamily: F.serif, fontSize: 16.5, color: C.ink, lineHeight: 25 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.md, overflow: 'hidden' },
  fact: { width: '50%', paddingHorizontal: 13, paddingVertical: 10, borderWidth: 0.5, borderColor: C.line },
  factK: { fontSize: 10.5, color: C.faint, letterSpacing: 0.5 },
  factV: { fontSize: 13.5, fontWeight: '600', color: C.ink, marginTop: 2 },
  lab: { fontSize: 11.5, fontWeight: '700', color: C.accentDeep, letterSpacing: 0.8, marginBottom: 7 },
  bio: { fontSize: 14.5, color: C.ink, lineHeight: 23 },
  qa: { backgroundColor: C.accentSoft, borderRadius: R.md, padding: 13 },
  q: { fontSize: 12, color: C.accentDeep, fontWeight: '700' },
  a: { fontSize: 14.5, color: C.ink, lineHeight: 22, marginTop: 4 },
});
