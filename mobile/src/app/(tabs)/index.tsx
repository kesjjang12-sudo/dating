// 홈 — 오늘의 인연 카드덱. 궁합 가중 정렬, 신호/패스/상세 풀이.

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ElemBars } from '../../components/ElemBars';
import { Header } from '../../components/Header';
import { ScoreRing } from '../../components/ScoreRing';
import { useSpend } from '../../components/SpendFlow';
import { Sheet, SheetDesc, SheetTitle } from '../../components/Sheet';
import { Btn, Chip } from '../../components/ui';
import { COST } from '../../lib/economy';
import { compatWith, profileById, useApp } from '../../lib/store';
import { C, F, R } from '../../lib/theme';

/** 점수 → 상위 % 라벨 (티어식 근사) */
function topPercent(score: number): string {
  if (score >= 90) return '상위 1%';
  if (score >= 85) return '상위 3%';
  if (score >= 80) return '상위 8%';
  if (score >= 75) return '상위 15%';
  if (score >= 70) return '상위 24%';
  return '상위 40%';
}

export default function Home() {
  const user = useApp((st) => st.user);
  const deckIds = useApp((st) => st.deckIds);
  const deckPos = useApp((st) => st.deckPos);
  const ensureDeck = useApp((st) => st.ensureDeck);
  const passCurrent = useApp((st) => st.passCurrent);
  const sendSignal = useApp((st) => st.sendSignal);
  const refreshDeckPaid = useApp((st) => st.refreshDeckPaid);
  const unlockedDetails = useApp((st) => st.unlockedDetails);
  const unlockDetail = useApp((st) => st.unlockDetail);
  const showToast = useApp((st) => st.showToast);
  const { requestSpend, spendUI } = useSpend();
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => { ensureDeck(); }, [ensureDeck]);

  if (!user) return null;

  const currentId = deckIds[deckPos];
  const exhausted = !currentId;

  const doSignal = (id: string) => {
    const p = profileById(id);
    const compat = compatWith(user, id);
    requestSpend({
      cost: COST.signal,
      title: '인연 신호 보내기',
      desc: `${p.name}님에게 궁합 ${compat.total}점과 함께 신호를 보내요. 상대가 수락하면 채팅이 열려요.`,
      okLabel: '신호 보내기',
      onOk: () => {
        setDetailId(null);
        const res = sendSignal(id);
        showToast(res === 'accepted' ? `${p.name}님과 매칭됐어요! 채팅이 열렸어요 🪢` : `${p.name}님에게 신호를 보냈어요`);
      },
    });
  };

  const openDetail = (id: string) => {
    if (unlockedDetails[id]) { setDetailId(id); return; }
    const p = profileById(id);
    requestSpend({
      cost: COST.detail,
      title: '상세 궁합 풀이',
      desc: `${p.name}님과의 5요소 궁합과 관계 풀이를 확인해요. 한 번 열람하면 계속 무료로 볼 수 있어요.`,
      okLabel: '풀이 보기',
      onOk: () => { unlockDetail(id); showToast(`엽전 ${COST.detail}개를 사용했어요`); setDetailId(id); },
    });
  };

  const detail = detailId ? { p: profileById(detailId), c: compatWith(user, detailId) } : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Header />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}>
        <View style={s.deckHead}>
          <Text style={s.deckTitle}>오늘의 인연</Text>
          <Text style={s.deckCount}>
            {exhausted ? '오늘의 추천 완료' : `${deckPos + 1} / ${deckIds.length} · 자정에 새로 도착`}
          </Text>
        </View>

        {exhausted ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>🪢</Text>
            <Text style={s.emptyBig}>오늘의 인연을 모두 확인했어요</Text>
            <Text style={s.emptyNote}>새 인연은 매일 자정에 도착해요.{'\n'}기다리는 동안 오늘의 운세로 엽전을 모아보세요.</Text>
            <Btn
              label="인연 3명 더 보기" cost={COST.extraDeck} style={{ alignSelf: 'stretch' }}
              onPress={() =>
                requestSpend({
                  cost: COST.extraDeck,
                  title: '오늘의 인연 추가 열람',
                  desc: '새로운 인연 3명을 더 추천받아요.',
                  okLabel: '추가 열람',
                  onOk: () => { refreshDeckPaid(); showToast(`새로운 인연이 도착했어요 · 엽전 -${COST.extraDeck}`); },
                })
              }
            />
            <View style={{ height: 10 }} />
            <Btn label="운세 보러 가기" kind="ghost" style={{ alignSelf: 'stretch' }} onPress={() => router.push('/(tabs)/fortune')} />
          </View>
        ) : (
          (() => {
            const p = profileById(currentId);
            const c = compatWith(user, currentId);
            return (
              <View>
                <View style={s.card}>
                  <LinearGradient colors={p.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.photo}>
                    <Text style={s.face}>{p.name[0]}</Text>
                    <LinearGradient colors={['transparent', 'rgba(20,8,10,0.65)']} style={s.shade} />
                    <View style={s.info}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.nm}>{p.name}, {ageOf(p.birth)}</Text>
                        <Text style={s.subTxt}>{p.job} · {p.distKm}km</Text>
                      </View>
                      <ScoreRing score={c.total} sub={topPercent(c.total)} />
                    </View>
                  </LinearGradient>
                  <View style={s.gungLine}>
                    <Text style={s.gungK}>궁합</Text>
                    <Text style={s.gungV} numberOfLines={2}>{c.headline}</Text>
                  </View>
                  <View style={s.tagRow}>
                    <Chip label={c.precise ? '정밀 궁합' : '정확도 75%'} tone={c.precise ? 'good' : 'mut'} />
                    {p.tags.map((t) => <Chip key={t} label={t} />)}
                  </View>
                </View>

                <View style={s.actions}>
                  <Pressable style={s.pass} onPress={() => { passCurrent(); }}>
                    <Text style={{ fontSize: 19, color: C.muted }}>✕</Text>
                  </Pressable>
                  <Btn label="상세 풀이" kind="ghost" cost={unlockedDetails[currentId] ? '열람됨' : COST.detail} style={{ flex: 1 }} onPress={() => openDetail(currentId)} />
                  <Btn label="신호 보내기" cost={COST.signal} style={{ flex: 1 }} onPress={() => doSignal(currentId)} />
                </View>
                <Text style={s.introTxt}>“{p.intro}”</Text>
              </View>
            );
          })()
        )}
      </ScrollView>

      <Sheet visible={detail !== null} onClose={() => setDetailId(null)}>
        {detail && (
          <>
            <SheetTitle>{detail.p.name}님과의 궁합 — {detail.c.total}점</SheetTitle>
            <SheetDesc>{detail.c.headline}</SheetDesc>
            <ElemBars parts={detail.c.parts} />
            <SheetDesc>{detail.c.reading}</SheetDesc>
            <Btn label="이대로 신호 보내기" cost={COST.signal} onPress={() => { const pid = detail.p.id; setDetailId(null); setTimeout(() => doSignal(pid), 250); }} />
          </>
        )}
      </Sheet>
      {spendUI}
    </SafeAreaView>
  );
}

