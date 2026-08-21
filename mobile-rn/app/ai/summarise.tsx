import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { AppButton } from '../../src/shared/components/AppButton';
import { useSummarise } from '../../src/features/ai/hooks';
import { summaryCache } from '../../src/features/ai/offline';

type Step = 'upload' | 'loading' | 'results';

export default function Summarise() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState<Step>('upload');
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [result, setResult] = useState<{ session_id: string; summary: string; explanation: string; questions: any[] } | null>(null);
  const [tab, setTab] = useState<'summary' | 'quiz'>('summary');
  const [error, setError] = useState<string | null>(null);
  const summarise = useSummarise();

  const pick = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] });
    if (!res.canceled && res.assets[0]) setFile(res.assets[0]);
  };

  const run = async () => {
    if (!file) return;
    setStep('loading'); setError(null);
    try {
      const res = await summarise.mutateAsync({ uri: file.uri, name: file.name, mime: file.mimeType ?? 'application/pdf', lang });
      summaryCache.save({ ...res, file_name: file.name, saved_at: new Date().toISOString() });
      setResult(res); setStep('results');
    } catch (e: any) {
      setError(e?.response?.status === 403 ? t('ai.freeLimitReached') : t('ai.processError'));
      setStep('upload');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></Pressable>
        <Text style={styles.title}>{t('learn.summariseTitle')}</Text>
      </View>

      {step === 'upload' && (
        <View style={{ flex: 1, padding: 20 }}>
          <Pressable onPress={pick} style={styles.uploadZone}>
            <Ionicons name="cloud-upload-outline" size={48} color={colors.primaryMid} />
            <Text style={{ fontSize: 15, color: file ? colors.primary : colors.textSecondary, marginTop: 12, textAlign: 'center', fontWeight: file ? '500' : '400' }}>
              {file ? file.name : t('ai.tapToSelect')}
            </Text>
          </Pressable>
          <View style={styles.langRow}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>{t('ai.summaryLanguage')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['en', 'fr'] as const).map((l) => (
                <Pressable key={l} onPress={() => setLang(l)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: lang === l ? colors.primary : 'transparent' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: lang === l ? '#fff' : colors.textMuted }}>{l.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {error ? <View style={styles.errBox}><Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text></View> : null}
          <View style={{ flex: 1 }} />
          <AppButton label={t('ai.summariseBtn')} disabled={!file} onPress={run} />
        </View>
      )}

      {step === 'loading' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 24 }}>{t('ai.processing')}</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>{t('ai.mayTakeTime')}</Text>
        </View>
      )}

      {step === 'results' && result && (
        <View style={{ flex: 1 }}>
          <View style={styles.tabBar}>
            {(['summary', 'quiz'] as const).map((tabKey) => (
              <Pressable key={tabKey} onPress={() => setTab(tabKey)} style={[styles.tab, tab === tabKey && styles.tabActive]}>
                <Text style={{ fontWeight: '600', color: tab === tabKey ? colors.primary : colors.textSecondary }}>
                  {tabKey === 'summary' ? t('ai.tabSummary') : t('ai.tabQuiz')}
                </Text>
              </Pressable>
            ))}
          </View>
          {tab === 'summary' ? (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View style={styles.summaryCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, flex: 1 }}>{t('ai.aiSummary')}</Text>
                  <View style={styles.savedChip}>
                    <Ionicons name="checkmark" size={13} color={colors.success} />
                    <Text style={{ fontSize: 11, color: colors.success, fontWeight: '500', marginLeft: 4 }}>{t('ai.savedOffline')}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 22, marginTop: 12 }}>{result.summary}</Text>
                {result.explanation ? <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginTop: 16 }}>{result.explanation}</Text> : null}
              </View>
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <Ionicons name="help-circle-outline" size={56} color={colors.primaryLight} />
              <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary, marginTop: 14 }}>
                {t('ai.questionsReady', { count: result.questions.length })}
              </Text>
            </View>
          )}
          <View style={{ padding: 16 }}>
            <AppButton label={t('ai.startQuiz')} disabled={result.questions.length === 0}
              onPress={() => router.push({ pathname: '/ai/quiz', params: { questions: JSON.stringify(result.questions), sessionId: result.session_id } })} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  uploadZone: { height: 200, borderRadius: 16, backgroundColor: c.bg, borderWidth: 2, borderColor: c.inputBorder, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 },
  errBox: { backgroundColor: c.errorLight, borderRadius: 10, padding: 12, marginTop: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: c.primaryLight, borderRadius: 12, padding: 4, margin: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: c.cardSurface },
  summaryCard: { backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, padding: 16 },
  savedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.successLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
});
