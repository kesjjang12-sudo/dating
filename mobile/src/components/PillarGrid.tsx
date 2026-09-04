// 명식표 — 시·일·월·년 4열, 천간 / 지지 / 십이운성·지장간 / 오행 개수. 궁합 상세와 내 사주 풀이에서 공용.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BRANCHES_HANJA, BRANCHES_KO, branchElement, Element, ELEMENTS, stemElement, STEMS_HANJA, STEMS_KO } from '../lib/saju/ganzhi';
import { PersonAnalysis } from '../lib/saju/reading';
import { C, F, R } from '../lib/theme';

export const EL_COLOR: Record<Element, string> = { 목: '#55744F', 화: '#B14F2A', 토: '#9C7A3C', 금: '#7B8894', 수: '#37576F' };

export function PillarGrid({ a }: { a: PersonAnalysis }) {
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

/** 신살 배지 + 일간·격국·강약·반기는 기운 요약 */
export function PillarSummary({ a }: { a: PersonAnalysis }) {
  return (
    <>
      <View style={s.badges}>
        {a.badges.map((b, i) => (
          <View key={i} style={[s.badge, b.tone === 'good' && s.badgeGood, b.tone === 'warn' && s.badgeWarn]}>
            <Text style={[s.badgeTxt, b.tone === 'good' && { color: C.good }, b.tone === 'warn' && { color: C.coin }]}>{b.label}</Text>
            <Text style={s.badgeWhere}>{b.where}</Text>
          </View>
        ))}
      </View>
      <View style={s.sum}>
        <SumCell k="일간 (나를 뜻하는 글자)" v={`${STEMS_KO[a.dayStem]}${a.element} · ${a.nick}`} />
        <SumCell k="격국 (세상에 나서는 방식)" v={a.gyeokguk} />
        <SumCell k="강약 (내 기운의 세기)" v={a.weak ? '신약 — 사람·배움에 기댈 때 잘 됨' : '신강 — 힘을 쓸 곳이 있어야 편함'} />
        <SumCell k="반기는 기운 (용신)" v={a.favorable.join(' · ')} />
      </View>
    </>
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

const s = StyleSheet.create({
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
  sumK: { fontSize: 10.5, color: C.faint, letterSpacing: 0.3 },
  sumV: { fontSize: 13.5, fontWeight: '600', color: C.ink, marginTop: 3, lineHeight: 19 },
});
