import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { useBookmarks, useToggleBookmark } from '../../src/features/content/hooks';
import { downloads } from '../../src/features/content/download';
import { EXAM_LABEL } from '../../src/features/content/labels';

export default function Bookmarks() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<'papers' | 'notes'>('papers');
  const { data, isLoading } = useBookmarks();
  const toggle = useToggleBookmark();

  const all = data ?? [];
  const items = all.filter((b) => b.content_type === (tab === 'papers' ? 'question' : 'note'));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.appTitle}>{t('content.bookmarks')}</Text>
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

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="bookmark-outline" size={56} color={colors.primaryLight} />
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 12 }}>{t('content.noBookmarks')}</Text>
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
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    {EXAM_LABEL[item.exam_type] ?? item.exam_type} · {item.subject}
                  </Text>
                  <View style={[styles.statusChip, { backgroundColor: downloaded ? colors.successLight : colors.primaryLight }]}>
                    {downloaded ? <Ionicons name="checkmark" size={12} color={colors.success} /> : null}
                    <Text style={{ fontSize: 11, fontWeight: '500', marginLeft: downloaded ? 4 : 0, color: downloaded ? colors.success : colors.primaryMid }}>
                      {downloaded ? t('content.downloaded') : t('home.online')}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => toggle.mutate({ type: tab === 'papers' ? 'question' : 'note', id: item.id })}
                  hitSlop={10}
                >
                  <Ionicons name="bookmark" size={26} color={colors.action} />
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  appTitle: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  tabBar: { flexDirection: 'row', backgroundColor: c.primaryLight, borderRadius: 12, padding: 4, margin: 20, marginBottom: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: c.cardSurface },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, padding: 16, marginBottom: 10 },
  statusChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
});
