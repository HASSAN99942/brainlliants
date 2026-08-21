import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { useQuestions, useNotes } from '../../src/features/content/hooks';
import { downloads } from '../../src/features/content/download';
import { contentApi, isLimitReached, Paper } from '../../src/features/content/api';
import { EXAM_LABEL, FILTERS, FILTER_LABEL, FILTER_MINE, sizeLabel } from '../../src/features/content/labels';
import { isEnabled } from '../../src/core/config/features';
import { useAuthStore } from '../../src/features/auth/store';

export default function Resources() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<'papers' | 'notes'>('papers');
  const user = useAuthStore((s) => s.user);
  const specialtyName = user?.specialty?.trim();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.h1}>{t('content.bankTitle')}</Text>
        <Pressable onPress={() => router.push('/content/bookmarks')} hitSlop={10}>
          <Ionicons name="bookmark-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.scopeRow}>
        <Text style={{ flex: 1, fontSize: 14, color: colors.textSecondary }} numberOfLines={1}>
          {specialtyName ? t('content.papersFor', { specialty: specialtyName }) : t('content.papersAll')}
        </Text>
        <Pressable onPress={() => router.push('/content/browse')} hitSlop={8}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primaryMid }}>{t('content.browseAll')}</Text>
        </Pressable>
      </View>
      <View style={styles.tabBar}>
        {(['papers', 'notes'] as const).map((tabKey) => (
          <Pressable key={tabKey} onPress={() => setTab(tabKey)} style={[styles.tab, tab === tabKey && styles.tabActive]}>
            <Text style={{ fontWeight: '600', color: tab === tabKey ? colors.textPrimary : colors.textSecondary }}>
              {tabKey === 'papers' ? t('content.pastPapers') : t('content.notesTab')}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'papers' ? <PapersTab /> : <NotesTab />}
    </SafeAreaView>
  );
}

function FilterChips({ value, onChange }: { value: string; onChange: (f: string) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
      style={{ maxHeight: 50, marginTop: 12 }}
    >
      {FILTERS.map((f) => {
        const selected = value === f;
        return (
          <Pressable
            key={f}
            onPress={() => onChange(f)}
            style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.primaryLight }]}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: selected ? '#fff' : colors.textPrimary }}>
              {FILTER_LABEL[f]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function SearchBar({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={{ flex: 1, marginLeft: 8, fontSize: 15, color: colors.textPrimary }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
        />
        {value ? (
          <Pressable onPress={() => onChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PapersTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [filter, setFilter] = useState(FILTER_MINE);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-year');
  const { data, isLoading, isFetching, refetch } = useQuestions(filter, search, ordering);
  const papers = data?.results ?? [];

  return (
    <View style={{ flex: 1 }}>
      <SearchBar value={search} onChange={setSearch} onSubmit={() => refetch()} placeholder={t('content.searchPapers')} />
      <FilterChips value={filter} onChange={setFilter} />
      <Pressable
        onPress={() => setOrdering(ordering === '-year' ? 'year' : '-year')}
        style={{ alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 8 }}
      >
        <Text style={{ fontSize: 14, color: colors.primaryMid, fontWeight: '500' }}>
          {t('content.byYear')} {ordering === '-year' ? '↓' : '↑'}
        </Text>
      </Pressable>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
        >
          {papers.map((p) => <PaperCard key={p.id} paper={p} isNote={false} />)}
          {papers.length === 0 ? <Empty label={t('content.noPapers')} /> : null}
        </ScrollView>
      )}
    </View>
  );
}

function NotesTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [filter, setFilter] = useState(FILTER_MINE);
  const [search, setSearch] = useState('');
  const { data, isLoading, isFetching, refetch } = useNotes(filter, search);
  const notes = data?.results ?? [];

  return (
    <View style={{ flex: 1 }}>
      <SearchBar value={search} onChange={setSearch} onSubmit={() => refetch()} placeholder={t('content.searchNotes')} />
      <FilterChips value={filter} onChange={setFilter} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingTop: 12 }}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
        >
          {notes.map((n) => <PaperCard key={n.id} paper={n} isNote />)}
          {notes.length === 0 ? <Empty label={t('content.noNotes')} /> : null}
        </ScrollView>
      )}
    </View>
  );
}

