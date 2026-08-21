import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, TextInput, FlatList, ActivityIndicator,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/core/theme';
import { AppButton } from '../../src/shared/components/AppButton';
import { enrolmentApi, enrolmentError, School } from '../../src/features/enrolment/api';
import { useRequestEnrolment } from '../../src/features/enrolment/hooks';
import { useFeatureGuard } from '../../src/core/config/useFeatureGuard';

export default function SchoolSearch() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const enabled = useFeatureGuard('schoolModule');
  const [query, setQuery] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<School | null>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  // Guards against a slow early response overwriting a newer one.
  const seq = useRef(0);

  const search = React.useCallback(async (q: string) => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const results = await enrolmentApi.searchSchools(q);
      if (mounted.current && mine === seq.current) setSchools(results);
    } catch {
      if (mounted.current && mine === seq.current) setSchools([]);
    } finally {
      if (mounted.current && mine === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    search('');
    return () => {
      mounted.current = false;
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [search]);

  const onChange = (v: string) => {
    setQuery(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(v), 300);
  };

  // After every hook, so the hook order stays stable.
  if (!enabled) return null;

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('school.findTitle')}</Text>
      </View>

      <View style={{ padding: 16 }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={onChange}
            placeholder={t('school.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
            returnKeyType="search"
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: colors.textPrimary }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => { setQuery(''); search(''); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <FlatList
          data={schools}
          keyExtractor={(sk) => sk.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>
              {t('school.noResults')}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelected(item)} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{item.name}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                  {[item.town, item.region].filter(Boolean).join(' · ')} ·{' '}
                  {t('school.studentCount', { count: item.student_count })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}

      {selected ? (
        <RequestSheet
          school={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); router.back(); }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function RequestSheet({ school, onClose, onDone }: {
  school: School;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [matricule, setMatricule] = useState('');
  const [error, setError] = useState<string | null>(null);
  const request = useRequestEnrolment();

  const submit = async () => {
    if (!matricule.trim()) {
      setError(t('school.enterMatricule'));
      return;
    }
    setError(null);
    try {
      await request.mutateAsync({ schoolId: school.id, matricule: matricule.trim() });
      onDone();
    } catch (e) {
      setError(enrolmentError(e));
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={backdrop} onPress={onClose} />
        <View style={[sheet, { backgroundColor: colors.cardSurface }]}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary }}>{t('school.requestEnrolment')}</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6 }}>{school.name}</Text>

          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 20, marginBottom: 8 }}>
            {t('school.matriculeLabel')}
          </Text>
          <TextInput
            value={matricule}
            onChangeText={setMatricule}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={t('school.matriculePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={[sheetInput, { backgroundColor: colors.bg, color: colors.textPrimary }]}
          />
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
            {t('school.matriculeHint')}
          </Text>

          {error ? (
            <View style={{ backgroundColor: colors.errorLight, borderRadius: 10, padding: 12, marginTop: 12 }}>
              <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <AppButton
            label={t('school.sendRequest')}
            loading={request.isPending}
            onPress={submit}
            style={{ marginTop: 20 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const backdrop = { flex: 1 as const, backgroundColor: 'rgba(0,0,0,0.4)' };
const sheet = { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 };
const sheetInput = { borderRadius: 12, padding: 16, fontSize: 15 };

const createStyles = (c: ReturnType<typeof useTheme>['colors']) => ({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold' as const, color: c.textPrimary },
  searchBar: {
    flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: c.cardSurface,
    borderRadius: 12, borderWidth: 0.5, borderColor: c.inputBorder, paddingHorizontal: 14, paddingVertical: 10,
  },
  card: {
    flexDirection: 'row' as const, alignItems: 'center' as const, backgroundColor: c.cardSurface,
    borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, padding: 16, marginBottom: 10,
  },
});
