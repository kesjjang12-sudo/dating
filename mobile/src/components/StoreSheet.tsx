// 스토어 시트 — 엽전 패키지. 데모에서는 결제 없이 즉시 충전된다.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PACKAGES } from '../lib/economy';
import { useApp } from '../lib/store';
import { C } from '../lib/theme';
import { Chip } from './ui';
import { Sheet, SheetDesc, SheetTitle } from './Sheet';

export function StoreSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const coins = useApp((st) => st.coins);
  const buyPack = useApp((st) => st.buyPack);
  const showToast = useApp((st) => st.showToast);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <SheetTitle>스토어</SheetTitle>
      <SheetDesc>보유 엽전 {coins.toLocaleString()}개 · 구매 7일 내 미사용분만 환불돼요</SheetDesc>
      {PACKAGES.map((p) => (
        <View key={p.coins} style={s.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={s.n}>엽전 {p.coins.toLocaleString()}</Text>
            {p.tag && <Chip label={p.tag} tone="acc" />}
          </View>
          <Pressable
            style={({ pressed }) => [s.buy, pressed && { opacity: 0.8 }]}
            onPress={() => {
              buyPack(p.coins);
              showToast(`엽전 ${p.coins.toLocaleString()}개 충전 완료 (데모 — 실제 결제 없음)`);
              onClose();
            }}
          >
            <Text style={s.buyTxt}>{p.price}</Text>
          </Pressable>
        </View>
      ))}
      <Text style={s.note}>데모 빌드: 결제 없이 즉시 충전됩니다. 실서비스에서는 IAP로 대체돼요.</Text>
    </Sheet>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  n: { fontSize: 15, fontWeight: '700', color: C.ink, fontVariant: ['tabular-nums'] },
  buy: { backgroundColor: C.ink, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 7 },
  buyTxt: { color: C.bg, fontWeight: '600', fontSize: 13.5, fontVariant: ['tabular-nums'] },
  note: { fontSize: 12, color: C.faint, marginTop: 14, lineHeight: 18 },
});
