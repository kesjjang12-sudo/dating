// 아바타 — 사진(Storage URL)이 있으면 사진, 없으면 그라디언트+이니셜

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { F } from '../lib/theme';

export function Avatar({
  colors, initial, size = 56, blurred, photoUrl,
}: { colors: [string, string]; initial: string; size?: number; blurred?: boolean; photoUrl?: string }) {
  const box = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' as const };
  if (photoUrl && !blurred) {
    return <Image source={{ uri: photoUrl }} style={box} contentFit="cover" transition={120} />;
  }
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[box, { alignItems: 'center', justifyContent: 'center' }]}>
      {photoUrl && blurred ? (
        <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill as object} contentFit="cover" blurRadius={16} />
      ) : (
        <Text style={{ fontFamily: F.serif, fontSize: size * 0.42, color: 'rgba(255,255,255,0.9)', opacity: blurred ? 0.25 : 1 }}>
          {initial}
        </Text>
      )}
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
