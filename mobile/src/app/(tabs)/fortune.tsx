// 운세 — 데일리 출석 파밍(오늘의 운세 +5), 주간 연애운(유료), 내 사주 카드

import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { SajuCard } from '../../components/SajuCard';
import { useSpend } from '../../components/SpendFlow';
import { Btn, Chip, Sect } from '../../components/ui';
import { COST, EARN } from '../../lib/economy';
import { BRANCHES_KO } from '../../lib/saju/ganzhi';
import { dailyFortune, weeklyFortune } from '../../lib/saju/fortune';
import { isWeeklyUnlocked, myPillars, todayStr, useApp } from '../../lib/store';
import { C, F, R } from '../../lib/theme';

export default function Fortune() {
  const user = useApp((st) => st.user);
  const fortuneDate = useApp((st) => st.fortuneDate);
  const streak = useApp((st) => st.streak);
  const weeklyKey = useApp((st) => st.weeklyKey);
  const claimFortune = useApp((st) => st.claimFortune);
  const unlockWeekly = useApp((st) => st.unlockWeekly);
  const showToast = useApp((st) => st.showToast);
  const { requestSpend, spendUI } = useSpend();

  const pillars = useMemo(() => myPillars(user), [user]);
  const today = useMemo(() => (pillars ? dailyFortune(new Date(), pillars) : null), [pillars]);
  const weekly = useMemo(() => (pillars ? weeklyFortune(new Date(), pillars) : ''), [pillars]);

  if (!user || !pillars || !today) return null;
  const claimed = fortuneDate === todayStr();
  const weeklyOpen = isWeeklyUnlocked(weeklyKey);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Header title="운세" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 24 }}>
        <LinearGradient colors={['#3A2430', '#8E2547', '#B93359']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.heroDate}>{today.dateLabel}</Text>
            {streak > 0 && <Text style={s.streak}>연속 {streak}일</Text>}
          </View>
          {claimed ? (
            <>
              <Text style={s.heroTitle}>{today.title}</Text>
              <Text style={s.heroBody}>{today.body}</Text>
              <View style={s.luckyRow}>
                <View style={s.lucky}><Text style={s.luckyK}>길한 방향</Text><Text style={s.luckyV}>{today.luckyDirection}</Text></View>
                <View style={s.lucky}><Text style={s.luckyK}>길한 시간</Text><Text style={s.luckyV}>{today.luckyHour}</Text></View>
              </View>
            </>
          ) : (
            <>
              <Text style={s.heroTitle}>오늘의 운세가 도착했어요</Text>
              <Text style={s.heroBody}>확인할 때마다 엽전 {EARN.dailyFortune}개를 드려요. 7일 연속이면 +{EARN.streak7} 보너스.</Text>
              <Btn
                label="오늘의 운세 확인하기" cost={`+${EARN.dailyFortune}`}
                style={{ backgroundColor: '#fff' }}
                onPress={() => {
                  const res = claimFortune();
                  if (res) showToast(res.streakBonus ? `엽전 ${res.earned}개! 7일 연속 보너스 포함 🎉` : `엽전 ${res.earned}개를 받았어요`);
                }}
              />
            </>
          )}
        </LinearGradient>

        <View style={s.fcard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.fTitle}>이번 주 연애운</Text>
            <Chip label="상세 풀이" tone="acc" />
          </View>
          {weeklyOpen ? (
            <Text style={s.fBody}>{weekly}</Text>
          ) : (
            <>
              <Text style={s.fBody} numberOfLines={2}>{weekly}</Text>
              <View style={{ marginTop: 12 }}>
                <Btn
                  label="전체 풀이 보기" kind="ghost" small cost={COST.weekly}
                  onPress={() =>
                    requestSpend({
                      cost: COST.weekly,
                      title: '이번 주 연애운 상세',
                      desc: '요일별 흐름, 길한 방향과 시간대, 신호 보내기 좋은 날까지 — 이번 주 전체 풀이를 확인해요.',
                      okLabel: '풀이 보기',
                      onOk: () => { unlockWeekly(); showToast(`엽전 ${COST.weekly}개를 사용했어요`); },
                    })
                  }
                />
              </View>
            </>
          )}
        </View>

        <Sect label="내 사주" />
        <SajuCard
          pillars={pillars}
          birthLabel={
            user.hourBranch === null
              ? `${user.birth.replace(/-/g, '. ')} · 시간 미상`
              : `${user.birth.replace(/-/g, '. ')} · ${BRANCHES_KO[user.hourBranch]}시생`
          }
        />
        <View style={{ height: 10 }} />
        <Btn label="내 사주 카드 공유하기" kind="ghost" onPress={() => showToast('사주 카드 이미지가 저장됐어요 (데모)')} />
      </ScrollView>
      {spendUI}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { borderRadius: R.xl, padding: 22, marginBottom: 12 },
  heroDate: { color: 'rgba(255,255,255,0.82)', fontSize: 12, letterSpacing: 0.6 },
  streak: { color: '#fff', fontSize: 11.5, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2, overflow: 'hidden' },
  heroTitle: { fontFamily: F.serif, color: '#fff', fontSize: 21, marginTop: 8, marginBottom: 10, lineHeight: 30 },
  heroBody: { color: 'rgba(255,255,255,0.95)', fontSize: 14, lineHeight: 24, marginBottom: 16 },
  luckyRow: { flexDirection: 'row', gap: 10 },
  lucky: { flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12, padding: 12 },
  luckyK: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, marginBottom: 3 },
  luckyV: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
  fcard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 18, marginBottom: 4 },
  fTitle: { fontSize: 15.5, fontWeight: '700', color: C.ink },
  fBody: { fontSize: 13.5, color: C.muted, lineHeight: 23, marginTop: 8 },
});
