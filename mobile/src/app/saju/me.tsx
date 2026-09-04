// 내 사주 풀이 — 내 명식표·신살·기질·연애·결혼·재물·건강·대인·인생 흐름 + 대운 흐름표 + 올해·이달.
// 텍스트는 궁합 상세와 같은 엔진(reading.ts / reading2.ts)이 만든다. 결론 한 줄 → 근거 순서.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EL_COLOR, PillarGrid, PillarSummary } from '../../components/PillarGrid';
import { Topic } from '../../components/Topic';
import { Btn, Chip } from '../../components/ui';
import { daeun } from '../../lib/saju/daeun';
import { BRANCHES_KO, pillarHanja, pillarKo, splitGanzhi } from '../../lib/saju/ganzhi';
import { fromDateString, monthPillar } from '../../lib/saju/manseryeok';
import { analyze, characterLine, DM, elementDist, GROUP_OF, innerRelations, luckNow, personSections, Section, sipsin, sipsinB, spouseElement, stage12, yearLineFor, YEAR_SHORT } from '../../lib/saju/reading';
import { GLOSSARY, STAGE_SHORT, themMore, YEAR_ONE } from '../../lib/saju/reading2';
import { useApp } from '../../lib/store';
import { C, F, R } from '../../lib/theme';

const EL_WORD: Record<string, string> = { 목: '나무', 화: '불', 토: '흙', 금: '금속', 수: '물' };

