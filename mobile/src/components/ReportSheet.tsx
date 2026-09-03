// 신고·차단 시트 — 상대 페이지·채팅·글 상세에서 공용

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { REPORT_REASONS, ReportReason, reportPost, reportUser } from '../lib/server';
import { useApp } from '../lib/store';
import { C, R } from '../lib/theme';
import { Sheet, SheetDesc, SheetTitle } from './Sheet';
import { Btn } from './ui';

export function ReportSheet({ visible, onClose, targetHandle, targetName, postId, onBlocked }: {
  visible: boolean; onClose: () => void; targetHandle?: string; targetName?: string; postId?: string; onBlocked?: () => void;
}) {
  const [mode, setMode] = useState<'menu' | 'report' | 'block'>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const showToast = useApp((st) => st.showToast);
  const block = useApp((st) => st.block);
  const serverMode = useApp((st) => st.serverMode);
  const close = () => { setMode('menu'); setReason(null); setDetail(''); onClose(); };

  const submitReport = async () => {
    if (!reason) return;
    setBusy(true);
    const ok = postId ? await reportPost(postId, reason, detail.trim()) : targetHandle ? await reportUser(targetHandle, reason, detail.trim()) : false;
    setBusy(false);
    showToast(ok ? '신고가 접수됐어요. 운영팀이 확인합니다.' : serverMode ? '신고를 보내지 못했어요 — 잠시 후 다시 시도해 주세요' : '신고는 계정 동기화 상태에서 가능해요');
    close();
  };
  const doBlock = async () => {
    if (!targetHandle) return;
    setBusy(true); await block(targetHandle); setBusy(false);
    showToast(`${targetName ?? '상대'}님을 차단했어요 — 서로의 화면에서 보이지 않아요`);
    close(); onBlocked?.();
  };

  return (
    <Sheet visible={visible} onClose={close}>
      {mode === 'menu' && (
        <>
          <SheetTitle>{postId ? '이 글' : `${targetName ?? '상대'}님`}에 대해</SheetTitle>
          <SheetDesc>신고 내용은 운영팀만 볼 수 있고, 상대에게 알려지지 않아요.</SheetDesc>
          <Btn label="신고하기" kind="ghost" onPress={() => setMode('report')} />
          {targetHandle && <><View style={{ height: 8 }} /><Btn label="차단하기" kind="ghost" onPress={() => setMode('block')} /></>}
        </>
      )}
      {mode === 'report' && (
        <>
          <SheetTitle>신고 사유</SheetTitle>
          <View style={{ gap: 7, marginBottom: 12 }}>
            {REPORT_REASONS.map((r) => (
              <Pressable key={r} style={[s.opt, reason === r && s.optOn]} onPress={() => setReason(r)}>
                <Text style={[s.optTxt, reason === r && { color: C.accentDeep }]}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput style={s.input} value={detail} onChangeText={setDetail} placeholder="상세 내용 (선택)" placeholderTextColor={C.faint} maxLength={500} multiline />
          <Btn label={busy ? '접수 중…' : '신고 접수'} disabled={!reason || busy} onPress={submitReport} />
        </>
      )}
      {mode === 'block' && (
        <>
          <SheetTitle>{targetName ?? '상대'}님을 차단할까요?</SheetTitle>
          <SheetDesc>서로의 추천·관심함·채팅에서 보이지 않게 되고, 신호와 메시지도 막혀요. 마이 탭 → 차단 목록에서 해제할 수 있어요.</SheetDesc>
          <Btn label={busy ? '처리 중…' : '차단하기'} disabled={busy} onPress={doBlock} />
          <View style={{ height: 8 }} />
          <Btn label="취소" kind="ghost" onPress={close} />
        </>
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  opt: { borderWidth: 1.5, borderColor: C.line2, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: C.card },
  optOn: { borderColor: C.accent, backgroundColor: C.accentSoft },
  optTxt: { fontSize: 14, fontWeight: '600', color: C.ink },
  input: { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.line2, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.ink, minHeight: 70, textAlignVertical: 'top', marginBottom: 12, minWidth: 0 },
});
