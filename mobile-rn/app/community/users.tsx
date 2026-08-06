import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { communityApi, UserResult } from '../../src/features/community/api';

const AVATAR_COLORS = ['#7F77DD', '#9F7AEA', '#3C3489', '#6C63C7'];

export default function Users() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  const search = async (q: string) => {
    setLoading(true);
    try {
      const data = await communityApi.searchUsers(q);
      if (mounted.current) setResults(data);
    } catch { /* ignore */ }
    if (mounted.current) setLoading(false);
  };

  useEffect(() => {
    mounted.current = true;
    search('');
    return () => {
      mounted.current = false;
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  const onChange = (v: string) => {
    setQuery(v);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(v), 300);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Find people</Text>
      </View>

      <View style={{ padding: 16 }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={onChange}
            placeholder="Search students and teachers..."
            placeholderTextColor={Colors.textMuted}
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: Colors.textPrimary }}
          />
          {query ? (
            <Pressable onPress={() => onChange('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="people-outline" size={48} color={Colors.primaryLight} />
              <Text style={{ textAlign: 'center', marginTop: 10, color: Colors.textSecondary }}>No users found</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{item.initials}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary }}>{item.display_name}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <View style={[styles.badge, { backgroundColor: item.is_teacher ? Colors.successLight : Colors.primaryLight }]}>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: item.is_teacher ? Colors.success : Colors.textPrimary }}>
                      {item.is_teacher ? 'Teacher' : 'Student'}
                    </Text>
                  </View>
                  {item.exam_level ? (
                    <View style={[styles.badge, { backgroundColor: Colors.primaryLight }]}>
                      <Text style={{ fontSize: 11, color: Colors.textPrimary }}>{item.exam_level}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: Colors.inputBorder, paddingHorizontal: 14, paddingVertical: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 14, marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
});