function Empty({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', marginTop: 40 }}>
      <Ionicons name="documents-outline" size={48} color={colors.primaryLight} />
      <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 10 }}>{label}</Text>
    </View>
  );
}

function PaperCard({ paper, isNote }: { paper: Paper; isNote: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const saved = isNote ? downloads.notePath(paper.id) : downloads.questionPath(paper.id);
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'locked'>(saved ? 'done' : 'idle');
  const isQuiz = !isNote && (paper.format === 'json' || paper.format === 'both');

  const onDownload = async () => {
    setStatus('downloading');
    try {
      const res = isNote
        ? await contentApi.requestNoteDownload(paper.id)
        : await contentApi.requestQuestionDownload(paper.id);
      if (!res.pdf_url) {
        // A json-only paper has no file to store — it plays as a quiz instead.
        setStatus('idle');
        router.push({ pathname: '/content/detail', params: { id: paper.id } });
        return;
      }
      if (isNote) await downloads.saveNote(paper.id, res.pdf_url, paper.title, paper);
      else await downloads.saveQuestion(paper.id, res.pdf_url, paper.title, paper);
      setStatus('done');
    } catch (e) {
      if (isLimitReached(e)) {
        setStatus('locked');
        if (isEnabled('payments')) router.push('/paywall');
      } else {
        setStatus('idle');
      }
    }
  };

  const StatusIcon = () => {
    if (status === 'done') {
      return (
        <View style={styles.doneCircle}>
          <Ionicons name="checkmark" size={18} color={colors.success} />
        </View>
      );
    }
    if (status === 'downloading') return <ActivityIndicator size="small" color={colors.primaryMid} />;
    if (status === 'locked') {
      // Without payments the lock is informational — tapping it goes nowhere.
      if (!isEnabled('payments')) {
        return <Ionicons name="lock-closed-outline" size={22} color={colors.textMuted} />;
      }
      return (
        <Pressable onPress={() => router.push('/paywall')} hitSlop={8}>
          <Ionicons name="lock-closed-outline" size={22} color={colors.primaryMid} />
        </Pressable>
      );
    }
    return (
      <Pressable onPress={onDownload} hitSlop={8}>
        <Ionicons name="cloud-download-outline" size={22} color={colors.primaryMid} />
      </Pressable>
    );
  };

  return (
    <Pressable
      onPress={() => { if (!isNote) router.push({ pathname: '/content/detail', params: { id: paper.id } }); }}
      style={styles.card}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{paper.title}</Text>
        <View style={{ marginLeft: 8 }}><StatusIcon /></View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
        <View style={styles.examBadge}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>{EXAM_LABEL[paper.exam_type] ?? paper.exam_type}</Text>
        </View>
        <View style={styles.smallChip}><Text style={{ fontSize: 12, color: colors.textPrimary }}>{paper.subject}</Text></View>
        {paper.year ? <View style={styles.smallChip}><Text style={{ fontSize: 12, color: colors.textPrimary }}>{paper.year}</Text></View> : null}
        <View style={{ flex: 1 }} />
        <Ionicons name={isQuiz ? 'sparkles-outline' : 'document-text-outline'} size={15} color={colors.textSecondary} />
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          {isQuiz ? t('content.quiz') : t('content.pdfLabel')} · {sizeLabel(paper.file_size_kb)}
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  scopeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, marginTop: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20 },
  h1: { fontSize: 28, fontWeight: 'bold', color: c.textPrimary },
  tabBar: { flexDirection: 'row', backgroundColor: c.primaryLight, borderRadius: 12, padding: 4, marginHorizontal: 20, marginTop: 16, marginBottom: 12 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: c.cardSurface },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, borderRadius: 12, borderWidth: 0.5, borderColor: c.inputBorder, paddingHorizontal: 14, paddingVertical: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, height: 38, justifyContent: 'center' },
  card: { backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, padding: 16, marginBottom: 10 },
  examBadge: { backgroundColor: c.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  smallChip: { backgroundColor: c.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  doneCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.successLight, alignItems: 'center', justifyContent: 'center' },
});
