// 피드 — 사주·연애 커뮤니티. 카테고리 필터, 좋아요, 글쓰기.

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { Sheet, SheetTitle } from '../../components/Sheet';
import { Btn } from '../../components/ui';
import { useApp } from '../../lib/store';
import { C, R } from '../../lib/theme';

const CATS = ['전체', '고민상담', '사주풀이', '자유', '셀소'];

export default function Feed() {
  const posts = useApp((st) => st.posts);
  const toggleLike = useApp((st) => st.toggleLike);
  const addPost = useApp((st) => st.addPost);
  const showToast = useApp((st) => st.showToast);

  const [cat, setCat] = useState('전체');
  const [writing, setWriting] = useState(false);
  const [wCat, setWCat] = useState('고민상담');
  const [wTitle, setWTitle] = useState('');
  const [wBody, setWBody] = useState('');

  const shown = useMemo(() => (cat === '전체' ? posts : posts.filter((p) => p.cat === cat)), [posts, cat]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <Header title="피드" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.chips}>
        {CATS.map((c) => (
          <Pressable key={c} style={[s.chip, cat === c && s.chipOn]} onPress={() => setCat(c)}>
            <Text style={[s.chipTxt, cat === c && { color: C.bg }]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 90, paddingTop: 4 }}>
        {shown.map((p) => (
          <View key={p.id} style={s.post}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Text style={s.cat}>{p.cat}</Text>
              {p.mine && <Text style={s.mine}>내 글</Text>}
            </View>
            <Text style={s.title}>{p.title}</Text>
            <Text style={s.body}>{p.body}</Text>
            <View style={s.meta}>
              <Pressable onPress={() => toggleLike(p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={p.liked ? 'thumbs-up' : 'thumbs-up-outline'} size={14} color={p.liked ? C.accent : C.faint} />
                <Text style={[s.metaTxt, p.liked && { color: C.accent }]}>{p.likes}</Text>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="chatbubble-outline" size={13} color={C.faint} />
                <Text style={s.metaTxt}>{p.comments}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="eye-outline" size={14} color={C.faint} />
                <Text style={s.metaTxt}>{p.views}</Text>
              </View>
              <Text style={[s.metaTxt, { marginLeft: 'auto' }]}>{p.timeLabel}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable style={s.fab} onPress={() => setWriting(true)}>
        <Ionicons name="pencil" size={16} color="#fff" />
        <Text style={s.fabTxt}>글쓰기</Text>
      </Pressable>

      <Sheet visible={writing} onClose={() => setWriting(false)}>
        <SheetTitle>새 글 쓰기</SheetTitle>
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 12, flexWrap: 'wrap' }}>
          {CATS.slice(1).map((c) => (
            <Pressable key={c} style={[s.chip, wCat === c && s.chipOn]} onPress={() => setWCat(c)}>
              <Text style={[s.chipTxt, wCat === c && { color: C.bg }]}>{c}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput style={s.input} placeholder="제목" placeholderTextColor={C.faint} value={wTitle} onChangeText={setWTitle} maxLength={60} />
        <TextInput
          style={[s.input, { height: 110, textAlignVertical: 'top' }]} multiline
          placeholder="내용 (SNS 아이디 등 연락처 입력 시 이용이 제한될 수 있어요)"
          placeholderTextColor={C.faint} value={wBody} onChangeText={setWBody} maxLength={500}
        />
        <Btn
          label="등록하기" disabled={!wTitle.trim() || !wBody.trim()}
          onPress={() => {
            addPost(wCat, wTitle.trim(), wBody.trim());
            setWriting(false); setWTitle(''); setWBody(''); setCat('전체');
            showToast('글이 등록됐어요');
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  chips: { gap: 7, paddingHorizontal: 18, paddingBottom: 12 },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: C.line2, backgroundColor: C.card },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipTxt: { fontSize: 13, fontWeight: '600', color: C.muted },
  post: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 16, marginBottom: 10 },
  cat: { fontSize: 11.5, fontWeight: '700', color: C.indigo },
  mine: { fontSize: 11, fontWeight: '700', color: C.accentDeep, backgroundColor: C.accentSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 1, overflow: 'hidden' },
  title: { fontSize: 15.5, fontWeight: '700', color: C.ink, marginTop: 6, marginBottom: 4 },
  body: { fontSize: 13.5, color: C.muted, lineHeight: 21 },
  meta: { flexDirection: 'row', gap: 14, marginTop: 11, alignItems: 'center' },
  metaTxt: { fontSize: 12, color: C.faint, fontVariant: ['tabular-nums'] },
  fab: {
    position: 'absolute', right: 18, bottom: 18, backgroundColor: C.accent, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 18, paddingVertical: 13, elevation: 4,
  },
  fabTxt: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  input: {
    backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.line2, borderRadius: 11,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14.5, color: C.ink, marginBottom: 10,
  },
});
