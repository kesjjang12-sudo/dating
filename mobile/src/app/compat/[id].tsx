// 궁합 상세 풀이 — 상대 사주 명식표 + 기질·연애·결혼·재물 + 두 사주 글자 관계 + 커플 궁합 + 대운·세운.
// 텍스트는 lib/saju/reading.ts가 규칙 기반으로 생성한다 (결정론적).

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ElemBars } from '../../components/ElemBars';
import { ScoreRing } from '../../components/ScoreRing';
import { useSpend } from '../../components/SpendFlow';
import { Btn, Chip } from '../../components/ui';
import { COST } from '../../lib/economy';
import {
  BRANCHES_HANJA, BRANCHES_KO, branchElement, Element, ELEMENTS, stemElement, STEMS_HANJA, STEMS_KO,
} from '../../lib/saju/ganzhi';
import { fromDateString } from '../../lib/saju/manseryeok';
import { fullReading, PersonAnalysis, Section } from '../../lib/saju/reading';
import { profileById, useApp } from '../../lib/store';
import { C, F, R } from '../../lib/theme';

const EL_COLOR: Record<Element, string> = { 목: '#55744F', 화: '#B14F2A', 토: '#9C7A3C', 금: '#7B8894', 수: '#37576F' };
const parseBirth = (b: string) => { const [y, m, d] = b.split('-').map(Number); return { y, m, d }; };

export default function CompatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useApp((st) => st.user);
  const unlocked = useApp((st) => (id ? st.unlockedDetails[id] : false));
  const unlockDetail = useApp((st) => st.unlockDetail);
  const sentSignals = useApp((st) => st.sentSignals);
  const matches = useApp((st) => st.matches);
  const sendSignal = useApp((st) => st.sendSignal);
  const showToast = useApp((st) => st.showToast);
  const { requestSpend, spendUI } = useSpend();

  const p = id ? profileById(id) : null;
  const reading = useMemo(() => {
    if (!user || !p) return null;
    return fullReading(
      { name: user.name, gender: user.gender, pillars: fromDateString(user.birth, user.hourBranch), birth: parseBirth(user.birth) },
      { name: p.name, gender: p.gender, pillars: fromDateString(p.birth, p.hourBranch), birth: parseBirth(p.birth) },
    );
  }, [user, p]);

  if (!id || !user || !p || !reading) return null;
  const { compat: c, them } = reading;
  const matched = matches.includes(id);

  const doSignal = () =>
    requestSpend({
      cost: COST.signal, reason: 'signal', ref: id, title: '인연 신호 보내기',
      desc: `${p.name}님에게 궁합 ${c.total}점과 함께 신호를 보내요. 상대가 수락하면 채팅이 열려요.`, okLabel: '신호 보내기',
      onOk: () => { const res = sendSignal(id); showToast(res === 'accepted' ? `${p.name}님과 매칭됐어요! 🪢` : `${p.name}님에게 신호를 보냈어요`); },
    });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        <Text style={s.topTitle} numberOfLines={1}>{p.name}님과의 궁합 풀이</Text>
        <Chip label={`궁합 ${c.total}`} tone="good" />
      </View>

      {!unlocked ? (
        <View style={s.gate}>
          <ScoreRing score={c.total} sub={c.precise ? '정밀 궁합' : '정확도 75%'} size={96} />
          <Text style={s.gateH}>{c.headline}</Text>
          <Text style={s.gateD}>
            {p.name}님의 사주 명식과 기질·연애 스타일·결혼운, 두 사주의 글자 관계, 성격·애정·결혼 궁합, 대운과 올해 세운까지 —
            한 번 열람하면 계속 무료로 볼 수 있어요.
          </Text>
          <Btn label="상세 풀이 열람" cost={COST.detail} style={{ alignSelf: 'stretch' }}
            onPress={() => requestSpend({
              cost: COST.detail, reason: 'detail', ref: id, title: '상세 궁합 풀이',
              desc: `${p.name}님과의 전체 풀이를 열어요. 한 번 열람하면 계속 무료로 볼 수 있어요.`, okLabel: '풀이 보기',
              onOk: () => { unlockDetail(id); showToast(`엽전 ${COST.detail}개를 사용했어요`); },
            })} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}>
          <View style={s.hero}>
            <ScoreRing score={c.total} sub={c.precise ? '정밀 궁합' : '정확도 75%'} size={84} />
            <View style={{ flex: 1 }}>
              <Text style={s.heroK}>{user.name} × {p.name}</Text>
              <Text style={s.heroH}>{c.headline}</Text>
            </View>
          </View>
          <ElemBars parts={c.parts} />

          <SecLabel n="一" label={`${p.name}님의 사주`} />
          <PillarGrid a={them} />
          <View style={s.badges}>
            {them.badges.map((b, i) => (
              <View key={i} style={[s.badge, b.tone === 'good' && s.badgeGood, b.tone === 'warn' && s.badgeWarn]}>
                <Text style={[s.badgeTxt, b.tone === 'good' && { color: C.good }, b.tone === 'warn' && { color: C.coin }]}>{b.label}</Text>
                <Text style={s.badgeWhere}>{b.where}</Text>
              </View>
            ))}
          </View>
          <View style={s.sum}>
            <SumCell k="일간" v={`${STEMS_KO[them.dayStem]}${them.element} · ${them.nick}`} />
            <SumCell k="격국" v={them.gyeokguk} />
            <SumCell k="강약" v={them.weak ? '신약' : '신강'} />
            <SumCell k="반기는 기운" v={them.favorable.join(' · ')} />
          </View>
          {reading.themSections.map((sec) => <Topic key={sec.key} sec={sec} />)}

          <SecLabel n="二" label="두 사주 사이의 글자" />
          <View style={s.relBox}>
            {reading.relations.length === 0 && <Text style={s.relEmpty}>두 명식 사이에 합·충이 없습니다 — 기운의 간섭이 적은 담담한 인연이에요.</Text>}
            {reading.relations.map((r, i) => (
              <View key={i} style={[s.rel, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Chip label={r.kind} tone={r.tone === 'good' ? 'good' : r.tone === 'warn' ? 'acc' : 'mut'} />
                  <Text style={s.relPair}>{r.left} × {r.right}</Text>
                </View>
                <Text style={s.relDesc}>{r.desc}</Text>
              </View>
            ))}
          </View>

          <SecLabel n="三" label="두 사람의 궁합" />
          {reading.coupleSections.map((sec) => <Topic key={sec.key} sec={sec} />)}

          <SecLabel n="四" label="시기 — 대운과 올해" />
          {reading.timingSections.map((sec) => <Topic key={sec.key} sec={sec} />)}

          <Text style={s.foot}>
            명식은 절기 입기 시각을 태양 황경으로 계산한 만세력 기준이며, 십신은 지지 본기, 십이운성은 음간 역행 기준입니다.
            점수·명식·대운은 계산된 값이고 풀이는 명리 통설에 기댄 해석이에요. 사주는 답이 아니라 기울기를 읽는 도구 — 재미있게, 무겁지 않게.
          </Text>
        </ScrollView>
      )}

      {unlocked && (
        <View style={s.cta}>
          {matched
            ? <Btn label="채팅 열기" onPress={() => router.push({ pathname: '/chat/[id]', params: { id } })} />
            : sentSignals[id]
              ? <Btn label="신호를 보냈어요 — 수락 대기 중" kind="ghost" disabled />
              : <Btn label="이대로 신호 보내기" cost={COST.signal} onPress={doSignal} />}
        </View>
      )}
      {spendUI}
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

function SumCell({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.sumCell}>
      <Text style={s.sumK}>{k}</Text>
      <Text style={s.sumV}>{v}</Text>
    </View>
  );
}

