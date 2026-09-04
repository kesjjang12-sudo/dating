// 궁합 상세 풀이 — 상대 사주 명식표 + 기질·연애·결혼·재물 + 두 사주 글자 관계 + 커플 궁합 + 대운·세운.
// 텍스트는 lib/saju/reading.ts가 규칙 기반으로 생성한다 (결정론적).

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ElemBars } from '../../components/ElemBars';
import { EL_COLOR, PillarGrid, PillarSummary } from '../../components/PillarGrid';
import { ReportSheet } from '../../components/ReportSheet';
import { ProfileInfo } from '../../components/ProfileInfo';
import { ScoreRing } from '../../components/ScoreRing';
import { Topic, VerdictCard } from '../../components/Topic';
import { useSpend } from '../../components/SpendFlow';
import { Btn, Chip } from '../../components/ui';
import { COST } from '../../lib/economy';
import { BRANCHES_HANJA, STEMS_HANJA } from '../../lib/saju/ganzhi';
import { fromDateString } from '../../lib/saju/manseryeok';
import { fullReading, Section } from '../../lib/saju/reading';
import { ElementRow, extraReading, GLOSSARY, YearRow } from '../../lib/saju/reading2';
import { profileById, useApp } from '../../lib/store';
import { C, F, R } from '../../lib/theme';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const isBlocked = useApp((st) => (id ? st.blocked.includes(id) : false));
  const unblock = useApp((st) => st.unblock);

  const p = id ? profileById(id) : null;
  const reading = useMemo(() => {
    if (!user || !p) return null;
    const mePil = fromDateString(user.birth, user.hourBranch), themPil = fromDateString(p.birth, p.hourBranch);
    const meB = parseBirth(user.birth), themB = parseBirth(p.birth);
    const base = fullReading(
      { name: user.name, gender: user.gender, pillars: mePil, birth: meB },
      { name: p.name, gender: p.gender, pillars: themPil, birth: themB },
    );
    const extra = extraReading(base.me, base.them, base.relations, base.compat, meB, themB, mePil, themPil);
    return { ...base, extra };
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
        <Text style={s.topTitle} numberOfLines={1}>{p.name}님 — 프로필 · 사주 궁합</Text>
        <Chip label={`궁합 ${c.total}`} tone="good" />
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} accessibilityLabel="더보기"><Ionicons name="ellipsis-horizontal" size={22} color={C.muted} /></Pressable>
      </View>
      {isBlocked && (
        <View style={s.blockedBar}>
          <Text style={s.blockedTxt}>차단한 상대예요 — 서로의 화면에서 보이지 않아요</Text>
          <Btn label="차단 해제" kind="ghost" small onPress={() => { void unblock(id); showToast('차단을 해제했어요'); }} />
        </View>
      )}
      <ReportSheet visible={menuOpen} onClose={() => setMenuOpen(false)} targetHandle={id} targetName={p.name} onBlocked={() => router.back()} />

      {(
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}>
          <View style={s.hero}>
            <ScoreRing score={c.total} sub={c.precise ? '정밀 궁합' : '정확도 75%'} size={84} />
            <View style={{ flex: 1 }}>
              <Text style={s.heroK}>{user.name} × {p.name}</Text>
              <Text style={s.heroH}>{c.headline}</Text>
            </View>
          </View>
          <ElemBars parts={c.parts} />

          <SecLabel n="一" label={`${p.name}님의 프로필`} />
          <ProfileInfo p={p} />

          <SecLabel n="二" label={`${p.name}님의 사주`} />
          <PillarGrid a={them} />
          <PillarSummary a={them} />
          {!unlocked ? (
            <LockedReading
              name={p.name} cost={COST.detail} preview={[reading.extra.verdict, ...reading.themSections, ...reading.extra.relationSections]}
              labels={[reading.extra.verdict, ...reading.themSections, ...reading.extra.themMore, ...reading.extra.relationSections, ...reading.coupleSections, ...reading.extra.stageSections, ...reading.timingSections, ...reading.extra.timingSections, reading.extra.summary].map((x) => x.label)}
              onUnlock={() => requestSpend({
                cost: COST.detail, reason: 'detail', ref: id, title: '사주 궁합 풀이 해금',
                desc: `${p.name}님과의 전체 풀이를 열어요. 한 번 열람하면 계속 무료로 볼 수 있어요.`, okLabel: '해금하기',
                onOk: () => { unlockDetail(id); showToast(`엽전 ${COST.detail}개를 사용했어요 — 풀이가 열렸어요`); },
              })}
            />
          ) : (<>
          <VerdictCard sec={reading.extra.verdict} />
          <Text style={s.howto}>아래는 이 결론의 근거예요. 각 장은 결론 한 줄을 먼저 두고 설명을 이었어요.</Text>
          {reading.themSections.map((sec) => <Topic key={sec.key} sec={sec} />)}
          {reading.extra.themMore.map((sec) => <Topic key={sec.key} sec={sec} />)}

          <SecLabel n="三" label={`${user.name}님의 사주`} />
          {reading.extra.meSections.map((sec) => <Topic key={sec.key} sec={sec} />)}
          <Btn label="내 사주 전체 풀이 보기" kind="ghost" small onPress={() => router.push('/saju/me')} />

          <SecLabel n="四" label="두 사주 사이의 글자" />
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

          <SecLabel n="五" label={`${p.name}님은 나에게`} />
          {reading.extra.relationSections.map((sec) => <Topic key={sec.key} sec={sec} />)}
          <Text style={s.tblTitle}>오행 보완표 — 나 · {p.name}</Text>
          <ElementTable rows={reading.extra.elementTable} />

          <SecLabel n="六" label="두 사람의 궁합" />
          {reading.coupleSections.map((sec) => <Topic key={sec.key} sec={sec} />)}
          {reading.extra.stageSections.map((sec) => <Topic key={sec.key} sec={sec} />)}

          <SecLabel n="七" label="시기 — 대운·세운·이달" />
          {reading.timingSections.map((sec) => <Topic key={sec.key} sec={sec} />)}
          {reading.extra.timingSections.slice(0, 1).map((sec) => <Topic key={sec.key} sec={sec} />)}
          <Text style={s.tblTitle}>앞으로 3년 세운</Text>
          <YearTable rows={reading.extra.timing.years} me={user.name} them={p.name} />
          {reading.extra.timingSections.slice(1).map((sec) => <Topic key={sec.key} sec={sec} />)}

          <SecLabel n="八" label="총평" />
          <View style={s.sumBox}><Topic sec={reading.extra.summary} /></View>

          <SecLabel n="九" label="어려운 말 풀이" />
          <View style={s.gloss}>
            {GLOSSARY.map((g, i) => (
              <View key={g.term} style={[s.gRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
                <Text style={s.gTerm}>{g.term}</Text>
                <Text style={s.gMean}>{g.mean}</Text>
              </View>
            ))}
          </View>
          </>)}

          <Text style={s.foot}>
            명식은 절기 입기 시각을 태양 황경으로 계산한 만세력 기준이며, 십신은 지지 본기, 십이운성은 음간 역행 기준입니다.
            점수·명식·대운은 계산된 값이고 풀이는 명리 통설에 기댄 해석이에요. 사주는 답이 아니라 기울기를 읽는 도구 — 재미있게, 무겁지 않게.
          </Text>
        </ScrollView>
      )}

      {(
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

/** 미열람 상태: 풀이 앞부분을 블러로 비추고 해금 카드를 덮는다 */
function LockedReading({ name, cost, preview, labels, onUnlock }: { name: string; cost: number; preview: Section[]; labels: string[]; onUnlock: () => void }) {
  const uniq = [...new Set(labels)];
  return (
    <View style={s.lockWrap}>
      <View style={s.lockBlur} pointerEvents="none">
        {preview.slice(0, 3).map((sec) => <Topic key={sec.key} sec={sec} />)}
      </View>
      <LinearGradient colors={['rgba(253,251,246,0.15)', 'rgba(253,251,246,0.92)', C.bg]} locations={[0, 0.45, 1]} style={s.lockOverlay} pointerEvents="none" />
      <View style={s.lockCard}>
        <Text style={{ fontSize: 26 }}>🔒</Text>
        <Text style={s.lockTitle}>{name}님과 나의 사주 풀이 {uniq.length}장이 잠겨 있어요</Text>
        <Text style={s.lockDesc}>결론부터 — 이 사람이 나에게 어떤 별이고 같이 있으면 어떤 느낌인지. 그다음 근거로 서로 채워 주는 기운, 연애의 흐름과 결혼 후, 대운·세운까지. 한 번 해금하면 계속 볼 수 있어요.</Text>
        <View style={s.lockList}>
          {uniq.map((l) => <Text key={l} style={s.lockChip}>{l}</Text>)}
        </View>
        <Btn label="해금하기" cost={cost} style={{ alignSelf: 'stretch' }} onPress={onUnlock} />
      </View>
    </View>
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

function ElementTable({ rows }: { rows: ElementRow[] }) {
  return (
    <View style={s.tbl}>
      {rows.map((r, i) => (
        <View key={r.el} style={[s.tblRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
          <Text style={[s.tblEl, { color: EL_COLOR[r.el] }]}>{r.el}</Text>
          <Text style={s.tblNum}>{r.mine} · {r.theirs}</Text>
          <Text style={[s.tblNote, r.tone === 'good' && { color: C.good }, r.tone === 'warn' && { color: C.coin }]}>{r.note}</Text>
        </View>
      ))}
    </View>
  );
}

function YearTable({ rows, me, them }: { rows: YearRow[]; me: string; them: string }) {
  return (
    <View style={s.tbl}>
      {rows.map((r, i) => (
        <View key={r.year} style={[s.yrRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.line }]}>
          <View style={{ width: 74 }}>
            <Text style={s.yrY}>{r.year}</Text>
            <Text style={s.yrG}>{STEMS_HANJA[r.pillar.stem]}{BRANCHES_HANJA[r.pillar.branch]}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={s.yrLine}><Text style={s.yrWho}>{me}</Text>  {r.me}</Text>
            <Text style={s.yrLine}><Text style={s.yrWho}>{them}</Text>  {r.them}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.card },
  topTitle: { flex: 1, fontSize: 15.5, fontWeight: '700', color: C.ink },
  lockWrap: { marginTop: 12, position: 'relative', minHeight: 560 },
  lockBlur: { opacity: 0.55, filter: 'blur(5px)' },
  lockOverlay: { position: 'absolute', left: -18, right: -18, top: 0, bottom: 0 },
  lockCard: { position: 'absolute', left: 0, right: 0, top: 120, alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.xl, padding: 22, elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  lockTitle: { fontFamily: F.serif, fontSize: 18, color: C.ink, textAlign: 'center', lineHeight: 27 },
  lockDesc: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 20 },
  lockList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginVertical: 4 },
  lockChip: { fontSize: 11, color: C.muted, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18, marginBottom: 12 },
  heroK: { fontSize: 12.5, color: C.faint, fontWeight: '600', letterSpacing: 0.3 },
  heroH: { fontFamily: F.serif, fontSize: 18, color: C.ink, lineHeight: 27, marginTop: 4 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 34, marginBottom: 12 },
  secNum: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: C.line2, alignItems: 'center', justifyContent: 'center' },
  secNumTxt: { fontFamily: F.serif, fontSize: 12, color: C.muted },
  secTitle: { fontFamily: F.serif, fontSize: 20, color: C.ink },
  relBox: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, overflow: 'hidden' },
  rel: { padding: 14, gap: 8 },
  relPair: { fontSize: 13, color: C.ink, fontWeight: '600' },
  relDesc: { fontSize: 13.5, color: C.muted, lineHeight: 21 },
  relEmpty: { padding: 16, fontSize: 13.5, color: C.muted, lineHeight: 21 },
  tblTitle: { fontSize: 12.5, fontWeight: '700', color: C.muted, marginTop: 18, marginBottom: 8 },
  tbl: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.md, overflow: 'hidden' },
  tblRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  tblEl: { width: 22, fontFamily: F.serif, fontSize: 17 },
  tblNum: { width: 44, fontSize: 12.5, color: C.muted, fontVariant: ['tabular-nums'] },
  tblNote: { flex: 1, fontSize: 12.5, color: C.ink, lineHeight: 18 },
  yrRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 11 },
  yrY: { fontSize: 12.5, color: C.muted, fontVariant: ['tabular-nums'] },
  yrG: { fontFamily: F.serif, fontSize: 18, color: C.ink, marginTop: 1 },
  yrLine: { fontSize: 12.5, color: C.ink, lineHeight: 18 },
  yrWho: { fontWeight: '700', color: C.accentDeep },
  sumBox: { backgroundColor: C.accentSoft, borderRadius: R.lg, paddingHorizontal: 16, marginTop: 4 },
  blockedBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: C.accentSoft, borderBottomWidth: 1, borderBottomColor: C.line },
  blockedTxt: { flex: 1, fontSize: 12.5, color: C.accentDeep, fontWeight: '600' },
  howto: { fontSize: 12.5, color: C.muted, lineHeight: 19, marginTop: 14, marginBottom: 4 },
  gloss: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.md, overflow: 'hidden' },
  gRow: { paddingHorizontal: 14, paddingVertical: 11 },
  gTerm: { fontSize: 13, fontWeight: '700', color: C.ink },
  gMean: { fontSize: 12.5, color: C.muted, lineHeight: 19, marginTop: 3 },
  foot: { fontSize: 12, color: C.faint, lineHeight: 19, marginTop: 30, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.line },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, paddingBottom: 22, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line },
});
