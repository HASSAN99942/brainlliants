import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';
import { contentApi, isLimitReached } from '../../src/features/content/api';
import { downloads } from '../../src/features/content/download';
import { useQuestionDetail, useToggleBookmark } from '../../src/features/content/hooks';
import { EXAM_LABEL, sizeLabel } from '../../src/features/content/labels';
import { isEnabled } from '../../src/core/config/features';

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: paper, isLoading } = useQuestionDetail(id);
  const toggle = useToggleBookmark();
  const [bookmarked, setBookmarked] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'locked'>(
    downloads.questionPath(id) ? 'done' : 'idle',
  );

  if (isLoading || !paper) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const isBookmarked = bookmarked ?? paper.is_bookmarked;
  const hasQuiz = paper.format === 'json' || paper.format === 'both';
  const hasPdf = !!paper.pdf_url || !!downloads.questionPath(id);
  const info = paper.download_info;

  const onBookmark = () => {
    setBookmarked(!isBookmarked);
    toggle.mutate({ type: 'question', id });
  };

  const onDownload = async () => {
    setStatus('downloading');
    try {
      const res = await contentApi.requestQuestionDownload(id);
      if (!res.pdf_url) { setStatus('idle'); return; }
      await downloads.saveQuestion(id, res.pdf_url, paper.title, paper);
      setStatus('done');
    } catch (e) {
      if (isLimitReached(e)) {
        setStatus('locked');
        // No paywall to send them to when payments are hidden — the locked
        // state below explains the cap on its own.
        if (isEnabled('payments')) router.push('/paywall');
      } else {
        setStatus('idle');
      }
    }
  };

  const viewPdf = () => {
    // Pass both: the viewer prefers the offline copy and falls back to the URL.
    router.push({
      pathname: '/content/pdf',
      params: { path: downloads.questionPath(id) ?? '', url: paper.pdf_url ?? '', title: paper.title },
    });
  };

  const startQuiz = () => {
    router.push({
      pathname: '/ai/quiz',
      params: { questions: JSON.stringify(paper.json_data?.questions ?? []), sessionId: '' },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.appTitle}>Paper details</Text>
        <Pressable onPress={onBookmark} hitSlop={10}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? Colors.action : Colors.primaryMid}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, lineHeight: 30 }}>{paper.title}</Text>

        <View style={styles.infoCard}>
          <Row label="Exam" value={EXAM_LABEL[paper.exam_type] ?? paper.exam_type} />
          <Row label="Subject" value={paper.subject} />
          <Row label="Year" value={`${paper.year ?? '—'}`} />
          <Row label="Specialty" value={paper.specialty || '—'} />
          <Row label="Language" value={paper.language === 'fr' ? 'French' : 'English'} />
          <Row label="File size" value={sizeLabel(paper.file_size_kb)} last />
        </View>

        {hasPdf ? (
          <Pressable onPress={viewPdf} style={styles.viewPdfBtn}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.primary, marginLeft: 8 }}>View PDF</Text>
          </Pressable>
        ) : null}

        {hasQuiz ? <AppButton label="Start Quiz" style={{ marginTop: 12 }} onPress={startQuiz} /> : null}

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          {status === 'done' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark" size={18} color={Colors.success} />
              <Text style={{ color: Colors.success, fontWeight: '500', marginLeft: 6 }}>Downloaded · Ready offline</Text>
            </View>
          ) : null}
          {status === 'downloading' ? (
            <>
              <ActivityIndicator color={Colors.action} />
              <Text style={{ color: Colors.textSecondary, fontSize: 13, marginTop: 8 }}>Downloading...</Text>
            </>
          ) : null}
          {status === 'locked' ? (
            <>
              <Text style={{ color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                {info.limit != null
                  ? `You have used all ${info.limit} free downloads for this exam type this month.`
                  : 'You have used your download quota for this exam type this month.'}
              </Text>
              {isEnabled('payments') ? (
                <AppButton label="Upgrade to Pro" onPress={() => router.push('/paywall')} style={{ width: 220 }} />
              ) : null}
            </>
          ) : null}
          {status === 'idle' && paper.pdf_url ? (
            <AppButton label="Download for offline" onPress={onDownload} style={{ width: '100%' }} />
          ) : null}
          {!info.is_pro && info.limit != null && status !== 'locked' ? (
            <Text style={{ color: Colors.textSecondary, fontSize: 12, marginTop: 10 }}>
              {info.used} of {info.limit} free downloads used this month
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && { borderBottomWidth: 0.5, borderBottomColor: Colors.inputBorder }]}>
      <Text style={{ fontSize: 15, color: Colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  appTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, marginTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  viewPdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, backgroundColor: Colors.primaryLight, marginTop: 16 },
});