function ageOf(birth: string): number {
  const [y, m, d] = birth.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}

const s = StyleSheet.create({
  deckHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4, marginBottom: 10, marginHorizontal: 2 },
  deckTitle: { fontSize: 16.5, fontWeight: '700', color: C.ink },
  deckCount: { fontSize: 12.5, color: C.muted, fontVariant: ['tabular-nums'] },
  card: { backgroundColor: C.card, borderRadius: R.xl, overflow: 'hidden', borderWidth: 1, borderColor: C.line, elevation: 3 },
  photo: { height: 330, justifyContent: 'center', alignItems: 'center' },
  face: { fontFamily: F.serif, fontSize: 84, color: 'rgba(255,255,255,0.85)' },
  shade: { ...StyleSheet.absoluteFill as object },
  info: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  nm: { color: '#fff', fontSize: 22, fontWeight: '700' },
  subTxt: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
  gungLine: { flexDirection: 'row', gap: 9, paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: 'center' },
  gungK: { fontFamily: F.serif, color: C.accentDeep, fontSize: 14 },
  gungV: { flex: 1, fontSize: 13.5, color: C.ink, lineHeight: 19 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 18, paddingVertical: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'stretch' },
  pass: { width: 54, borderRadius: R.md, borderWidth: 1.5, borderColor: C.line2, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  introTxt: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 14, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 8 },
  emptyBig: { fontFamily: F.serif, fontSize: 19, color: C.ink, marginBottom: 8 },
  emptyNote: { fontSize: 13, color: C.faint, textAlign: 'center', lineHeight: 21, marginBottom: 18 },
});
