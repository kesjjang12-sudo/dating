// 마이 — 프로필, 스토어, 미션, 내 사주 정보(출생시간 2회 수정), 데모 초기화

import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Header } from '../../components/Header';
import { SajuCard } from '../../components/SajuCard';
import { Sheet, SheetDesc, SheetTitle } from '../../components/Sheet';
import { StoreSheet } from '../../components/StoreSheet';
import { Btn, Chip } from '../../components/ui';
import { EARN, PASS_PRICE } from '../../lib/economy';
import { BRANCHES_KO, HOUR_RANGES, pillarKo } from '../../lib/saju/ganzhi';
import { myPillars, useApp } from '../../lib/store';
import { C, F, R } from '../../lib/theme';

export default function My() {
  const user = useApp((st) => st.user);
  const coins = useApp((st) => st.coins);
  const streak = useApp((st) => st.streak);
  const remoteReady = useApp((st) => st.remoteReady);
  const serverMode = useApp((st) => st.serverMode);
  const editHour = useApp((st) => st.editHour);
  const resetAll = useApp((st) => st.resetAll);
  const showToast = useApp((st) => st.showToast);

  const [storeOpen, setStoreOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [sajuOpen, setSajuOpen] = useState(false);
  const [hourPick, setHourPick] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const pillars = useMemo(() => myPillars(user), [user]);
  if (!user || !pillars) return null;

  const rows: { label: string; right: string; onPress: () => void }[] = [
    { label: '스토어', right: `엽전 ${coins.toLocaleString()}`, onPress: () => setStoreOpen(true) },
    { label: '인증 센터', right: '본인 ✓ · 직장 미인증', onPress: () => showToast('인증 센터 (데모) — 직장·학교 인증은 P1 범위예요') },
    { label: '미션', right: `연속 출석 ${streak}일`, onPress: () => setMissionOpen(true) },
    { label: '내 사주 정보', right: `${user.hourBranch === null ? '시간 미상' : BRANCHES_KO[user.hourBranch] + '시'} · 수정 ${2 - user.hourEdits}회 남음`, onPress: () => setSajuOpen(true) },
    { label: '지인 차단', right: '켜짐', onPress: () => showToast('연락처 기반 지인 차단 (데모)') },
    {
      label: '데이터 소스',
      right: serverMode ? 'Supabase · 계정 동기화' : remoteReady ? 'Supabase 연결됨 (읽기)' : '로컬 시드',
      onPress: () => showToast(
        serverMode
          ? '익명 계정으로 로그인됨 — 엽전·신호·채팅이 서버에 기록돼요'
          : remoteReady
            ? '프로필·피드는 서버에서 읽는 중 — 익명 로그인을 켜면 계정 동기화가 활성화돼요'
            : 'Supabase 미연결 — 로컬 시드로 동작 중이에요'
      ),
    },
    { label: '데모 초기화', right: '처음부터', onPress: () => setResetOpen(true) },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Header title="마이" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}>
        <View style={s.me}>
          <Avatar colors={['#33506C', '#221E17']} initial={user.name[0]} size={64} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.meName}>{user.name}</Text>
              <Chip label={`${pillarKo(pillars.day)}일주`} tone="acc" />
            </View>
            <Text style={s.meSub}>{user.birth.replace(/-/g, '.')} · 본인인증 완료</Text>
          </View>
        </View>
        <Btn label="프로필 수정" kind="ghost" onPress={() => showToast('프로필 편집 (데모) — 사진·문답·태그는 P0 후반 범위예요')} />

        <View style={s.menu}>
          {rows.map((r, i) => (
            <Pressable key={r.label} style={({ pressed }) => [s.mrow, i < rows.length - 1 && s.mrowLine, pressed && { opacity: 0.7 }]} onPress={r.onPress}>
              <Text style={s.mLabel}>{r.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[s.mRight, r.label === '스토어' && { color: C.coin, fontWeight: '700' }]}>{r.right}</Text>
                <Text style={{ color: C.faint, fontSize: 16 }}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={s.passCard}>
          <Text style={s.passTitle}>연분 패스</Text>
          <Text style={s.passDesc}>궁합 상세 무제한 · 조회자 전체 공개 · 매월 엽전 300</Text>
          <View style={{ marginTop: 12, alignSelf: 'flex-start' }}>
            <Btn label={`${PASS_PRICE}으로 시작`} small onPress={() => showToast('구독 결제 흐름 (데모)')} />
          </View>
        </View>
        <Text style={s.refund}>엽전 환불은 구매 7일 이내 미사용분만 가능해요</Text>
      </ScrollView>

      <StoreSheet visible={storeOpen} onClose={() => setStoreOpen(false)} />

      <Sheet visible={missionOpen} onClose={() => setMissionOpen(false)}>
        <SheetTitle>미션 — 엽전 모으기</SheetTitle>
        <SheetDesc>매일의 작은 의식이 신호 한 번이 됩니다.</SheetDesc>
        {[
          [`오늘의 운세 확인`, `+${EARN.dailyFortune} / 일`],
          [`7일 연속 출석`, `+${EARN.streak7}`],
          [`프로필 100% 완성`, `+${EARN.profileDone}`],
          [`직장·학교·매력 인증`, `+${EARN.verify} 각`],
          [`친구 초대`, `+${EARN.referral} / 명`],
        ].map(([l, v]) => (
          <View key={l} style={s.missionRow}>
            <Text style={s.mLabel}>{l}</Text>
            <Text style={{ color: C.coin, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{v}</Text>
          </View>
        ))}
      </Sheet>

      <Sheet visible={sajuOpen} onClose={() => { setSajuOpen(false); setHourPick(false); }}>
        <SheetTitle>내 사주 정보</SheetTitle>
        <SheetDesc>생년월일은 본인인증 값이라 수정할 수 없어요. 출생시간은 {2 - user.hourEdits}회 더 수정할 수 있어요.</SheetDesc>
        <SajuCard
          pillars={pillars}
          birthLabel={user.hourBranch === null ? `${user.birth.replace(/-/g, '. ')} · 시간 미상` : `${user.birth.replace(/-/g, '. ')} · ${BRANCHES_KO[user.hourBranch]}시생`}
        />
        <View style={{ height: 12 }} />
        {hourPick ? (
          <View style={s.grid}>
            {BRANCHES_KO.map((b, i) => (
              <Pressable key={b} style={s.tg} onPress={() => {
                if (editHour(i)) { showToast(`출생시간이 ${b}시로 변경됐어요 — 궁합이 재계산돼요`); }
                else showToast('수정 횟수를 모두 사용했어요');
                setHourPick(false);
              }}>
                <Text style={s.tgB}>{b}시</Text>
                <Text style={s.tgS}>{HOUR_RANGES[i]}시</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Btn label="출생시간 수정" kind="ghost" disabled={user.hourEdits >= 2} onPress={() => setHourPick(true)} />
        )}
      </Sheet>

      <Sheet visible={resetOpen} onClose={() => setResetOpen(false)}>
        <SheetTitle>데모 초기화</SheetTitle>
        <SheetDesc>모든 데이터(매칭·채팅·엽전)를 지우고 온보딩부터 다시 시작해요. 되돌릴 수 없어요.</SheetDesc>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn label="취소" kind="ghost" style={{ flex: 1 }} onPress={() => setResetOpen(false)} />
          <Btn label="초기화" style={{ flex: 1 }} onPress={() => { setResetOpen(false); resetAll(); router.replace('/onboarding'); }} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  me: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 2, marginBottom: 6 },
  meName: { fontSize: 18.5, fontWeight: '700', color: C.ink },
  meSub: { fontSize: 12.5, color: C.muted, marginTop: 3 },
  menu: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, marginTop: 16, overflow: 'hidden' },
  mrow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15 },
  mrowLine: { borderBottomWidth: 1, borderBottomColor: C.line },
  mLabel: { fontSize: 14.5, fontWeight: '600', color: C.ink },
  mRight: { fontSize: 13, color: C.muted, fontVariant: ['tabular-nums'] },
  passCard: { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: '#F0CBD6', borderRadius: R.lg, padding: 18, marginTop: 14 },
  passTitle: { fontFamily: F.serif, fontSize: 17, color: C.ink },
  passDesc: { fontSize: 13, color: C.muted, marginTop: 4 },
  refund: { textAlign: 'center', fontSize: 12, color: C.faint, marginTop: 18 },
  missionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tg: { width: '22%', flexGrow: 1, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.line2, borderRadius: 11, paddingVertical: 9, alignItems: 'center' },
  tgB: { fontWeight: '700', fontSize: 13, color: C.ink },
  tgS: { fontSize: 10, color: C.faint, marginTop: 2 },
});
