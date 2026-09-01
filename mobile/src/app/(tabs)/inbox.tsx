// 관심함 — 받은 신호, 블러 티저(상위 궁합 조회자), 조회자 목록(구독 유도), 내 매칭

import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Header } from '../../components/Header';
import { useSpend } from '../../components/SpendFlow';
import { Sheet, SheetDesc, SheetTitle } from '../../components/Sheet';
import { Btn, Chip, Sect } from '../../components/ui';
import { getProfiles } from '../../lib/data/registry';
import { COST, PASS_PRICE } from '../../lib/economy';
import { compatWith, profileById, useApp } from '../../lib/store';
import { C, R } from '../../lib/theme';

export default function Inbox() {
  const user = useApp((st) => st.user);
  const incomingHandled = useApp((st) => st.incomingHandled);
  const connectIncoming = useApp((st) => st.connectIncoming);
  const dismissIncoming = useApp((st) => st.dismissIncoming);
  const blurUnlocked = useApp((st) => st.blurUnlocked);
  const setBlurUnlocked = useApp((st) => st.setBlurUnlocked);
  const matches = useApp((st) => st.matches);
  const chats = useApp((st) => st.chats);
  const sendSignal = useApp((st) => st.sendSignal);
  const sentSignals = useApp((st) => st.sentSignals);
  const showToast = useApp((st) => st.showToast);
  const remoteReady = useApp((st) => st.remoteReady);
  const { requestSpend, spendUI } = useSpend();
  const [passOpen, setPassOpen] = useState(false);

  const incoming = useMemo(
    () => (user ? getProfiles().filter((p) => p.sentSignal && p.gender !== user.gender) : []),
    [user, remoteReady]
  );
  const viewer = useMemo(() => {
    if (!user) return null;
    const vs = getProfiles().filter((p) => p.viewedMe && p.gender !== user.gender);
    return vs.sort((a, b) => compatWith(user, b.id).total - compatWith(user, a.id).total)[0] ?? null;
  }, [user, remoteReady]);
  const viewerCount = useMemo(
    () => (user ? getProfiles().filter((p) => p.viewedMe && p.gender !== user.gender).length + 8 : 0),
    [user, remoteReady]
  );

  if (!user) return null;
  const vCompat = viewer ? compatWith(user, viewer.id) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Header title="관심함" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}>
        <Sect label="받은 신호" style={{ marginTop: 6 }} />
        {incoming.length === 0 && <Text style={s.emptyTxt}>아직 받은 신호가 없어요</Text>}
        {incoming.map((p) => {
          const st = incomingHandled[p.id];
          const c = compatWith(user, p.id);
          return (
            <View key={p.id} style={s.row}>
              <Avatar colors={p.colors} initial={p.name[0]} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.nm}>{p.name}</Text>
                  <Chip label={`궁합 ${c.total}`} tone="good" />
                </View>
                <Text style={s.ds}>{p.job} · {p.distKm}km{c.precise ? ' · 정밀 궁합' : ''}</Text>
              </View>
              {st === 'connected' ? (
                <Btn label="채팅 열기" kind="ghost" small onPress={() => router.push({ pathname: '/chat/[id]', params: { id: p.id } })} />
              ) : st === 'dismissed' ? (
                <Text style={s.dismissed}>지나감</Text>
              ) : (
                <View style={{ gap: 6 }}>
                  <Btn label="연결하기" small onPress={() => { connectIncoming(p.id); showToast(`${p.name}님과 연결됐어요 — 채팅이 열렸어요`); }} />
                  <Btn label="관심 없음" kind="ghost" small onPress={() => dismissIncoming(p.id)} />
                </View>
              )}
            </View>
          );
        })}

        {viewer && vCompat && (
          <>
            <Sect label="나를 눈여겨본 인연" />
            {blurUnlocked ? (
              <View style={s.row}>
                <Avatar colors={viewer.colors} initial={viewer.name[0]} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.nm}>{viewer.name}</Text>
                    <Chip label={`궁합 ${vCompat.total}${vCompat.precise ? ' · 정밀' : ''}`} tone="good" />
                  </View>
                  <Text style={s.ds}>{viewer.job} · {viewer.distKm}km</Text>
                </View>
                {sentSignals[viewer.id] ? (
                  matches.includes(viewer.id) ? (
                    <Btn label="채팅 열기" kind="ghost" small onPress={() => router.push({ pathname: '/chat/[id]', params: { id: viewer.id } })} />
                  ) : (
                    <Text style={s.dismissed}>신호 보냄</Text>
                  )
                ) : (
                  <Btn
                    label="신호" small
                    onPress={() =>
                      requestSpend({
                        cost: COST.signal,
                        reason: 'signal',
                        ref: viewer.id,
                        title: '인연 신호 보내기',
                        desc: `${viewer.name}님에게 궁합 ${vCompat.total}점과 함께 신호를 보내요.`,
                        okLabel: '신호 보내기',
                        onOk: () => {
                          const res = sendSignal(viewer.id);
                          showToast(res === 'accepted' ? `${viewer.name}님과 매칭됐어요! 🪢` : `${viewer.name}님에게 신호를 보냈어요`);
                        },
                      })
                    }
                  />
                )}
              </View>
            ) : (
              <View style={s.teaser}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                  <Avatar colors={viewer.colors} initial={viewer.name[0]} blurred />
                  <View style={{ flex: 1 }}>
                    <Text style={s.teaserTxt}>
                      <Text style={{ color: C.accentDeep, fontWeight: '700' }}>{`상위 궁합 · ${vCompat.total}점`}</Text>
                      의 인연이{'\n'}회원님의 프로필을 조회했어요
                    </Text>
                    <Text style={s.teaserSub}>3시간 전 · {viewer.distKm}km</Text>
                  </View>
                </View>
                <View style={{ marginTop: 13 }}>
                  <Btn
                    label="누군지 확인하기" cost={COST.unblur}
                    onPress={() =>
                      requestSpend({
                        cost: COST.unblur,
                        reason: 'unblur',
                        ref: viewer.id,
                        title: '조회한 인연 확인',
                        desc: `궁합 ${vCompat.total}점의 인연이 누구인지 확인해요.`,
                        okLabel: '확인하기',
                        onOk: () => { setBlurUnlocked(); showToast(`엽전 ${COST.unblur}개를 사용했어요`); },
                      })
                    }
                  />
                </View>
              </View>
            )}
          </>
        )}

        <Sect label="나를 조회한 사람" />
        <View style={s.row}>
          <Avatar colors={['#8A97AC', '#5A6B84']} initial={`+${viewerCount}`} />
          <View style={{ flex: 1 }}>
            <Text style={s.nm}>유리님 외 {viewerCount - 1}명</Text>
            <Text style={s.ds}>회원님의 프로필을 조회했어요</Text>
          </View>
          <Btn label="목록보기" kind="ghost" small onPress={() => setPassOpen(true)} />
        </View>

        {matches.length > 0 && (
          <>
            <Sect label="내 매칭" />
            {matches.map((id) => {
              const p = profileById(id);
              const last = (chats[id] ?? [])[Math.max(0, (chats[id] ?? []).length - 1)];
              return (
                <Pressable key={id} style={({ pressed }) => [s.row, pressed && { opacity: 0.8 }]}
                  onPress={() => router.push({ pathname: '/chat/[id]', params: { id } })}>
                  <Avatar colors={p.colors} initial={p.name[0]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.nm}>{p.name}</Text>
                    <Text style={s.ds} numberOfLines={1}>{last ? last.text : '대화를 시작해보세요'}</Text>
                  </View>
                  <Text style={{ color: C.faint, fontSize: 18 }}>›</Text>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      <Sheet visible={passOpen} onClose={() => setPassOpen(false)}>
        <SheetTitle>나를 조회한 사람</SheetTitle>
        <SheetDesc>
          전체 목록은 연분 패스 구독자에게 공개돼요.{'\n'}궁합 상세 무제한 · 조회자 전체 공개 · 매월 엽전 300
        </SheetDesc>
        <Btn label={`${PASS_PRICE}으로 시작`} onPress={() => { setPassOpen(false); showToast('구독 결제 흐름 (데모)'); }} />
      </Sheet>
      {spendUI}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 14, marginBottom: 10,
  },
  nm: { fontSize: 15, fontWeight: '700', color: C.ink },
  ds: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  dismissed: { fontSize: 12.5, color: C.faint },
  emptyTxt: { fontSize: 13, color: C.faint, marginBottom: 6, marginHorizontal: 2 },
  teaser: { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: '#F0CBD6', borderRadius: R.lg, padding: 16, marginBottom: 10 },
  teaserTxt: { fontSize: 14.5, fontWeight: '600', color: C.ink, lineHeight: 22 },
  teaserSub: { fontSize: 12, color: C.muted, marginTop: 4 },
});
