// 커뮤니티 글 상세 — 셀소는 작성자 프로필·궁합 열람과 좋아요(무료 신호), 그 외는 익명 글

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { ProfileInfo } from '../../components/ProfileInfo';
import { Btn, Chip } from '../../components/ui';
import { getMyHandle } from '../../lib/server';
import { compatWith, profileById, useApp } from '../../lib/store';
import { C, F, R } from '../../lib/theme';

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const post = useApp((st) => st.posts.find((p) => p.id === id));
  const user = useApp((st) => st.user);
  const toggleLike = useApp((st) => st.toggleLike);
  const likeSelso = useApp((st) => st.likeSelso);
  const sentSignals = useApp((st) => st.sentSignals);
  const matches = useApp((st) => st.matches);
  const showToast = useApp((st) => st.showToast);
  if (!post || !user) return null;

  const selso = post.cat === '셀소' && !!post.authorHandle;
  const author = selso ? profileById(post.authorHandle!) : null;
  const isMine = post.mine || (author && author.id === getMyHandle());
  const c = author ? compatWith(user, author.id) : null;
  const liked = author ? !!sentSignals[author.id] : false;
  const matched = author ? matches.includes(author.id) : false;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="chevron-back" size={24} color={C.ink} /></Pressable>
        <Text style={s.topTitle}>{post.cat}</Text>
        <Text style={s.who}>{post.anonymous === false && post.authorName ? post.authorName : '익명'}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={s.title}>{post.title}</Text>
        <Text style={s.time}>{post.timeLabel} · 조회 {post.views}</Text>
        <Text style={s.body}>{post.body}</Text>
        <View style={s.meta}>
          <Pressable onPress={() => toggleLike(post.id)} style={s.metaBtn}>
            <Ionicons name={post.liked ? 'thumbs-up' : 'thumbs-up-outline'} size={16} color={post.liked ? C.accent : C.muted} />
            <Text style={[s.metaTxt, post.liked && { color: C.accent }]}>공감 {post.likes}</Text>
          </Pressable>
        </View>

        {selso && author && c && (
          <View style={s.authorBox}>
            <Text style={s.lab}>이 글을 쓴 사람</Text>
            <Pressable style={s.authorHead} onPress={() => router.push({ pathname: '/compat/[id]', params: { id: author.id } })}>
              <Avatar colors={author.colors} initial={author.name[0]} size={52} photoUrl={author.photoUrl} blurred={!!author.photoUrl} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.authorName}>{author.name}</Text>
                  <Chip label={`궁합 ${c.total}`} tone="good" />
                </View>
                <Text style={s.authorSub}>{author.job || '직업 미입력'}{author.region ? ` · ${author.region}` : ''}</Text>
                <Text style={s.authorCta}>프로필 · 사주 궁합 보기 ›</Text>
              </View>
            </Pressable>
            <View style={{ marginTop: 12 }}><ProfileInfo p={author} compact /></View>
            <Text style={s.compatLine}>🪢 {c.headline}</Text>
          </View>
        )}
        {post.cat === '셀소' && !post.authorHandle && (
          <Text style={s.note}>이 셀소 글은 작성자 정보가 없어 좋아요를 보낼 수 없어요.</Text>
        )}
      </ScrollView>

      {selso && author && !isMine && (
        <View style={s.cta}>
          {matched
            ? <Btn label="채팅 열기" onPress={() => router.push({ pathname: '/chat/[id]', params: { id: author.id } })} />
            : liked
              ? <Btn label="좋아요를 보냈어요 — 상대가 연결하면 채팅이 열려요" kind="ghost" disabled />
              : <Btn label={`${author.name}님에게 좋아요 보내기`} onPress={() => {
                  const ok = likeSelso(author.id);
                  showToast(ok ? `${author.name}님에게 좋아요를 보냈어요 — 관심함에 도착해요` : '이미 좋아요를 보냈어요');
                }} />}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.card },
  topTitle: { flex: 1, fontSize: 15.5, fontWeight: '700', color: C.indigo },
  who: { fontSize: 12.5, color: C.muted },
  title: { fontFamily: F.serif, fontSize: 21, color: C.ink, lineHeight: 30 },
  time: { fontSize: 12, color: C.faint, marginTop: 6 },
  body: { fontSize: 15, color: C.ink, lineHeight: 25, marginTop: 16 },
  meta: { flexDirection: 'row', gap: 14, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.line },
  metaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt: { fontSize: 13, color: C.muted, fontWeight: '600' },
  authorBox: { marginTop: 24, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.lg, padding: 16 },
  lab: { fontSize: 11.5, fontWeight: '700', color: C.accentDeep, letterSpacing: 0.8, marginBottom: 10 },
  authorHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  authorName: { fontSize: 16, fontWeight: '700', color: C.ink },
  authorSub: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  authorCta: { fontSize: 12.5, color: C.accentDeep, fontWeight: '700', marginTop: 4 },
  compatLine: { fontSize: 13, color: C.accentDeep, fontWeight: '600', marginTop: 12, lineHeight: 19 },
  note: { fontSize: 13, color: C.faint, marginTop: 20, lineHeight: 20 },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, paddingBottom: 22, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line },
});
