import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { useGroups } from '../../src/features/community/hooks';
import { communityApi, Group } from '../../src/features/community/api';
import { EXAM_LABEL } from '../../src/features/content/labels';

const AVATAR_COLORS = ['#7F77DD', '#9F7AEA', '#3C3489', '#6C63C7'];

export default function Groups() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const { data, isLoading, isFetching, refetch } = useGroups(lang);
  const [local, setLocal] = useState<Record<string, { is_member: boolean; member_count: number }>>({});

  const toggleJoin = async (g: Group) => {
    try {
      const res = await communityApi.toggleJoin(g.id);
      setLocal((prev) => ({ ...prev, [g.id]: res }));
    } catch { /* ignore */ }
  };

  const openGroup = (g: Group, state: { is_member: boolean; member_count: number }) => {
    router.push({
      pathname: '/community/group',
      params: { group: JSON.stringify({ ...g, ...state }) },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('community.groupsTitle')}</Text>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['en', 'fr'] as const).map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: lang === l ? colors.primary : 'transparent' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: lang === l ? '#fff' : colors.textMuted }}>
                {l.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(g) => g.id}
          numColumns={2}
          onRefresh={refetch}
          refreshing={isFetching}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="school-outline" size={56} color={colors.primaryLight} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{t('community.noGroups', { lang: lang.toUpperCase() })}</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const state = local[item.id] ?? { is_member: item.is_member, member_count: item.member_count };
            const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
            return (
              <Pressable onPress={() => openGroup(item, state)} style={styles.card}>
                <View style={[styles.groupAvatar, { backgroundColor: color }]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{item.initials}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, marginTop: 12, lineHeight: 20 }} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={[styles.examBadge, { backgroundColor: colors.primary }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                    {EXAM_LABEL[item.exam_type] ?? item.exam_type}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>
                  {t('community.memberCount', { count: state.member_count })}
                </Text>
                <View style={{ flex: 1 }} />
                {state.is_member ? (
                  <Pressable onPress={() => toggleJoin(item)} style={[styles.joinBtn, { backgroundColor: colors.successLight }]}>
                    <Ionicons name="checkmark" size={16} color={colors.success} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.success, marginLeft: 6 }}>{t('community.joined')}</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => toggleJoin(item)} style={[styles.joinBtn, { borderWidth: 1, borderColor: colors.primary }]}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>{t('community.join')}</Text>
                  </Pressable>
                )}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  card: { flex: 1, backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, padding: 16, minHeight: 200 },
  groupAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  examBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, marginTop: 10 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 12, marginTop: 8 },
});
