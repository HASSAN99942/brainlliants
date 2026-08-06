import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';
import { useSaveQuizResult } from '../../src/features/ai/hooks';
import { QuizQuestion } from '../../src/features/ai/api';

export default function Quiz() {
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
    return <SafeAreaView style={styles.safe}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: Colors.textSecondary }}>No questions.</Text></View></SafeAreaView>;
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
        <View style={styles.appbar}><Pressable onPress={() => router.back()}><Ionicons name="close" size={24} color={Colors.textPrimary} /></Pressable><Text style={styles.title}>Results</Text></View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={[styles.scoreRing, { borderColor: passed ? Colors.success : Colors.action }]}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: Colors.textPrimary }}>{pct}%</Text>
            <Text style={{ fontSize: 15, color: Colors.textSecondary }}>{score}/{questions.length}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 28 }}>{passed ? 'Well done!' : 'Keep practising!'}</Text>
          <AppButton label="Back to summary" variant="secondary" onPress={() => router.back()} style={{ marginTop: 32, width: '100%' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.appbar}><Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></Pressable><Text style={styles.title}>Quiz</Text></View>
      <View style={styles.progressRow}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Question {index + 1} of {questions.length}</Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>Score {score}</Text>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${((index + 1) / questions.length) * 100}%` }]} /></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, lineHeight: 30, marginBottom: 28 }}>{q.question}</Text>
        {q.options.map((opt, i) => {
          let bg: string = '#fff', border: string = Colors.inputBorder, fg: string = Colors.textPrimary, bw = 0.5;
          if (answered) {
            if (i === q.correct_option) { bg = Colors.successLight; border = Colors.success; fg = Colors.success; bw = 1.5; }
            else if (i === selected) { bg = Colors.errorLight; border = Colors.error; fg = Colors.error; bw = 1.5; }
          }
          return (
            <Pressable key={i} onPress={() => choose(i)} style={[styles.option, { backgroundColor: bg, borderColor: border, borderWidth: bw }]}>
              <Text style={{ fontSize: 15, color: fg }}>{['A', 'B', 'C', 'D'][i]}. {opt}</Text>
            </Pressable>
          );
        })}
        {answered && q.explanation ? (
          <View style={[styles.explain, { backgroundColor: isCorrect ? Colors.successLight : Colors.errorLight }]}>
            <Text style={{ fontSize: 13, color: Colors.textPrimary, lineHeight: 20 }}>{q.explanation}</Text>
          </View>
        ) : null}
        {answered ? <AppButton label={index >= questions.length - 1 ? 'See results' : 'Next question'} onPress={next} style={{ marginTop: 24 }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  progressRow: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14 },
  track: { height: 3, backgroundColor: Colors.inputBorder, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: Colors.primary },
  option: { borderRadius: 16, padding: 18, marginBottom: 12 },
  explain: { borderRadius: 12, padding: 14, marginTop: 8 },
  scoreRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 10, alignItems: 'center', justifyContent: 'center' },
});