function Topic({ sec }: { sec: Section }) {
  return (
    <View style={s.topic}>
      <Text style={s.topicLab}>{sec.label}</Text>
      <Text style={s.topicH}>{sec.title}</Text>
      {sec.paras.map((t, i) => <Text key={i} style={s.topicP}>{t}</Text>)}
    </View>
  );
}

/** 명식표 — 시·일·월·년 4열, 천간 / 지지 / 십이운성 */
function PillarGrid({ a }: { a: PersonAnalysis }) {
  return (
    <View style={s.grid}>
      <View style={s.gridRow}>
        {a.pillars.map((pi) => <Text key={pi.label} style={s.colHead}>{pi.label}</Text>)}
      </View>
      <View style={s.gridRow}>
        {a.pillars.map((pi) => (
          <View key={pi.label} style={[s.cell, pi.label === '일주' && s.cellDm]}>
            {pi.p ? (
              <>
                <Text style={[s.han, { color: pi.label === '일주' ? '#fff' : EL_COLOR[stemElement(pi.p.stem)] }]}>{STEMS_HANJA[pi.p.stem]}</Text>
                <Text style={[s.kor, pi.label === '일주' && s.onDm]}>{STEMS_KO[pi.p.stem]} · {stemElement(pi.p.stem)}</Text>
                <Text style={[s.ten, pi.label === '일주' && s.onDm]}>{pi.stemSipsin ?? '일간 我'}</Text>
              </>
            ) : <Text style={s.unknown}>시간{'\n'}미상</Text>}
          </View>
        ))}
      </View>
      <View style={s.gridRow}>
        {a.pillars.map((pi) => (
          <View key={pi.label} style={s.cell}>
            {pi.p ? (
              <>
                <Text style={[s.han, { color: EL_COLOR[branchElement(pi.p.branch)] }]}>{BRANCHES_HANJA[pi.p.branch]}</Text>
                <Text style={s.kor}>{BRANCHES_KO[pi.p.branch]} · {branchElement(pi.p.branch)}</Text>
                <Text style={s.ten}>{pi.branchSipsin}</Text>
              </>
            ) : <Text style={s.unknown}>—</Text>}
          </View>
        ))}
      </View>
      <View style={[s.gridRow, { borderBottomWidth: 0 }]}>
        {a.pillars.map((pi) => (
          <View key={pi.label} style={s.stageCell}>
            <Text style={s.stage}>{pi.stage ?? '—'}</Text>
            {pi.p && <Text style={s.hidden}>{pi.hidden.map((h) => STEMS_KO[h.stem]).join('·')}</Text>}
          </View>
        ))}
      </View>
      <View style={s.elems}>
        {ELEMENTS.map((e) => (
          <View key={e} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 2, alignSelf: 'stretch', paddingHorizontal: 4 }}>
              {[0, 1, 2].map((i) => <View key={i} style={[s.elBar, { backgroundColor: EL_COLOR[e], opacity: i < a.elementCount[e] ? 1 : 0.15 }]} />)}
            </View>
            <Text style={s.elLbl}>{e} {a.elementCount[e]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.card },
  topTitle: { flex: 1, fontSize: 15.5, fontWeight: '700', color: C.ink },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  gateH: { fontFamily: F.serif, fontSize: 19, color: C.ink, textAlign: 'center', lineHeight: 28 },
  gateD: { fontSize: 13.5, color: C.muted, textAlign: 'center', lineHeight: 21 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18, marginBottom: 12 },
  heroK: { fontSize: 12.5, color: C.faint, fontWeight: '600', letterSpacing: 0.3 },
  heroH: { fontFamily: F.serif, fontSize: 18, color: C.ink, lineHeight: 27, marginTop: 4 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 34, marginBottom: 12 },
  secNum: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  secNumTxt: { fontFamily: F.serif, fontSize: 12, color: C.muted },
  secTitle: { fontFamily: F.serif, fontSize: 20, color: C.ink },
  grid: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, overflow: 'hidden' },
  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.line },
  colHead: { flex: 1, textAlign: 'center', fontSize: 11, color: C.faint, paddingVertical: 8, backgroundColor: C.bg, letterSpacing: 0.8 },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: C.line },
  cellDm: { backgroundColor: C.accentDeep },
  han: { fontFamily: F.serif, fontSize: 34, lineHeight: 38 },
  kor: { fontSize: 11, color: C.muted, marginTop: 3 },
  ten: { fontSize: 10.5, color: C.faint, marginTop: 4 },
  onDm: { color: 'rgba(255,255,255,0.85)' },
  unknown: { fontSize: 12, color: C.faint, textAlign: 'center', lineHeight: 18, paddingVertical: 12 },
  stageCell: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRightWidth: 1, borderRightColor: C.line },
  stage: { fontSize: 12, fontWeight: '700', color: C.ink },
  hidden: { fontSize: 10, color: C.faint, marginTop: 2 },
  elems: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.bg },
  elBar: { flex: 1, height: 4, borderRadius: 2 },
  elLbl: { fontSize: 10.5, color: C.muted, marginTop: 6, fontVariant: ['tabular-nums'] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  badge: { flexDirection: 'row', gap: 6, alignItems: 'center', borderWidth: 1, borderColor: C.line2, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: C.card },
  badgeGood: { borderColor: '#BFD6C6' },
  badgeWarn: { borderColor: C.coinLine },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: C.ink },
  badgeWhere: { fontSize: 10.5, color: C.faint },
  sum: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, borderWidth: 1, borderColor: C.line, borderRadius: R.md, overflow: 'hidden', backgroundColor: C.card },
  sumCell: { width: '50%', padding: 12, borderWidth: 0.5, borderColor: C.line },
  sumK: { fontSize: 10.5, color: C.faint, letterSpacing: 0.6 },
  sumV: { fontSize: 13.5, fontWeight: '600', color: C.ink, marginTop: 3, lineHeight: 19 },
  topic: { paddingVertical: 18, borderTopWidth: 1, borderTopColor: C.line, marginTop: 6 },
  topicLab: { fontSize: 11.5, color: C.accentDeep, fontWeight: '700', letterSpacing: 1 },
  topicH: { fontFamily: F.serif, fontSize: 18, color: C.ink, lineHeight: 27, marginTop: 6 },
  topicP: { fontSize: 14.5, color: C.ink, lineHeight: 24.5, marginTop: 10 },
  relBox: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, overflow: 'hidden' },
  rel: { padding: 14, gap: 8 },
  relPair: { fontSize: 13, color: C.ink, fontWeight: '600' },
  relDesc: { fontSize: 13.5, color: C.muted, lineHeight: 21 },
  relEmpty: { padding: 16, fontSize: 13.5, color: C.muted, lineHeight: 21 },
  foot: { fontSize: 12, color: C.faint, lineHeight: 19, marginTop: 30, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.line },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, paddingBottom: 22, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line },
});
