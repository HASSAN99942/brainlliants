import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { AppButton } from '../../src/shared/components/AppButton';
import { contentApi, isLimitReached } from '../../src/features/content/api';
import { downloads } from '../../src/features/content/download';
import { useQuestionDetail, useToggleBookmark } from '../../src/features/content/hooks';
import { EXAM_LABEL, sizeLabel } from '../../src/features/content/labels';
import { isEnabled } from '../../src/core/config/features';

export default function Detail() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.primary} />
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
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.appTitle}>{t('content.detailsTitle')}</Text>
        <Pressable onPress={onBookmark} hitSlop={10}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? colors.action : colors.primaryMid}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, lineHeight: 30 }}>{paper.title}</Text>

        <View style={styles.infoCard}>
          <Row colors={colors} label={t('content.exam')} value={EXAM_LABEL[paper.exam_type] ?? paper.exam_type} />
          <Row colors={colors} label={t('content.subject')} value={paper.subject} />
          <Row colors={colors} label={t('content.year')} value={`${paper.year ?? '—'}`} />
          <Row colors={colors} label={t('specialty.label')} value={paper.specialty || '—'} />
          <Row colors={colors} label={t('content.language')} value={paper.language === 'fr' ? t('content.french') : t('content.english')} />
          <Row colors={colors} label={t('content.fileSize')} value={sizeLabel(paper.file_size_kb)} last />
        </View>

        {hasPdf ? (
          <Pressable onPress={viewPdf} style={styles.viewPdfBtn}>
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: colors.primary, marginLeft: 8 }}>{t('content.viewPdf')}</Text>
          </Pressable>
        ) : null}

        {hasQuiz ? <AppButton label={t('ai.startQuiz')} style={{ marginTop: 12 }} onPress={startQuiz} /> : null}

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          {status === 'done' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark" size={18} color={colors.success} />
              <Text style={{ color: colors.success, fontWeight: '500', marginLeft: 6 }}>{t('content.downloadedOffline')}</Text>
            </View>
          ) : null}
          {status === 'downloading' ? (
            <>
              <ActivityIndicator color={colors.action} />
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 8 }}>{t('content.downloading')}</Text>
            </>
          ) : null}
          {status === 'locked' ? (
            <>
              <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                {info.limit != null
                  ? t('content.limitReachedCount', { limit: info.limit })
                  : t('content.limitReached')}
              </Text>
              {isEnabled('payments') ? (
                <AppButton label={t('plan.upgrade')} onPress={() => router.push('/paywall')} style={{ width: 220 }} />
              ) : null}
            </>
          ) : null}
          {status === 'idle' && paper.pdf_url ? (
            <AppButton label={t('content.downloadOffline')} onPress={onDownload} style={{ width: '100%' }} />
          ) : null}
          {!info.is_pro && info.limit != null && status !== 'locked' ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10 }}>
              {t('content.downloadsUsed', { used: info.used, limit: info.limit })}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, last, colors }: { label: string; value: string; last?: boolean; colors: ThemeColors }) {
  return (
    <View style={[rowStyle(colors), !last && { borderBottomWidth: 0.5, borderBottomColor: colors.inputBorder }]}>
      <Text style={{ fontSize: 15, color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12 },
  appTitle: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  infoCard: { backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, marginTop: 20 },
  viewPdfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 16, backgroundColor: c.primaryLight, marginTop: 16 },
});

const rowStyle = (c: ThemeColors) => ({
  flexDirection: 'row' as const, justifyContent: 'space-between' as const,
  paddingHorizontal: 20, paddingVertical: 16,
});
