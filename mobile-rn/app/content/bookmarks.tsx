import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { useBookmarks, useToggleBookmark } from '../../src/features/content/hooks';
import { downloads } from '../../src/features/content/download';
import { EXAM_LABEL } from '../../src/features/content/labels';

export default function Bookmarks() {
  const [tab, setTab] = useState<'papers' | 'notes'>('papers');
  const { data, isLoading } = useBookmarks();
  const toggle = useToggleBookmark();

  const all = data ?? [];
  const items = all.filter((b) => b.content_type === (tab === 'papers' ? 'question' : 'note'));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.appTitle}>Bookmarks</Text>
      </View>

      <View style={styles.tabBar}>
        {(['papers', 'notes'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={{ fontWeight: '600', color: tab === t ? Colors.textPrimary : Colors.textSecondary }}>
              {t === 'papers' ? 'Papers' : 'Notes'}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="bookmark-outline" size={56} color={Colors.primaryLight} />
          <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 12 }}>No bookmarks yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {items.map((b) => {
            const item = tab === 'papers' ? b.question : b.note;
            if (!item) return null;
            const downloaded = tab === 'papers' ? !!downloads.questionPath(item.id) : !!downloads.notePath(item.id);
            return (
              <Pressable
                key={b.id}
                onPress={() => { if (tab === 'papers') router.push({ pathname: '/content/detail', params: { id: item.id } }); }}
                style={styles.card}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>
                    {EXAM_LABEL[item.exam_type] ?? item.exam_type} · {item.subject}
                  </Text>
                  <View style={[styles.statusChip, { backgroundColor: downloaded ? Colors.successLight : '#EEEEEE' }]}>
                    {downloaded ? <Ionicons name="checkmark" size={12} color={Colors.success} /> : null}
                    <Text style={{ fontSize: 11, fontWeight: '500', marginLeft: downloaded ? 4 : 0, color: downloaded ? Colors.success : Colors.textSecondary }}>
                      {downloaded ? 'Downloaded' : 'Online'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => toggle.mutate({ type: tab === 'papers' ? 'question' : 'note', id: item.id })}
                  hitSlop={10}
                >
                  <Ionicons name="bookmark" size={26} color={Colors.action} />
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  appTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 4, margin: 20, marginBottom: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16, marginBottom: 10 },
  statusChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
});
