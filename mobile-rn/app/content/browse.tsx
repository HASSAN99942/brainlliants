import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { contentApi, BrowseSpecialty, Paper } from '../../src/features/content/api';
import { EXAM_LABEL } from '../../src/features/content/labels';

type Level = 'subsystem' | 'exam' | 'specialty' | 'year' | 'papers';

const SUBSYSTEM_LABEL: Record<string, string> = {
  anglophone: 'Anglophone',
  francophone: 'Francophone',
};

export default function Browse() {
  const [level, setLevel] = useState<Level>('subsystem');
  const [subsystem, setSubsystem] = useState<string | null>(null);
  const [exam, setExam] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<BrowseSpecialty | null>(null);
  const [year, setYear] = useState<number | null>(null);

  const [exams, setExams] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<BrowseSpecialty[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mounted = React.useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  /** Runs a step's fetch, then advances a level. Keeps error/loading in one place. */
  const step = useCallback(async (next: Level, load: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await load();
      if (mounted.current) setLevel(next);
    } catch {
      if (mounted.current) setError('Could not load that list. Check your connection and try again.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const goExam = (sub: string) => step('exam', async () => {
    setSubsystem(sub);
    setExams(await contentApi.browseExams(sub));
  });

  const goSpecialty = (ex: string) => step('specialty', async () => {
    setExam(ex);
    setSpecialties(await contentApi.browseSpecialties(subsystem!, ex));
  });

  const goYear = (sp: BrowseSpecialty) => step('year', async () => {
    setSpecialty(sp);
    setYears(await contentApi.browseYears(sp.id, exam!));
  });

  const goPapers = (yr: number) => step('papers', async () => {
    setYear(yr);
    const res = await contentApi.getQuestions({
      scope: 'all', specialty: specialty!.id, exam: exam!, year: String(yr),
    });
    setPapers(res.results);
  });

  const back = () => {
    setError(null);
    if (level === 'papers') { setYear(null); setLevel('year'); }
    else if (level === 'year') { setSpecialty(null); setLevel('specialty'); }
    else if (level === 'specialty') { setExam(null); setLevel('exam'); }
    else if (level === 'exam') { setSubsystem(null); setLevel('subsystem'); }
    else router.back();
  };

  const crumb = [
    subsystem ? SUBSYSTEM_LABEL[subsystem] ?? subsystem : null,
    exam ? EXAM_LABEL[exam] ?? exam : null,
    specialty?.name,
    year,
  ].filter(Boolean).join('  ›  ');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appbar}>
        <Pressable onPress={back} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Browse papers</Text>
      </View>

      {crumb ? <Text style={styles.crumb}>{crumb}</Text> : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={{ color: Colors.error, fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : level === 'subsystem' ? (
        <View style={{ padding: 20, gap: 12 }}>
          <PickRow label="Anglophone" sub="GCE, TVE, HND" onPress={() => goExam('anglophone')} />
          <PickRow label="Francophone" sub="BEPC, Probatoire, BAC, BTS" onPress={() => goExam('francophone')} />
        </View>
      ) : level === 'exam' ? (
        <FlatList
          // Every level renders a FlatList in the same slot, so React would
          // reuse one instance and mutate numColumns when the year grid appears
          // — which RN rejects outright. A per-level key remounts instead (and
          // resets scroll position between levels, which is what we want).
          key="exam"
          data={exams}
          keyExtractor={(e) => e}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Gap}
          ListEmptyComponent={<Empty label="No papers have been published for this subsystem yet" />}
          renderItem={({ item }) => (
            <PickRow label={EXAM_LABEL[item] ?? item} onPress={() => goSpecialty(item)} />
          )}
        />
      ) : level === 'specialty' ? (
        <FlatList
          key="specialty"
          data={specialties}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Gap}
          ListEmptyComponent={<Empty label="No specialties have papers for this exam yet" />}
          renderItem={({ item }) => (
            <PickRow
              label={item.name}
              sub={[item.abbreviation, item.category].filter(Boolean).join(' · ')}
              onPress={() => goYear(item)}
            />
          )}
        />
      ) : level === 'year' ? (
        <FlatList
          key="year"
          data={years}
          keyExtractor={(y) => String(y)}
          numColumns={3}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 20, gap: 12 }}
          ListEmptyComponent={<Empty label="No dated papers for this specialty yet" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => goPapers(item)} style={styles.yearChip}>
              <Text style={styles.yearText}>{item}</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          key="papers"
          data={papers}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Gap}
          ListEmptyComponent={<Empty label="No papers for this selection" />}
          renderItem={({ item }) => (
            <Pressable
              // RN-3's detail screen loads by id — it does not take a serialised paper.
              onPress={() => router.push({ pathname: '/content/detail', params: { id: item.id } })}
              style={styles.paperCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>{item.title}</Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>
                  {[item.subject, item.year].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function PickRow({ label, sub, onPress }: { label: string; sub?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.pickRow}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

function Gap() {
  return <View style={{ height: 10 }} />;
}

function Empty({ label }: { label: string }) {
  return (
    <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginTop: 40, paddingHorizontal: 32 }}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  crumb: {
    fontSize: 13, color: Colors.primaryMid, paddingHorizontal: 20,
    paddingVertical: 12, fontWeight: '500',
  },
  errorBox: {
    backgroundColor: Colors.errorLight, borderRadius: 10,
    padding: 12, marginHorizontal: 20, marginBottom: 8,
  },
  list: { padding: 20 },
  pickRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 18,
  },
  yearChip: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5,
    borderColor: Colors.inputBorder, paddingVertical: 20, alignItems: 'center',
  },
  yearText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  paperCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16,
  },
});
