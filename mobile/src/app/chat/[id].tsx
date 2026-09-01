// 채팅 — 서버 매칭이 있으면 실시간(Realtime) 렌더링, 없으면 로컬 데모 대화.
// 봇 답장은 DB 트리거가 생성하고 실시간 구독으로 도착한다.

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Btn, Chip } from '../../components/ui';
import {
  fetchServerMessages, revealFace, RevealState, revealState, ServerMsg, serverSendMessage, subscribeMessages,
} from '../../lib/server';
import { ChatMsg, compatWith, profileById, useApp } from '../../lib/store';
import { C, R } from '../../lib/theme';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useApp((st) => st.user);
  const chats = useApp((st) => st.chats);
  const serverMode = useApp((st) => st.serverMode);
  const sendMessage = useApp((st) => st.sendMessage);
  const receiveReply = useApp((st) => st.receiveReply);
  const showToast = useApp((st) => st.showToast);
  const [text, setText] = useState('');
  const [srvMsgs, setSrvMsgs] = useState<ServerMsg[] | null>(null);
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const listRef = useRef<FlatList<ChatMsg | ServerMsg>>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingEcho = useRef<string[]>([]); // 낙관적 표시한 내 메시지 (실시간 에코 중복 방지)

  useEffect(() => {
    if (!serverMode || !id) return;
    let alive = true;
    let cleanup: (() => void) | null = null;
    const key = (m: ServerMsg) => `${m.ts}|${m.from}|${m.text}`;
    (async () => {
      // 구독을 먼저 열고(조인 대기) 과거 메시지를 채운다 — 사이에 도착한 메시지는 중복 제거로 합쳐짐
      cleanup = await subscribeMessages(id, (m) => {
        if (m.from === 'me') {
          const i = pendingEcho.current.indexOf(m.text);
          if (i >= 0) { pendingEcho.current.splice(i, 1); return; }
        }
        setSrvMsgs((cur) => (cur ?? []).some((x) => key(x) === key(m)) ? cur : [...(cur ?? []), m]);
      });
      void revealState(id).then((r) => { if (alive) setReveal(r); });
      const init = await fetchServerMessages(id);
      if (!alive) { cleanup?.(); return; }
      if (init) {
        setSrvMsgs((cur) => {
          const seen = new Set(init.map(key));
          return [...init, ...(cur ?? []).filter((m) => !seen.has(key(m)))];
        });
      }
    })();
    return () => { alive = false; cleanup?.(); };
  }, [id, serverMode]);

  useEffect(() => () => { if (replyTimer.current) clearTimeout(replyTimer.current); }, []);

  if (!id || !user) return null;
  const p = profileById(id);
  const c = compatWith(user, id);
  const live = serverMode && srvMsgs !== null;
  const msgs: (ChatMsg | ServerMsg)[] = live ? srvMsgs! : (chats[id] ?? []);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    if (live) {
      pendingEcho.current.push(t);
      setSrvMsgs((cur) => [...(cur ?? []), { from: 'me', text: t, ts: Date.now() }]);
      void serverSendMessage(id, t);
      return;
    }
    sendMessage(id, t);
    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => receiveReply(id), 1400);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Avatar
          colors={p.colors} initial={p.name[0]} size={36} photoUrl={p.photoUrl}
          blurred={!!p.photoUrl && !(reveal?.revealed ?? false)}
        />
        <View style={{ flex: 1 }}>
          <Text style={s.nm}>{p.name}</Text>
          <Text style={s.sub}>{p.job}{live ? ' · 실시간' : ''}{reveal?.revealed ? ' · 얼굴 공개됨' : ''}</Text>
        </View>
        <Chip label={`궁합 ${c.total}`} tone="good" />
      </View>

      {live && reveal && !reveal.revealed && (
        <View style={s.revealBar}>
          <Text style={s.revealTxt}>
            {reveal.mine ? '내 공개 완료 — 상대의 수락을 기다리는 중이에요' : '사주로 이어진 인연 — 서로 동의하면 얼굴이 공개돼요'}
          </Text>
          {!reveal.mine && (
            <Btn
              label="얼굴 공개하기" small
              onPress={async () => {
                const r = await revealFace(id);
                if (!r) { showToast('잠시 후 다시 시도해 주세요'); return; }
                setReveal(r);
                showToast(r.revealed ? '서로 얼굴이 공개됐어요! 🎉' : '공개 완료 — 상대가 수락하면 서로 보여요');
              }}
            />
          )}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m, i) => `${m.ts}-${i}`}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <View style={s.matchNote}>
              <Text style={s.matchTxt}>🪢 {c.headline}</Text>
              <Text style={s.matchSub}>궁합 {c.total}점으로 이어진 인연이에요</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.bubble, item.from === 'me' ? s.mine : s.theirs]}>
              <Text style={[s.bubbleTxt, item.from === 'me' && { color: '#fff' }]}>{item.text}</Text>
            </View>
          )}
        />
        <View style={s.inputRow}>
          <TextInput
            style={s.input} value={text} onChangeText={setText}
            placeholder="메시지 보내기" placeholderTextColor={C.faint}
            onSubmitEditing={send} returnKeyType="send" multiline
          />
          <Pressable accessibilityLabel="보내기" style={[s.send, !text.trim() && { opacity: 0.4 }]} onPress={send} disabled={!text.trim()}>
            <Ionicons name="arrow-up" size={19} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  top: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.card,
  },
  nm: { fontSize: 15.5, fontWeight: '700', color: C.ink },
  sub: { fontSize: 11.5, color: C.muted },
  revealBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: C.accentSoft, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  revealTxt: { flex: 1, fontSize: 12.5, color: C.accentDeep, fontWeight: '600', lineHeight: 18 },
  matchNote: { alignItems: 'center', marginBottom: 14, backgroundColor: C.accentSoft, borderRadius: R.md, padding: 12 },
  matchTxt: { fontSize: 13, fontWeight: '600', color: C.accentDeep, textAlign: 'center' },
  matchSub: { fontSize: 11.5, color: C.muted, marginTop: 3 },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: C.accent, borderBottomRightRadius: 5 },
  theirs: { alignSelf: 'flex-start', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderBottomLeftRadius: 5 },
  bubbleTxt: { fontSize: 14.5, lineHeight: 21, color: C.ink },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.card },
  input: {
    flex: 1, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.line2, borderRadius: 20,
    paddingHorizontal: 15, paddingVertical: 9, fontSize: 14.5, color: C.ink, maxHeight: 100,
  },
  send: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
});
