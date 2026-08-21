import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { contentApi, BrowseSpecialty, Paper } from '../../src/features/content/api';
import { EXAM_LABEL } from '../../src/features/content/labels';

type Level = 'subsystem' | 'exam' | 'specialty' | 'year' | 'papers';

export default function Browse() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      if (mounted.current) setError(t('content.loadError'));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [t]);

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

  // Anglophone/Francophone and exam names are proper nouns in both locales.
  const crumb = [
    subsystem ?? null,
    exam ? EXAM_LABEL[exam] ?? exam : null,
    specialty?.name,
    year,
  ].filter(Boolean).join('  ›  ');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appbar}>
        <Pressable onPress={back} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('content.browseTitle')}</Text>
      </View>

      {crumb ? <Text style={styles.crumb}>{crumb}</Text> : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : level === 'subsystem' ? (
        <View style={{ padding: 20, gap: 12 }}>
          <PickRow colors={colors} label="Anglophone" sub="GCE, TVE, HND" onPress={() => goExam('anglophone')} />
          <PickRow colors={colors} label="Francophone" sub="BEPC, Probatoire, BAC, BTS" onPress={() => goExam('francophone')} />
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
          ListEmptyComponent={<Empty colors={colors} label={t('content.emptySubsystem')} />}
          renderItem={({ item }) => (
            <PickRow colors={colors} label={EXAM_LABEL[item] ?? item} onPress={() => goSpecialty(item)} />
          )}
        />
      ) : level === 'specialty' ? (
        <FlatList
          key="specialty"
          data={specialties}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Gap}
          ListEmptyComponent={<Empty colors={colors} label={t('content.emptySpecialties')} />}
          renderItem={({ item }) => (
            <PickRow
              colors={colors}
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
          ListEmptyComponent={<Empty colors={colors} label={t('content.emptyYears')} />}
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
          ListEmptyComponent={<Empty colors={colors} label={t('content.emptyPapers')} />}
          renderItem={({ item }) => (
            <Pressable
              // RN-3's detail screen loads by id — it does not take a serialised paper.
              onPress={() => router.push({ pathname: '/content/detail', params: { id: item.id } })}
              style={styles.paperCard}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{item.title}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                  {[item.subject, item.year].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function PickRow({ label, sub, onPress, colors }: { label: string; sub?: string; onPress: () => void; colors: ThemeColors }) {
  return (
    <Pressable onPress={onPress} style={pickRowStyle(colors)}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

function Gap() {
  return <View style={{ height: 10 }} />;
}

function Empty({ label, colors }: { label: string; colors: ThemeColors }) {
  return (
    <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40, paddingHorizontal: 32 }}>
      {label}
    </Text>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  crumb: {
    fontSize: 13, color: c.primaryMid, paddingHorizontal: 20,
    paddingVertical: 12, fontWeight: '500',
  },
  errorBox: {
    backgroundColor: c.errorLight, borderRadius: 10,
    padding: 12, marginHorizontal: 20, marginBottom: 8,
  },
  list: { padding: 20 },
  yearChip: {
    flex: 1, backgroundColor: c.cardSurface, borderRadius: 12, borderWidth: 0.5,
    borderColor: c.inputBorder, paddingVertical: 20, alignItems: 'center',
  },
  yearText: { fontSize: 18, fontWeight: '700', color: c.primary },
  paperCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, borderRadius: 16,
    borderWidth: 0.5, borderColor: c.inputBorder, padding: 16,
  },
});

const pickRowStyle = (c: ThemeColors) => ({
  flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: c.cardSurface, borderRadius: 16,
  borderWidth: 0.5, borderColor: c.inputBorder, padding: 18,
});
