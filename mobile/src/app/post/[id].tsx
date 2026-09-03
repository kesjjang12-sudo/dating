// 커뮤니티 글 상세 — 셀소는 작성자 프로필·궁합 열람과 좋아요(무료 신호), 그 외는 익명 글

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { ProfileInfo } from '../../components/ProfileInfo';
import { ReportSheet } from '../../components/ReportSheet';
import { Btn, Chip } from '../../components/ui';
import { addComment, fetchComments, getMyHandle, PostComment, postServerId } from '../../lib/server';
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
  const serverMode = useApp((st) => st.serverMode);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const canComment = !!post && postServerId(post.id) !== null && serverMode;
  const load = useCallback(() => { if (post) void fetchComments(post.id).then(setComments); }, [post?.id]);
  useEffect(() => { load(); }, [load]);
  if (!post || !user) return null;
  const selsoPost = post.cat === '셀소';
  const submit = async () => {
    const t = draft.trim(); if (!t || sending) return;
    setSending(true);
    const ok = await addComment(post.id, t, !selsoPost);
    setSending(false);
    if (!ok) { showToast('댓글을 남기지 못했어요 — 잠시 후 다시 시도해 주세요'); return; }
    setDraft(''); load();
  };

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
        {!post.mine && postServerId(post.id) !== null && <Pressable onPress={() => setReportOpen(true)} hitSlop={10} accessibilityLabel="글 신고"><Ionicons name="ellipsis-horizontal" size={22} color={C.muted} /></Pressable>}
      </View>
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} postId={post.id} targetHandle={selso && author ? author.id : undefined} targetName={author?.name} />
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

        <View style={s.cmHead}>
          <Text style={s.cmTitle}>댓글 {comments.length || post.comments}</Text>
          <Text style={s.cmRule}>{selsoPost ? '셀소 글의 댓글은 닉네임이 보여요' : '댓글은 익명으로 달려요 (글마다 익명 번호)'}</Text>
        </View>
        {comments.length === 0 && <Text style={s.cmEmpty}>{canComment ? '첫 댓글을 남겨 보세요' : '이 글에는 댓글을 달 수 없어요'}</Text>}
        {comments.map((cm) => (
          <View key={cm.id} style={s.cm}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {cm.authorHandle ? (
                <Pressable onPress={() => router.push({ pathname: '/compat/[id]', params: { id: cm.authorHandle! } })}><Text style={[s.cmWho, { color: C.accentDeep }]}>{cm.authorName}</Text></Pressable>
              ) : <Text style={s.cmWho}>익명{cm.anonNo ?? ''}</Text>}
              {cm.mine && <Text style={s.cmMine}>나</Text>}
              {selsoPost && post.authorHandle && cm.authorHandle === post.authorHandle && <Text style={s.cmMine}>작성자</Text>}
            </View>
            <Text style={s.cmBody}>{cm.body}</Text>
          </View>
        ))}
      </ScrollView>

      {canComment && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.cmInputRow}>
            <TextInput style={s.cmInput} value={draft} onChangeText={setDraft} placeholder={selsoPost ? `${user.name}(으)로 댓글 남기기` : '익명으로 댓글 남기기'} placeholderTextColor={C.faint} maxLength={500} multiline onSubmitEditing={submit} />
            <Pressable accessibilityLabel="댓글 등록" style={[s.cmSend, (!draft.trim() || sending) && { opacity: 0.4 }]} onPress={submit} disabled={!draft.trim() || sending}>
              <Ionicons name="arrow-up" size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {selso && author && !isMine && (
        <View style={[s.cta, canComment && { position: 'relative' }]}>
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
  cmHead: { marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.line },
  cmTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  cmRule: { fontSize: 12, color: C.faint, marginTop: 3 },
  cmEmpty: { fontSize: 13, color: C.faint, marginTop: 12 },
  cm: { marginTop: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: 12 },
  cmWho: { fontSize: 12.5, fontWeight: '700', color: C.muted },
  cmMine: { fontSize: 10.5, fontWeight: '700', color: C.accentDeep, backgroundColor: C.accentSoft, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden' },
  cmBody: { fontSize: 14, color: C.ink, lineHeight: 21, marginTop: 5 },
  cmInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.card },
  cmInput: { flex: 1, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.line2, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 9, fontSize: 14, color: C.ink, maxHeight: 100, minWidth: 0 },
  cmSend: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  cta: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14, paddingBottom: 22, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line },
});
