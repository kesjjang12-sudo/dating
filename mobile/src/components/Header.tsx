// 화면 상단 헤더 — 브랜드/타이틀 + 엽전 잔액(누르면 스토어)

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, F } from '../lib/theme';
import { CoinPill } from './CoinPill';
import { StoreSheet } from './StoreSheet';

export function Header({ title }: { title?: string }) {
  const [storeOpen, setStoreOpen] = useState(false);
  return (
    <View style={s.bar}>
      {title ? (
        <Text style={s.title}>{title}</Text>
      ) : (
        <Text style={s.brand}>
          연분<Text style={s.hanja}> 緣分</Text>
        </Text>
      )}
      <CoinPill onPress={() => setStoreOpen(true)} />
      <StoreSheet visible={storeOpen} onClose={() => setStoreOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 },
  brand: { fontFamily: F.serifBold, fontSize: 22, color: C.ink },
  hanja: { fontFamily: F.serif, fontSize: 13, color: C.accent },
  title: { fontSize: 17, fontWeight: '700', color: C.ink },
});
