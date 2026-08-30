// 온보딩 — ① 브랜드 ② 본인정보(PASS 인증 목업) ③ 출생시간 ④ 사주 카드

import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SajuCard } from '../components/SajuCard';
import { Btn } from '../components/ui';
import { BRANCHES_KO, HOUR_RANGES } from '../lib/saju/ganzhi';
import { fourPillars } from '../lib/saju/manseryeok';
import { useApp } from '../lib/store';
import { C, F } from '../lib/theme';

export default function Onboarding() {
  const completeOnboarding = useApp((st) => st.completeOnboarding);
  const showToast = useApp((st) => st.showToast);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [yy, setYy] = useState('');
  const [mm, setMm] = useState('');
  const [dd, setDd] = useState('');
  const [hour, setHour] = useState<number | null | undefined>(undefined); // undefined=미선택

  const birthValid = useMemo(() => {
    const y = Number(yy), m = Number(mm), d = Number(dd);
    if (!y || !m || !d) return false;
    if (y < 1940 || y > 2007) return false; // 성인 인증(19세 이상) 가정
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }, [yy, mm, dd]);

  const pillars = useMemo(() => {
    if (!birthValid || hour === undefined) return null;
    return fourPillars(Number(yy), Number(mm), Number(dd), hour);
  }, [birthValid, yy, mm, dd, hour]);

  const birthStr = `${yy}-${String(Number(mm)).padStart(2, '0')}-${String(Number(dd)).padStart(2, '0')}`;

  const finish = () => {
    completeOnboarding({ name: name.trim() || '인연', gender, birth: birthStr, hourBranch: hour ?? null });
    showToast('가입 완료 — 첫 인연 3명이 도착했어요');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
          {step === 1 && (
            <View style={s.mid}>
              <Text style={s.logo}>연분</Text>
              <Text style={s.logoSub}>緣分 — 사주가 이어주는 인연</Text>
              <Text style={s.tag}>
                얼굴 점수로 줄 세우지 않아요.{'\n'}당신의 사주와 가장 잘 맞는{'\n'}단 세 사람이 매일 자정에 도착해요.
              </Text>
              <Text style={s.proof}>오늘 2,481쌍의 궁합이 이어졌어요</Text>
            </View>
          )}

          {step === 2 && (
            <View style={{ flex: 1 }}>
              <View style={s.passbox}>
                <Text style={s.passTxt}>PASS 본인인증 (데모 — 직접 입력해 주세요)</Text>
              </View>
              <Text style={s.h}>기본 정보를{'\n'}확인해 주세요</Text>
              <Text style={s.sub}>생년월일은 인증값으로 고정되며 가입 후 수정할 수 없어요. 사주 계산의 근거가 됩니다.</Text>

              <Text style={s.field}>닉네임</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder="예: 은성" placeholderTextColor={C.faint} maxLength={10} />

              <Text style={s.field}>생년월일 (양력)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[s.input, { flex: 1.3 }]} value={yy} onChangeText={setYy} placeholder="1997" placeholderTextColor={C.faint} keyboardType="number-pad" maxLength={4} />
                <TextInput style={[s.input, { flex: 1 }]} value={mm} onChangeText={setMm} placeholder="12" placeholderTextColor={C.faint} keyboardType="number-pad" maxLength={2} />
                <TextInput style={[s.input, { flex: 1 }]} value={dd} onChangeText={setDd} placeholder="21" placeholderTextColor={C.faint} keyboardType="number-pad" maxLength={2} />
              </View>
              {!birthValid && yy.length === 4 && mm !== '' && dd !== '' && (
                <Text style={s.err}>생년월일을 확인해 주세요 (만 19세 이상만 가입할 수 있어요)</Text>
              )}

              <Text style={s.field}>성별</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['M', 'F'] as const).map((g) => (
                  <Pressable key={g} style={[s.genBtn, gender === g && s.genSel]} onPress={() => setGender(g)}>
                    <Text style={[s.genTxt, gender === g && { color: C.accentDeep }]}>{g === 'M' ? '남성' : '여성'}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={{ flex: 1 }}>
              <Text style={s.h}>태어난 시간을{'\n'}알려주세요</Text>
              <Text style={s.sub}>
                시(時)까지 있으면 <Text style={{ fontWeight: '700', color: C.ink }}>정밀 궁합</Text> 배지가 붙어요. 몰라도 괜찮아요 — 삼주 기준으로 궁합을 계산해요.
              </Text>
              <View style={s.grid}>
                {BRANCHES_KO.map((b, i) => (
                  <Pressable key={b} style={[s.tg, hour === i && s.tgSel]} onPress={() => setHour(i)}>
                    <Text style={[s.tgB, hour === i && { color: C.accentDeep }]}>{b}시</Text>
                    <Text style={s.tgS}>{HOUR_RANGES[i]}시</Text>
                  </Pressable>
                ))}
                <Pressable style={[s.tg, s.tgWide, hour === null && s.tgSel]} onPress={() => setHour(null)}>
                  <Text style={[s.tgB, hour === null && { color: C.accentDeep }]}>태어난 시간을 몰라요</Text>
                  <Text style={s.tgS}>삼주 기준 · 정확도 75%로 계산돼요</Text>
                </Pressable>
              </View>
            </View>
          )}

          {step === 4 && pillars && (
            <View style={s.mid}>
              <Text style={[s.h, { textAlign: 'center' }]}>당신의 사주가{'\n'}완성됐어요</Text>
              <View style={{ height: 14 }} />
              <SajuCard
                pillars={pillars}
                birthLabel={
                  hour === null
                    ? `${yy}. ${mm}. ${dd} · 시간 미상`
                    : `${yy}. ${mm}. ${dd} · ${BRANCHES_KO[hour!]}시생`
                }
              />
            </View>
          )}
        </ScrollView>

        <View style={s.foot}>
          <View style={s.dots}>
            {[1, 2, 3, 4].map((n) => (
              <View key={n} style={[s.dot, step === n && s.dotOn]} />
            ))}
          </View>
          {step === 1 && <Btn label="전화번호로 시작하기" onPress={() => setStep(2)} />}
          {step === 2 && <Btn label="다음" disabled={!birthValid} onPress={() => setStep(3)} />}
          {step === 3 && <Btn label="다음" disabled={hour === undefined} onPress={() => setStep(4)} />}
          {step === 4 && <Btn label="잘 맞는 인연 보러 가기" onPress={finish} />}
          {step === 1 && <Text style={s.footNote}>PASS 본인인증으로 생년월일이 자동 등록돼요</Text>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, padding: 24, paddingBottom: 8 },
  mid: { flex: 1, justifyContent: 'center' },
  logo: { fontFamily: F.serifBold, fontSize: 52, color: C.ink },
  logoSub: { fontFamily: F.serif, fontSize: 17, color: C.accent, marginTop: 6 },
  tag: { fontSize: 16, color: C.muted, lineHeight: 28, marginTop: 20 },
  proof: { fontSize: 13.5, color: C.accentDeep, fontWeight: '700', marginTop: 24 },
  h: { fontFamily: F.serif, fontSize: 25, color: C.ink, lineHeight: 37, marginTop: 8, marginBottom: 8 },
  sub: { fontSize: 14, color: C.muted, lineHeight: 23, marginBottom: 18 },
  passbox: { backgroundColor: C.goodSoft, borderWidth: 1, borderColor: '#CBE0D1', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 14 },
  passTxt: { color: C.good, fontSize: 13.5, fontWeight: '700' },
  field: { fontSize: 12.5, fontWeight: '700', color: C.muted, marginTop: 16, marginBottom: 7 },
  input: {
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line2, borderRadius: 11,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15.5, color: C.ink,
  },
  err: { color: C.accentDeep, fontSize: 12.5, marginTop: 8 },
  genBtn: { flex: 1, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line2, borderRadius: 11, paddingVertical: 12, alignItems: 'center' },
  genSel: { borderColor: C.accent, backgroundColor: C.accentSoft },
  genTxt: { fontWeight: '700', color: C.ink, fontSize: 14.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tg: { width: '31%', flexGrow: 1, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line2, borderRadius: 11, paddingVertical: 10, alignItems: 'center' },
  tgWide: { width: '100%' },
  tgSel: { borderColor: C.accent, backgroundColor: C.accentSoft },
  tgB: { fontWeight: '700', fontSize: 14, color: C.ink },
  tgS: { fontSize: 10.5, color: C.faint, marginTop: 2 },
  foot: { padding: 24, paddingTop: 10 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.line2 },
  dotOn: { width: 20, backgroundColor: C.accent },
  footNote: { textAlign: 'center', fontSize: 12, color: C.faint, marginTop: 12 },
});
