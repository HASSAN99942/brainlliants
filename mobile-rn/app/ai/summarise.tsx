import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';
import { useSummarise } from '../../src/features/ai/hooks';
import { summaryCache } from '../../src/features/ai/offline';

type Step = 'upload' | 'loading' | 'results';

export default function Summarise() {
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
      setError(e?.response?.status === 403 ? 'Free AI limit reached. Upgrade to Pro.' : 'Could not process the document. Try again.');
      setStep('upload');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.title}>{lang === 'fr' ? 'Résumer des notes' : 'Summarise notes'}</Text>
      </View>

      {step === 'upload' && (
        <View style={{ flex: 1, padding: 20 }}>
          <Pressable onPress={pick} style={styles.uploadZone}>
            <Ionicons name="cloud-upload-outline" size={48} color={Colors.primaryMid} />
            <Text style={{ fontSize: 15, color: file ? Colors.primary : Colors.textSecondary, marginTop: 12, textAlign: 'center', fontWeight: file ? '500' : '400' }}>
              {file ? file.name : 'Tap to select PDF or Word (max 20MB)'}
            </Text>
          </Pressable>
          <View style={styles.langRow}>
            <Text style={{ fontSize: 14, color: Colors.textSecondary }}>Summary language</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['en', 'fr'] as const).map((l) => (
                <Pressable key={l} onPress={() => setLang(l)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: lang === l ? Colors.primary : 'transparent' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: lang === l ? '#fff' : Colors.textMuted }}>{l.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {error ? <View style={styles.errBox}><Text style={{ color: Colors.error, fontSize: 13 }}>{error}</Text></View> : null}
          <View style={{ flex: 1 }} />
          <AppButton label="Summarise" disabled={!file} onPress={run} />
        </View>
      )}

      {step === 'loading' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ fontSize: 16, color: Colors.textSecondary, marginTop: 24 }}>Processing your document...</Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 8 }}>This may take up to 30 seconds</Text>
        </View>
      )}

      {step === 'results' && result && (
        <View style={{ flex: 1 }}>
          <View style={styles.tabBar}>
            {(['summary', 'quiz'] as const).map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
                <Text style={{ fontWeight: '600', color: tab === t ? Colors.primary : Colors.textSecondary }}>{t === 'summary' ? 'Summary' : 'Quiz'}</Text>
              </Pressable>
            ))}
          </View>
          {tab === 'summary' ? (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <View style={styles.summaryCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, flex: 1 }}>AI Summary</Text>
                  <View style={styles.savedChip}><Ionicons name="checkmark" size={13} color={Colors.success} /><Text style={{ fontSize: 11, color: Colors.success, fontWeight: '500', marginLeft: 4 }}>Saved offline</Text></View>
                </View>
                <Text style={{ fontSize: 14, color: Colors.textPrimary, lineHeight: 22, marginTop: 12 }}>{result.summary}</Text>
                {result.explanation ? <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginTop: 16 }}>{result.explanation}</Text> : null}
              </View>
            </ScrollView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <Ionicons name="help-circle-outline" size={56} color={Colors.primaryLight} />
              <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.textPrimary, marginTop: 14 }}>{result.questions.length} questions ready</Text>
            </View>
          )}
          <View style={{ padding: 16 }}>
            <AppButton label="Start Quiz" disabled={result.questions.length === 0}
              onPress={() => router.push({ pathname: '/ai/quiz', params: { questions: JSON.stringify(result.questions), sessionId: result.session_id } })} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  uploadZone: { height: 200, borderRadius: 16, backgroundColor: Colors.bg, borderWidth: 2, borderColor: Colors.inputBorder, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 },
  errBox: { backgroundColor: Colors.errorLight, borderRadius: 10, padding: 12, marginTop: 16 },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 4, margin: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#fff' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16 },
  savedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
});
