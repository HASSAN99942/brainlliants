import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { AppButton } from '../../src/shared/components/AppButton';
import { useSaveQuizResult } from '../../src/features/ai/hooks';
import { QuizQuestion } from '../../src/features/ai/api';

export default function Quiz() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ questions: string; sessionId?: string }>();
  const questions: QuizQuestion[] = JSON.parse(params.questions ?? '[]');
  const sessionId = params.sessionId ?? null;
  const saveResult = useSaveQuizResult();

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>{t('ai.noQuestions')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const q = questions[index];
  const isCorrect = selected === q.correct_option;

  const choose = (i: number) => { if (!answered) { setSelected(i); setAnswered(true); } };

  const next = () => {
    const newScore = isCorrect ? score + 1 : score;
    if (index >= questions.length - 1) {
      setScore(newScore); setFinished(true);
      const pct = ((newScore / questions.length) * 100).toFixed(2);
      saveResult.mutate({ source_type: 'ai_generated', ai_session_id: sessionId, total_questions: questions.length, correct_answers: newScore, score_percent: pct, answers_json: [] });
    } else {
      setScore(newScore); setIndex(index + 1); setSelected(null); setAnswered(false);
    }
  };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 60;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.appbar}>
          <Pressable onPress={() => router.back()}><Ionicons name="close" size={24} color={colors.textPrimary} /></Pressable>
          <Text style={styles.title}>{t('ai.results')}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={[styles.scoreRing, { borderColor: passed ? colors.success : colors.action }]}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.textPrimary }}>{pct}%</Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>{score}/{questions.length}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginTop: 28 }}>
            {passed ? t('ai.wellDone') : t('ai.keepPractising')}
          </Text>
          <AppButton label={t('ai.backToSummary')} variant="secondary" onPress={() => router.back()} style={{ marginTop: 32, width: '100%' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></Pressable>
        <Text style={styles.title}>{t('ai.quizTitle')}</Text>
      </View>
      <View style={styles.progressRow}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>{t('ai.questionOf', { current: index + 1, total: questions.length })}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>{t('ai.score', { score })}</Text>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${((index + 1) / questions.length) * 100}%` }]} /></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, lineHeight: 30, marginBottom: 28 }}>{q.question}</Text>
        {q.options.map((opt, i) => {
          let bg: string = colors.cardSurface, border: string = colors.inputBorder, fg: string = colors.textPrimary, bw = 0.5;
          if (answered) {
            if (i === q.correct_option) { bg = colors.successLight; border = colors.success; fg = colors.success; bw = 1.5; }
            else if (i === selected) { bg = colors.errorLight; border = colors.error; fg = colors.error; bw = 1.5; }
          }
          return (
            <Pressable key={i} onPress={() => choose(i)} style={[styles.option, { backgroundColor: bg, borderColor: border, borderWidth: bw }]}>
              <Text style={{ fontSize: 15, color: fg }}>{['A', 'B', 'C', 'D'][i]}. {opt}</Text>
            </Pressable>
          );
        })}
        {answered && q.explanation ? (
          <View style={[styles.explain, { backgroundColor: isCorrect ? colors.successLight : colors.errorLight }]}>
            <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 20 }}>{q.explanation}</Text>
          </View>
        ) : null}
        {answered ? (
          <AppButton label={index >= questions.length - 1 ? t('ai.seeResults') : t('ai.nextQuestion')} onPress={next} style={{ marginTop: 24 }} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  progressRow: { backgroundColor: c.cardSurface, paddingHorizontal: 20, paddingVertical: 14 },
  track: { height: 3, backgroundColor: c.inputBorder, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: c.primary },
  option: { borderRadius: 16, padding: 18, marginBottom: 12 },
  explain: { borderRadius: 12, padding: 14, marginTop: 8 },
  scoreRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 10, alignItems: 'center', justifyContent: 'center' },
});
