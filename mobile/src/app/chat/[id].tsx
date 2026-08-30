// 채팅 — 매칭된 인연과의 1:1 대화 (데모: 상대 자동 응답)

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Chip } from '../../components/ui';
import { ChatMsg, compatWith, profileById, useApp } from '../../lib/store';
import { C, R } from '../../lib/theme';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useApp((st) => st.user);
  const chats = useApp((st) => st.chats);
  const sendMessage = useApp((st) => st.sendMessage);
  const receiveReply = useApp((st) => st.receiveReply);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<ChatMsg>>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (replyTimer.current) clearTimeout(replyTimer.current); }, []);

  if (!id || !user) return null;
  const p = profileById(id);
  const c = compatWith(user, id);
  const msgs = chats[id] ?? [];

  const send = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(id, t);
    setText('');
    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => receiveReply(id), 1400);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={C.ink} />
        </Pressable>
        <Avatar colors={p.colors} initial={p.name[0]} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={s.nm}>{p.name}</Text>
          <Text style={s.sub}>{p.job} · {p.distKm}km</Text>
        </View>
        <Chip label={`궁합 ${c.total}`} tone="good" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => String(m.ts) + m.from}
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
