// 피드 — 사주·연애 커뮤니티. 카테고리 필터, 좋아요, 글쓰기.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Header } from '../../components/Header';
import { Sheet, SheetTitle } from '../../components/Sheet';
import { Btn } from '../../components/ui';
import { profileById, useApp } from '../../lib/store';
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
          <Pressable key={p.id} style={({ pressed }) => [s.post, pressed && { opacity: 0.85 }]} onPress={() => router.push({ pathname: '/post/[id]', params: { id: p.id } })}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <Text style={[s.cat, p.cat === '셀소' && { color: C.accentDeep }]}>{p.cat}</Text>
              {p.mine && <Text style={s.mine}>내 글</Text>}
              <Text style={s.who}>{p.anonymous === false && p.authorName ? p.authorName : '익명'}</Text>
            </View>
            <Text style={s.title}>{p.title}</Text>
            <Text style={s.body} numberOfLines={3}>{p.body}</Text>
            {p.cat === '셀소' && p.authorHandle && (
              <View style={s.authorRow}>
                <Avatar colors={profileById(p.authorHandle).colors} initial={(p.authorName ?? '?')[0]} size={28} photoUrl={profileById(p.authorHandle).photoUrl} blurred={!!profileById(p.authorHandle).photoUrl} />
                <Text style={s.authorTxt}>{p.authorName} · {profileById(p.authorHandle).job || '프로필 보기'}</Text>
                <Text style={s.authorCta}>프로필·궁합 · 좋아요 ›</Text>
              </View>
            )}
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
          </Pressable>
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
        <Text style={s.writeNote}>{wCat === '셀소' ? '셀소는 닉네임과 프로필이 공개돼요. 상대가 좋아요를 누르면 관심함에 도착하고, 연결하면 채팅이 열려요.' : '익명으로 등록돼요. 닉네임·프로필은 보이지 않아요.'}</Text>
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
  who: { fontSize: 11.5, color: C.faint, marginLeft: 'auto' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  authorTxt: { flex: 1, fontSize: 12.5, color: C.ink, fontWeight: '600' },
  authorCta: { fontSize: 12, color: C.accentDeep, fontWeight: '700' },
  writeNote: { fontSize: 12.5, color: C.muted, lineHeight: 18, marginBottom: 10 },
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
