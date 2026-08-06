import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, FlatList, ActivityIndicator,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';
import { enrolmentApi, enrolmentError, School } from '../../src/features/enrolment/api';
import { useRequestEnrolment } from '../../src/features/enrolment/hooks';
import { useFeatureGuard } from '../../src/core/config/useFeatureGuard';

export default function SchoolSearch() {
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Find your school</Text>
      </View>

      <View style={{ padding: 16 }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={onChange}
            placeholder="Search by name, town or region..."
            placeholderTextColor={Colors.textMuted}
            autoCorrect={false}
            returnKeyType="search"
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: Colors.textPrimary }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => { setQuery(''); search(''); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <FlatList
          data={schools}
          keyExtractor={(s) => s.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 40, color: Colors.textSecondary }}>
              No schools found
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelected(item)} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>{item.name}</Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>
                  {[item.town, item.region].filter(Boolean).join(' · ')} · {item.student_count}{' '}
                  {item.student_count === 1 ? 'student' : 'students'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
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
  const [matricule, setMatricule] = useState('');
  const [error, setError] = useState<string | null>(null);
  const request = useRequestEnrolment();

  const submit = async () => {
    if (!matricule.trim()) {
      setError('Enter your matricule.');
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
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary }}>Request enrolment</Text>
          <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 6 }}>{school.name}</Text>

          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 20, marginBottom: 8 }}>
            Your matricule / student number
          </Text>
          <TextInput
            value={matricule}
            onChangeText={setMatricule}
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="e.g. 21A0234"
            placeholderTextColor={Colors.textMuted}
            style={styles.sheetInput}
          />
          <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 8 }}>
            The school admin will verify your matricule before approving access.
          </Text>

          {error ? (
            <View style={{ backgroundColor: Colors.errorLight, borderRadius: 10, padding: 12, marginTop: 12 }}>
              <Text style={{ color: Colors.error, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <AppButton
            label="Send request"
            loading={request.isPending}
            onPress={submit}
            style={{ marginTop: 20 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: Colors.inputBorder, paddingHorizontal: 14, paddingVertical: 10,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16, marginBottom: 10,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  sheetInput: {
    backgroundColor: Colors.bg, borderRadius: 12, padding: 16,
    fontSize: 15, color: Colors.textPrimary,
  },
});
