import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { useForumFeed } from '../../src/features/forum/hooks';
import { ForumPost, ForumScope } from '../../src/features/forum/api';
import { useAuthStore } from '../../src/features/auth/store';
import { EXAM_LABEL } from '../../src/features/content/labels';

const FILTERS = ['all', 'resolved', 'unanswered'];
const LABELS: Record<string, string> = { all: 'All', resolved: 'Resolved', unanswered: 'Unanswered' };

export default function Forum() {
  const [scope, setScope] = useState<ForumScope>('general');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, isLoading, isFetching, refetch } = useForumFeed(scope, filter, search);

  const user = useAuthStore((s) => s.user);
  const examLabel = user?.exam_level ? EXAM_LABEL[user.exam_level] ?? user.exam_level : 'My Exam';
  const specialtyLabel = user?.specialty?.trim() || 'My Specialty';

  const SCOPES: { key: ForumScope; label: string }[] = [
    { key: 'general', label: 'General' },
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
        <Text style={styles.h1}>Forum</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => router.push('/community/users')} style={{ padding: 6 }} hitSlop={6}>
          <Ionicons name="person-outline" size={24} color={Colors.primaryMid} />
        </Pressable>
        <Pressable onPress={() => router.push('/community/groups')} style={{ padding: 6 }} hitSlop={6}>
          <Ionicons name="school-outline" size={24} color={Colors.primaryMid} />
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
              style={{ fontSize: 13, fontWeight: '600', color: scope === s.key ? Colors.primary : Colors.textSecondary }}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: Colors.textPrimary }}
            placeholder="Search questions..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => setSearch(query)}
          />
          {query ? (
            <Pressable onPress={() => { setQuery(''); setSearch(''); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
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
            style={[styles.chip, { backgroundColor: filter === f ? Colors.primary : Colors.primaryLight }]}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: filter === f ? '#fff' : Colors.textPrimary }}>
              {LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
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
  // A scoped room the student cannot post in needs an explanation, not an invite.
  if (!canPost) {
    return (
      <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.primaryLight} />
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 14, textAlign: 'center' }}>
          {scope === 'exam' ? 'No exam level set' : 'No specialty selected'}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
          {scope === 'exam'
            ? 'Add your exam level in your profile to join this room.'
            : 'Pick your specialty from the list in your profile to join this room.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
      <Ionicons name="chatbubbles-outline" size={56} color={Colors.primaryLight} />
      <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 14 }}>
        {scope === 'general' ? 'No questions yet' : 'Be the first to post'}
      </Text>
      <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
        {scope === 'specialty'
          ? 'Ask a question your specialty-mates can help with'
          : scope === 'exam'
            ? 'Ask something everyone sitting this exam will recognise'
            : 'Start a conversation in this forum'}
      </Text>
    </View>
  );
}

function ScopeTag({ post }: { post: ForumPost }) {
  if (post.scope === 'general') return null;
  const label = post.scope === 'exam'
    ? EXAM_LABEL[post.scope_exam] ?? post.scope_exam ?? 'Exam'
    : post.scope_specialty_name ?? 'Specialty';
  return (
    <View style={styles.scopeTag}>
      <Text style={{ fontSize: 11, color: Colors.primaryMid, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}

function PostCard({ post }: { post: ForumPost }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/forum/post', params: { id: post.id } })}
      style={styles.card}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary, lineHeight: 21 }}>
          {post.title}
        </Text>
        {post.is_resolved ? (
          <View style={styles.resolvedChip}>
            <Ionicons name="checkmark" size={12} color={Colors.success} />
            <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '500', marginLeft: 4 }}>Resolved</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
        <ScopeTag post={post} />
        <Text style={{ fontSize: 14, color: Colors.primaryMid, fontWeight: '500' }}>{post.author.display_name}</Text>
        {post.author.is_teacher ? (
          <View style={styles.teacherBadge}>
            <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '500' }}>Teacher</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <Ionicons name="chatbubble-outline" size={15} color={Colors.textSecondary} />
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginLeft: 4, marginRight: 12 }}>{post.reply_count}</Text>
        <Ionicons name="eye-outline" size={15} color={Colors.textSecondary} />
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginLeft: 4 }}>{post.view_count}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  h1: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: Colors.inputBorder, paddingHorizontal: 14, paddingVertical: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50 },
  scopeBar: {
    flexDirection: 'row', backgroundColor: Colors.primaryLight, borderRadius: 12,
    padding: 4, marginHorizontal: 20, marginTop: 12,
  },
  scopeTab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, paddingHorizontal: 4 },
  scopeTabActive: { backgroundColor: '#fff' },
  scopeTag: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 12, marginRight: 8,
  },
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16, marginBottom: 10 },
  resolvedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 8 },
  teacherBadge: { backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 8 },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.action, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.action, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
});
