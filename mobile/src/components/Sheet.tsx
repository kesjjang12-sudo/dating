// 바텀시트 — 모든 과금 확인·풀이·스토어가 이 위에서 열린다.

import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F } from '../lib/theme';

export function Sheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.grab} />
        <ScrollView bounces={false} style={{ flexGrow: 0 }}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <Text style={s.title}>{children}</Text>;
}
export function SheetDesc({ children }: { children: React.ReactNode }) {
  return <Text style={s.desc}>{children}</Text>;
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,10,8,0.42)' },
  sheet: {
    backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 22, paddingTop: 14, paddingBottom: 30, maxHeight: '82%',
  },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.line2, alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: F.serif, fontSize: 19, color: C.ink, marginBottom: 6 },
  desc: { fontSize: 14, color: C.muted, lineHeight: 23, marginBottom: 16 },
});
