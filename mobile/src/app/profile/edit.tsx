// 내 프로필 편집 — 직업·소개·자기소개·키·지역·관계 목표·음주·흡연·MBTI·관심사·연분 문답

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Btn } from '../../components/ui';
import { Answer, completeness, DRINKS, GOALS, INTEREST_TAGS, MAX_TAGS, MBTIS, PROMPTS, SMOKES } from '../../lib/profile';
import { useApp } from '../../lib/store';
import { C, R } from '../../lib/theme';

export default function ProfileEdit() {
  const user = useApp((st) => st.user);
  const saveProfile = useApp((st) => st.saveProfile);
  const showToast = useApp((st) => st.showToast);
  const p = user?.profile ?? {};
  const [job, setJob] = useState(p.job ?? '');
  const [intro, setIntro] = useState(p.intro ?? '');
  const [bio, setBio] = useState(p.bio ?? '');
  const [height, setHeight] = useState(p.heightCm ? String(p.heightCm) : '');
  const [region, setRegion] = useState(p.region ?? '');
  const [goal, setGoal] = useState(p.goal ?? '');
  const [drink, setDrink] = useState(p.drink ?? '');
  const [smoke, setSmoke] = useState(p.smoke ?? '');
  const [mbti, setMbti] = useState(p.mbti ?? '');
  const [tags, setTags] = useState<string[]>(p.tags ?? []);
  const [answers, setAnswers] = useState<Answer[]>(PROMPTS.map((q) => ({ q, a: p.answers?.find((x) => x.q === q)?.a ?? '' })));
  const [saving, setSaving] = useState(false);
  if (!user) return null;

  const draft = { job, intro, bio, heightCm: height ? Number(height) : null, region, goal, drink, smoke, mbti, tags, answers, photoUrl: user.photoUrl };
  const pct = completeness(draft);
  const heightOk = !height || (Number(height) >= 130 && Number(height) <= 220);

  const save = async () => {
    if (!heightOk) { showToast('키는 130~220cm 사이로 입력해 주세요'); return; }
    setSaving(true);
    const ok = await saveProfile({
      job: job.trim(), intro: intro.trim(), bio: bio.trim(), heightCm: height ? Number(height) : null, region: region.trim(),
      goal: goal || undefined, drink: drink || undefined, smoke: smoke || undefined, mbti: mbti || undefined, tags,
      answers: answers.filter((a) => a.a.trim()).map((a) => ({ q: a.q, a: a.a.trim() })),
    });
    setSaving(false);
    showToast(ok ? '프로필을 저장했어요 — 상대에게 이렇게 보여요' : '저장은 됐지만 서버 동기화에 실패했어요. 잠시 후 다시 저장해 주세요');
    router.back();
  };
  const toggleTag = (t: string) => setTags((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : cur.length >= MAX_TAGS ? (showToast(`관심사는 최대 ${MAX_TAGS}개까지 골라요`), cur) : [...cur, t]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        <Text style={s.topTitle}>내 프로필</Text>
        <Text style={s.pct}>완성도 {pct}%</Text>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          <View style={s.track}><View style={[s.fill, { width: `${pct}%` }]} /></View>
          <Text style={s.hint}>프로필이 채워질수록 상대가 신호를 보낼 이유가 늘어요. 사진은 서로 마음이 통한 뒤에 공개되니, 글이 곧 첫인상이에요.</Text>

          <Field label="직업" hint="예: 마케터, 간호사, 대학원생">
            <TextInput style={s.input} value={job} onChangeText={setJob} placeholder="어떤 일을 하시나요" placeholderTextColor={C.faint} maxLength={20} />
          </Field>
          <Field label="한 줄 소개" hint="카드에 크게 보이는 문장 · 60자">
            <TextInput style={s.input} value={intro} onChangeText={setIntro} placeholder="예: 꽃처럼 계절마다 다른 사람이고 싶어요" placeholderTextColor={C.faint} maxLength={60} />
          </Field>
          <Field label="자기소개" hint={`${bio.length}/400 · 30자 이상이면 완성도에 반영돼요`}>
            <TextInput style={[s.input, s.multi]} value={bio} onChangeText={setBio} multiline placeholder="평일과 주말을 어떻게 보내는지, 어떤 사람과 어떤 시간을 보내고 싶은지 편하게 적어 주세요." placeholderTextColor={C.faint} maxLength={400} />
          </Field>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Field label="키 (cm)">
                <TextInput style={[s.input, !heightOk && s.inputErr]} value={height} onChangeText={(t) => setHeight(t.replace(/[^0-9]/g, '').slice(0, 3))} placeholder="170" placeholderTextColor={C.faint} keyboardType="number-pad" />
              </Field>
            </View>
            <View style={{ flex: 1.4 }}>
              <Field label="지역" hint="시·구 정도">
                <TextInput style={s.input} value={region} onChangeText={setRegion} placeholder="예: 수원 영통" placeholderTextColor={C.faint} maxLength={20} />
              </Field>
            </View>
          </View>

          <Field label="바라는 관계">
            <Chips options={GOALS} value={goal} onChange={setGoal} />
          </Field>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="음주"><Chips options={DRINKS} value={drink} onChange={setDrink} small /></Field></View>
            <View style={{ flex: 1 }}><Field label="흡연"><Chips options={SMOKES} value={smoke} onChange={setSmoke} small /></Field></View>
          </View>
          <Field label="MBTI" hint="선택">
            <Chips options={MBTIS} value={mbti} onChange={setMbti} small />
          </Field>

          <Field label={`관심사 · ${tags.length}/${MAX_TAGS}`} hint="3개 이상 고르면 완성도에 반영돼요">
            <View style={s.chips}>
              {INTEREST_TAGS.map((t) => {
                const on = tags.includes(t);
                return (
                  <Pressable key={t} onPress={() => toggleTag(t)} style={[s.chip, on && s.chipOn]}>
                    <Text style={[s.chipTxt, on && s.chipTxtOn]}>{t}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Text style={[s.label, { marginTop: 22 }]}>연분 문답</Text>
          <Text style={s.hint}>세 가지 질문에 한두 문장으로. 사주 카드 아래에 그대로 보여요.</Text>
          {answers.map((a, i) => (
            <View key={a.q} style={s.qaBox}>
              <Text style={s.q}>{a.q}</Text>
              <TextInput
                style={[s.input, { marginTop: 8 }]} value={a.a} maxLength={80}
                onChangeText={(t) => setAnswers((cur) => cur.map((x, j) => (j === i ? { ...x, a: t } : x)))}
                placeholder="한두 문장으로" placeholderTextColor={C.faint}
              />
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={s.cta}>
        <Btn label={saving ? '저장 중…' : '저장하기'} disabled={saving} onPress={save} />
      </View>
    </SafeAreaView>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={s.label}>{label}</Text>
      {children}
      {hint ? <Text style={s.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function Chips({ options, value, onChange, small }: { options: readonly string[]; value: string; onChange: (v: string) => void; small?: boolean }) {
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const on = value === o;
        return (
          <Pressable key={o} onPress={() => onChange(on ? '' : o)} style={[s.chip, small && s.chipSmall, on && s.chipOn]}>
            <Text style={[s.chipTxt, small && { fontSize: 12.5 }, on && s.chipTxtOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.card },
  topTitle: { flex: 1, fontSize: 15.5, fontWeight: '700', color: C.ink },
  pct: { fontSize: 12.5, fontWeight: '700', color: C.accentDeep, fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, backgroundColor: C.line, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
  hint: { fontSize: 12.5, color: C.muted, lineHeight: 19, marginTop: 10 },
  label: { fontSize: 12.5, fontWeight: '700', color: C.muted, marginBottom: 7 },
  fieldHint: { fontSize: 11.5, color: C.faint, marginTop: 6 },
  input: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line2, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: C.ink, minWidth: 0 },
  inputErr: { borderColor: C.accent },
  multi: { minHeight: 110, textAlignVertical: 'top', lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: C.line2, backgroundColor: C.card },
  chipSmall: { paddingHorizontal: 11, paddingVertical: 7 },
  chipOn: { borderColor: C.accent, backgroundColor: C.accentSoft },
  chipTxt: { fontSize: 13.5, color: C.ink, fontWeight: '600' },
  chipTxtOn: { color: C.accentDeep },
  qaBox: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 14, marginTop: 10 },
  q: { fontSize: 13, fontWeight: '700', color: C.accentDeep },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, paddingBottom: 22, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line },
});
