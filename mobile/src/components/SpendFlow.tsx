// 과금 확인 플로우 — 모든 엽전 소모는 2단 확인(가격 명시 → 확정)을 거친다.
// 잔액 부족 시 스토어 유도. 사용:
//   const { requestSpend, spendUI } = useSpend();
//   requestSpend({ cost, title, desc, okLabel, onOk });  … {spendUI}

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useApp } from '../lib/store';
import { Btn } from './ui';
import { Sheet, SheetDesc, SheetTitle } from './Sheet';
import { StoreSheet } from './StoreSheet';

export interface SpendReq {
  cost: number;
  reason: string; // 서버 원장 사유 (signal / detail / extra_deck / unblur / weekly)
  ref?: string;
  title: string;
  desc: string;
  okLabel: string;
  onOk: () => void;
}

export function useSpend() {
  const spend = useApp((st) => st.spend);
  const coins = useApp((st) => st.coins);
  const [pending, setPending] = useState<SpendReq | null>(null);
  const [shortBy, setShortBy] = useState<number | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);

  const requestSpend = (req: SpendReq) => {
    if (coins < req.cost) setShortBy(req.cost);
    else setPending(req);
  };

  const spendUI = (
    <>
      <Sheet visible={pending !== null} onClose={() => setPending(null)}>
        {pending && (
          <>
            <SheetTitle>{pending.title}</SheetTitle>
            <SheetDesc>{pending.desc}</SheetDesc>
            <View style={s.row2}>
              <Btn label="다음에" kind="ghost" style={{ flex: 1 }} onPress={() => setPending(null)} />
              <Btn
                label={pending.okLabel}
                cost={pending.cost}
                style={{ flex: 1 }}
                onPress={async () => {
                  const req = pending;
                  setPending(null);
                  if (req && (await spend(req.cost, req.reason, req.ref))) req.onOk();
                }}
              />
            </View>
          </>
        )}
      </Sheet>
      <Sheet visible={shortBy !== null} onClose={() => setShortBy(null)}>
        <SheetTitle>엽전이 부족해요</SheetTitle>
        <SheetDesc>
          보유 {coins.toLocaleString()}개 · 필요 {shortBy ?? 0}개.{'\n'}오늘의 운세를 확인하면 매일 5개를 모을 수 있어요.
        </SheetDesc>
        <Btn label="스토어에서 충전하기" onPress={() => { setShortBy(null); setStoreOpen(true); }} />
      </Sheet>
      <StoreSheet visible={storeOpen} onClose={() => setStoreOpen(false)} />
    </>
  );

  return { requestSpend, spendUI };
}

const s = StyleSheet.create({
  row2: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
