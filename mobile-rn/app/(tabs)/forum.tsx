import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { useForumFeed } from '../../src/features/forum/hooks';
import { ForumPost, ForumScope } from '../../src/features/forum/api';
import { useAuthStore } from '../../src/features/auth/store';
import { EXAM_LABEL } from '../../src/features/content/labels';

const FILTERS = ['all', 'resolved', 'unanswered'];

export default function Forum() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [scope, setScope] = useState<ForumScope>('general');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, isLoading, isFetching, refetch } = useForumFeed(scope, filter, search);

  const user = useAuthStore((s) => s.user);
  const examLabel = user?.exam_level ? EXAM_LABEL[user.exam_level] ?? user.exam_level : t('social.myExam');
  const specialtyLabel = user?.specialty?.trim() || t('social.mySpecialty');

  const FILTER_LABELS: Record<string, string> = {
    all: t('social.filterAll'),
    resolved: t('social.filterResolved'),
    unanswered: t('social.filterUnanswered'),
  };

  const SCOPES: { key: ForumScope; label: string }[] = [
    { key: 'general', label: t('social.scopeGeneral') },
    { key: 'exam', label: examLabel },
    { key: 'specialty', label: specialtyLabel },
  ];

  // Posting to a specialty room needs a catalogue specialty, not a typed one.
  const canPostHere =
    scope === 'general' ||
    (scope === 'exam' && !!user?.exam_level) ||
    (scope === 'specialty' && !!user?.specialty_ref);

  // Coming back from Create Post / Post Detail should show fresh counts.
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={styles.h1}>{t('forum')}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => router.push('/community/users')} style={{ padding: 6 }} hitSlop={6}>
          <Ionicons name="person-outline" size={24} color={colors.primaryMid} />
        </Pressable>
        <Pressable onPress={() => router.push('/community/groups')} style={{ padding: 6 }} hitSlop={6}>
          <Ionicons name="school-outline" size={24} color={colors.primaryMid} />
        </Pressable>
      </View>

      <View style={styles.scopeBar}>
        {SCOPES.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setScope(s.key)}
            style={[styles.scopeTab, scope === s.key && styles.scopeTabActive]}
          >
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, fontWeight: '600', color: scope === s.key ? colors.primary : colors.textSecondary }}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: colors.textPrimary }}
            placeholder={t('social.searchQuestions')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => setSearch(query)}
          />
          {query ? (
            <Pressable onPress={() => { setQuery(''); setSearch(''); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 50 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, { backgroundColor: filter === f ? colors.primary : colors.primaryLight }]}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: filter === f ? '#fff' : colors.textPrimary }}>
              {FILTER_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={data?.results ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 100 }}
          onRefresh={refetch}
          refreshing={isFetching}
          ListEmptyComponent={<EmptyRoom scope={scope} canPost={canPostHere} />}
          renderItem={({ item }) => <PostCard post={item} />}
        />
      )}

      {canPostHere ? (
        <Pressable
          onPress={() => router.push({ pathname: '/forum/create', params: { scope } })}
          style={styles.fab}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

function EmptyRoom({ scope, canPost }: { scope: ForumScope; canPost: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  // A scoped room the student cannot post in needs an explanation, not an invite.
  if (!canPost) {
    return (
      <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
        <Ionicons name="lock-closed-outline" size={48} color={colors.primaryLight} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 14, textAlign: 'center' }}>
          {scope === 'exam' ? t('social.noExamLevel') : t('social.noSpecialty')}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
          {scope === 'exam'
            ? t('social.noExamLevelHint')
            : t('social.noSpecialtyHint')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
      <Ionicons name="chatbubbles-outline" size={56} color={colors.primaryLight} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 14 }}>
        {scope === 'general' ? t('social.noQuestionsYet') : t('social.beFirst')}
      </Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
        {scope === 'specialty'
          ? t('social.emptySpecialtyHint')
          : scope === 'exam'
            ? t('social.emptyExamHint')
            : t('social.emptyGeneralHint')}
      </Text>
    </View>
  );
}

function ScopeTag({ post }: { post: ForumPost }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (post.scope === 'general') return null;
  const label = post.scope === 'exam'
    ? EXAM_LABEL[post.scope_exam] ?? post.scope_exam ?? t('social.examFallback')
    : post.scope_specialty_name ?? t('social.specialtyFallback');
  return (
    <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginRight: 8 }}>
      <Text style={{ fontSize: 11, color: colors.primaryMid, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

function PostCard({ post }: { post: ForumPost }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/forum/post', params: { id: post.id } })}
      style={{
        backgroundColor: colors.cardSurface, borderRadius: 16, borderWidth: 0.5,
        borderColor: colors.inputBorder, padding: 16, marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.textPrimary, lineHeight: 21 }}>
          {post.title}
        </Text>
        {post.is_resolved ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 8 }}>
            <Ionicons name="checkmark" size={12} color={colors.success} />
            <Text style={{ fontSize: 11, color: colors.success, fontWeight: '500', marginLeft: 4 }}>{t('social.resolved')}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <ScopeTag post={post} />
        <Text style={{ fontSize: 14, color: colors.primaryMid, fontWeight: '500' }}>{post.author.display_name}</Text>
        {post.author.is_teacher ? (
          <View style={{ backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 8 }}>
            <Text style={{ fontSize: 11, color: colors.success, fontWeight: '500' }}>{t('social.teacher')}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4, marginRight: 12 }}>{post.reply_count}</Text>
        <Ionicons name="eye-outline" size={15} color={colors.textSecondary} />
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 4 }}>{post.view_count}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  h1: { fontSize: 28, fontWeight: 'bold', color: c.textPrimary },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, borderRadius: 12, borderWidth: 0.5, borderColor: c.inputBorder, paddingHorizontal: 14, paddingVertical: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50 },
  scopeBar: {
    flexDirection: 'row', backgroundColor: c.primaryLight, borderRadius: 12,
    padding: 4, marginHorizontal: 20, marginTop: 12,
  },
  scopeTab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, paddingHorizontal: 4 },
  scopeTabActive: { backgroundColor: c.cardSurface },
});
