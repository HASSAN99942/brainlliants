import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../src/core/constants/colors';
import { AppButton } from '../src/shared/components/AppButton';
import { useOnboardingStore, ANGLO_EXAMS, FRANCO_EXAMS } from '../src/features/auth/onboardingStore';

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const { subsystem, examLevel, setSubsystem, setExamLevel } = useOnboardingStore();

  const canNext = page === 1 ? !!subsystem : page === 2 ? !!examLevel : true;
  const exams = subsystem === 'anglophone' ? ANGLO_EXAMS : FRANCO_EXAMS;

  const next = () => {
    if (page < 2) { scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true }); setPage(page + 1); }
    else router.replace('/register');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef} horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {/* Page 1 */}
        <View style={[styles.page, { width }]}>
          <View style={styles.illustration} />
          <Text style={styles.title}>Your AI study partner, built for Cameroon</Text>
          <Text style={styles.subtitle}>Past papers, AI tutoring and study groups for GCE, BAC, BEPC and more — even when you're offline.</Text>
        </View>
        {/* Page 2 */}
        <View style={[styles.page, { width }]}>
          <Text style={styles.title}>Which system are you in?</Text>
          <Text style={styles.subtitle}>We'll tailor exams and content to your subsystem.</Text>
          <View style={{ marginTop: 24, gap: 14 }}>
            <SubsystemCard selected={subsystem === 'anglophone'} title="Anglophone (GCE)" sub="O-Level, A-Level, TVE, HND" onPress={() => setSubsystem('anglophone')} />
            <SubsystemCard selected={subsystem === 'francophone'} title="Francophone (BAC/BEPC)" sub="CEP, BEPC, Probatoire, BAC, BTS" onPress={() => setSubsystem('francophone')} />
          </View>
        </View>
        {/* Page 3 */}
        <View style={[styles.page, { width, paddingBottom: 0 }]}>
          <Text style={styles.title}>What are you preparing for?</Text>
          <Text style={styles.subtitle}>Pick your exam level.</Text>
          {/* The francophone list runs to 13 entries, so this page scrolls. */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <View style={styles.chipWrap}>
              {exams.map((exam) => {
                const sel = examLevel === exam;
                return (
                  <Pressable key={exam} onPress={() => setExamLevel(exam)}
                    style={[styles.examChip, { backgroundColor: sel ? Colors.primary : Colors.primaryLight }]}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: sel ? '#fff' : Colors.textPrimary }}>{exam}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.dots}>
        {[0, 1, 2].map((i) => <View key={i} style={[styles.dot, { width: i === page ? 24 : 8, backgroundColor: i === page ? Colors.primary : '#CCCCDD' }]} />)}
      </View>
      <View style={{ paddingHorizontal: 24, paddingBottom: 32, opacity: canNext ? 1 : 0.5 }}>
        <AppButton label={page === 2 ? 'Get Started' : 'Next'} onPress={canNext ? next : undefined} disabled={!canNext} />
      </View>
    </SafeAreaView>
  );
}

function SubsystemCard({ selected, title, sub, onPress }: { selected: boolean; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.subCard, selected && { borderColor: Colors.primary, borderWidth: 2 }]}>
      <Text style={{ fontSize: 17, fontWeight: '600', color: Colors.primary }}>{title}</Text>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  page: { paddingHorizontal: 24, paddingTop: 20 },
  illustration: { height: 260, borderRadius: 24, backgroundColor: Colors.primaryLight, marginBottom: 36 },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.textPrimary, lineHeight: 32 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8, lineHeight: 22 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 28 },
  examChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 50 },
  subCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: 'transparent' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  dot: { height: 8, borderRadius: 4 },
});
