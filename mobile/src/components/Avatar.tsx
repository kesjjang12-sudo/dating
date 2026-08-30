// 그라디언트 아바타 — 실서비스에서는 프로필 사진, 프로토타입은 색+이니셜

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { F } from '../lib/theme';

export function Avatar({
  colors, initial, size = 56, blurred,
}: { colors: [string, string]; initial: string; size?: number; blurred?: boolean }) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Text style={{ fontFamily: F.serif, fontSize: size * 0.42, color: 'rgba(255,255,255,0.9)', opacity: blurred ? 0.25 : 1 }}>
        {initial}
      </Text>
      {blurred && (
        <View style={s.veil}>
          <Text style={{ fontFamily: F.serif, fontSize: size * 0.4, color: '#fff' }}>?</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  veil: { ...StyleSheet.absoluteFill as object, backgroundColor: 'rgba(30,12,18,0.45)', alignItems: 'center', justifyContent: 'center' },
});