export default function MySaju() {
  const user = useApp((st) => st.user);
  const r = useMemo(() => {
    if (!user) return null;
    const today = new Date();
    const pillars = fromDateString(user.birth, user.hourBranch);
    const [y, m, d] = user.birth.split('-').map(Number);
    const person = { name: user.name, gender: user.gender, pillars };
    const a = analyze(person);
    const now = luckNow(a, person, { y, m, d }, today);
    const hb = user.hourBranch;
    const dd = daeun(y, m, d, hb === null ? 12 : (hb * 2) % 24, hb === null ? 0 : 30, user.gender, pillars);
    const age = today.getFullYear() - y;
    const cycles = (dd?.cycles ?? []).map((c) => ({
      ...c, stemS: sipsin(a.dayStem, c.pillar.stem), branchS: sipsinB(a.dayStem, c.pillar.branch), stage: stage12(a.dayStem, c.pillar.branch),
      current: now?.startAge === c.startAge,
    }));
    const year = today.getFullYear(), yp = splitGanzhi(year - 4);
    const mp = monthPillar(year, today.getMonth() + 1, today.getDate(), null);
    const yearS: Section = {
      key: 'year', label: `${year}년 세운`, title: `${pillarKo(yp)}년, 나의 올해`,
      tldr: `올해는 ${YEAR_SHORT[GROUP_OF[sipsin(a.dayStem, yp.stem)]]}예요.`,
      paras: [yearLineFor(a, year, yp), `이달(${pillarKo(mp)}월)은 ${sipsin(a.dayStem, mp.stem)}·${sipsinB(a.dayStem, mp.branch)} — ${YEAR_ONE[GROUP_OF[sipsin(a.dayStem, mp.stem)]]}의 달. 월운은 대운·세운 위에 부는 바람 정도로 가볍게 보세요.`],
    };
    const dm = DM[a.dayStem];
    const spouseEl = spouseElement(a);
    const ch = characterLine(a);
    const glance: Section = {
      key: 'glance', label: '한눈에', title: `${a.nick}의 ${a.element} — ${a.gyeokguk}, ${a.weak ? '신약' : '신강'}`,
      tldr: `${ch.who}, ${ch.spoken}. 연애는 ${ch.love}. 잘 맞는 짝은 ${EL_WORD[spouseEl]}(${spouseEl}) 기운의 사람.`,
      paras: [
        `${pillarKo(pillars.year)}년 ${pillarKo(pillars.month)}월 ${pillarKo(pillars.day)}일${pillars.hour ? ` ${pillarKo(pillars.hour)}시` : ' (시간 미상)'} · ${a.animal}띠 · 일간 ${pillarKo(pillars.day)[0]}${a.element}. 아래는 이 명식을 궁합 상세와 같은 기준으로 읽은 것이고, 상대를 열면 "이 사람이 나에게 무엇을 보태고 무엇을 흔드는가"가 이 기준 위에서 계산돼요.`,
      ],
    };
    return { a, pillars, sections: personSections(a, now), more: themMore(a), cycles, dist: elementDist(a), inner: innerRelations(a), forward: dd?.forward, daeunSu: dd?.daeunSu, age, yearS, glance, dm, ch };
  }, [user]);

  if (!user || !r) return null;
  const { a } = r;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        <Text style={s.topTitle} numberOfLines={1}>내 사주 풀이</Text>
        <Chip label={user.hourBranch === null ? '삼주 · 75%' : `${BRANCHES_KO[user.hourBranch]}시생`} tone="mut" />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={s.hero}>
          <Text style={s.heroK}>{user.name} · {user.birth.replace(/-/g, '.')}</Text>
          <Text style={s.heroH}>{a.nick} — {r.ch.who}</Text>
        </View>

        <SecLabel n="一" label="나의 명식" />
        <PillarGrid a={a} />
        <PillarSummary a={a} />

        <Text style={s.tblTitle}>오행 · 십성 분포</Text>
        <View style={s.tbl}>
          {r.dist.map((d, i) => (
            <View key={d.el} style={[s.row, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
              <Text style={[s.distEl, { color: EL_COLOR[d.el] }]}>{d.el}</Text>
              <Text style={s.distG}>{d.group}</Text>
              <View style={s.bar}><View style={[s.barFill, { width: `${Math.min(100, d.pct * 2)}%`, backgroundColor: EL_COLOR[d.el] }]} /></View>
              <Text style={s.distPct}>{d.pct}%</Text>
              <Text style={[s.lvl, d.level === '발달' && { color: C.accentDeep }, d.level === '부족' && { color: C.coin }, d.level === '없음' && { color: C.faint }]}>{d.level}</Text>
            </View>
          ))}
        </View>
        <Text style={s.note}>비겁=나와 같은 기운 · 식상=내가 낳는 기운 · 재성=내가 다루는 기운 · 관성=나를 누르는 기운 · 인성=나를 낳는 기운</Text>

        <Text style={s.tblTitle}>원국 안의 글자 관계 — 합 · 충 · 형 · 파</Text>
        <View style={s.tbl}>
          {r.inner.length === 0 && <Text style={s.note}>원국 안에 합·충·형·파가 없어요 — 글자들이 서로 간섭하지 않는 담백한 명식이에요.</Text>}
          {r.inner.map((x, i) => (
            <View key={i} style={[s.innerRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Chip label={x.kind} tone={x.tone === 'good' ? 'good' : x.tone === 'warn' ? 'acc' : 'mut'} />
                <Text style={s.innerPair}>{x.pair}</Text>
              </View>
              <Text style={s.innerDesc}>{x.desc}</Text>
            </View>
          ))}
        </View>

        <Topic sec={r.glance} />

        <SecLabel n="二" label="타고난 나" />
        {r.sections.map((sec) => <Topic key={sec.key} sec={sec} />)}
        {r.more.map((sec) => <Topic key={sec.key} sec={sec} />)}

        <SecLabel n="三" label="대운 — 10년마다 바뀌는 계절" />
        <Text style={s.note}>
          대운(大運)은 10년 단위로 바뀌는 큰 운이에요. {r.forward === undefined ? '절기 데이터 범위 밖이라 계산하지 못했어요.' : `${r.forward ? '순행' : '역행'} · 대운수 ${r.daeunSu} — 매 10년의 ${r.daeunSu}세 전후에 계절이 바뀝니다. 지금 ${r.age}세.`}
        </Text>
        <View style={s.tbl}>
          {r.cycles.map((c, i) => (
            <View key={c.startAge} style={[s.row, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }, c.current && s.rowNow]}>
              <View style={{ width: 84 }}>
                <Text style={[s.age, c.current && { color: C.accentDeep }]}>{c.startAge}~{c.startAge + 9}세</Text>
                <Text style={s.yr}>{c.startYear}년~</Text>
              </View>
              <Text style={[s.gz, c.current && { color: C.accentDeep }]}>{pillarHanja(c.pillar)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.line}>{c.stemS}·{c.branchS} · {c.stage}{c.current ? '  ← 지금' : ''}</Text>
                <Text style={s.sub}>{YEAR_SHORT[GROUP_OF[c.stemS]].replace(' 해', ' 10년')} · 내 기운은 {STAGE_SHORT[c.stage]}</Text>
              </View>
            </View>
          ))}
        </View>

        <SecLabel n="四" label="올해 · 이달" />
        <Topic sec={r.yearS} />

        <SecLabel n="五" label="어려운 말 풀이" />
        <View style={s.gloss}>
          {GLOSSARY.map((g, i) => (
            <View key={g.term} style={[s.gRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
              <Text style={s.gTerm}>{g.term}</Text>
              <Text style={s.gMean}>{g.mean}</Text>
            </View>
          ))}
        </View>

        <Text style={s.foot}>
          시진은 한국 출생 기준 30분 보정(자시 23:30~01:30 … 진시 07:30~09:30)을 씁니다 — 점신·사주도령 등 국내 만세력과 같은 경계예요.
          명식은 절기 입기 시각을 태양 황경으로 계산한 만세력 기준이며, 십신은 지지 본기, 십이운성은 음간 역행 기준입니다.
        </Text>
        <View style={{ height: 14 }} />
        <Btn label="출생시간 확인·수정 (마이 탭)" kind="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SecLabel({ n, label }: { n: string; label: string }) {
  return (
    <View style={s.secHead}>
      <View style={s.secNum}><Text style={s.secNumTxt}>{n}</Text></View>
      <Text style={s.secTitle}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.card },
  topTitle: { flex: 1, fontSize: 15.5, fontWeight: '700', color: C.ink },
  hero: { marginTop: 18, marginBottom: 6 },
  heroK: { fontSize: 12.5, color: C.faint, fontWeight: '600', letterSpacing: 0.3 },
  heroH: { fontFamily: F.serif, fontSize: 21, color: C.ink, lineHeight: 31, marginTop: 4 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 34, marginBottom: 12 },
  secNum: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  secNumTxt: { fontFamily: F.serif, fontSize: 12, color: C.muted },
  secTitle: { fontFamily: F.serif, fontSize: 20, color: C.ink },
  note: { fontSize: 12.5, color: C.muted, lineHeight: 19, marginTop: 8, marginBottom: 10 },
  tblTitle: { fontSize: 12.5, fontWeight: '700', color: C.muted, marginTop: 18, marginBottom: 8 },
  distEl: { width: 18, fontFamily: F.serif, fontSize: 17 },
  distG: { width: 34, fontSize: 12, color: C.muted },
  bar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.line, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  distPct: { width: 44, fontSize: 12, color: C.ink, textAlign: 'right', fontVariant: ['tabular-nums'] },
  lvl: { width: 30, fontSize: 12, fontWeight: '700', color: C.good, textAlign: 'right' },
  innerRow: { padding: 12, gap: 6 },
  innerPair: { fontSize: 12.5, color: C.ink, fontWeight: '600' },
  innerDesc: { fontSize: 12.5, color: C.muted, lineHeight: 18 },
  tbl: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11 },
  rowNow: { backgroundColor: C.accentSoft },
  age: { fontSize: 12.5, fontWeight: '700', color: C.ink, fontVariant: ['tabular-nums'] },
  yr: { fontSize: 11, color: C.faint, marginTop: 1, fontVariant: ['tabular-nums'] },
  gz: { width: 44, fontFamily: F.serif, fontSize: 20, color: C.ink },
  line: { fontSize: 13, color: C.ink, fontWeight: '600' },
  sub: { fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 17 },
  gloss: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.md, overflow: 'hidden' },
  gRow: { paddingHorizontal: 14, paddingVertical: 11 },
  gTerm: { fontSize: 13, fontWeight: '700', color: C.ink },
  gMean: { fontSize: 12.5, color: C.muted, lineHeight: 19, marginTop: 3 },
  foot: { fontSize: 12, color: C.faint, lineHeight: 19, marginTop: 30, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.line },
});
