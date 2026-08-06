import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';
import { communityApi, Group, GroupPost, isNotMember } from '../../src/features/community/api';

export default function GroupDetail() {
  const params = useLocalSearchParams<{ group: string }>();
  const group: Group | null = (() => {
    try { return JSON.parse(params.group ?? 'null'); } catch { return null; }
  })();

  const [tab, setTab] = useState<'discussion' | 'chat'>('discussion');
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isMember, setIsMember] = useState(!!group?.is_member);
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!group) return;
    try { setPosts(await communityApi.getGroupPosts(group.id)); } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [group?.id]);

  if (!group) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>Group not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const join = async () => {
    try {
      const res = await communityApi.toggleJoin(group.id);
      setIsMember(res.is_member);
      setNotice('');
    } catch { /* ignore */ }
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    try {
      await communityApi.createGroupPost(group.id, text);
      setNotice('');
      await load();
    } catch (e) {
      setInput(text);
      // The backend rejects posts from non-members with 403.
      setNotice(isNotMember(e) ? 'Join the group to post.' : 'Could not post. Try again.');
      if (isNotMember(e)) setIsMember(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{group.name}</Text>
      </View>

      <View style={styles.tabBar}>
        {(['discussion', 'chat'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && { borderBottomColor: Colors.action, borderBottomWidth: 2 }]}
          >
            <Text style={{ fontWeight: '600', color: tab === t ? Colors.primary : Colors.textSecondary }}>
              {t === 'discussion' ? 'Discussion' : 'Live Chat'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'discussion' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ padding: 16 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                  <Ionicons name="chatbubble-outline" size={56} color={Colors.primaryLight} />
                  <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>No posts yet — start the conversation</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.postCard}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.primaryMid }}>{item.author_name}</Text>
                  <Text style={{ fontSize: 14, color: Colors.textPrimary, marginTop: 6, lineHeight: 20 }}>{item.body}</Text>
                </View>
              )}
            />
          )}

          {notice ? (
            <Text style={{ fontSize: 12, color: Colors.error, paddingHorizontal: 20, paddingBottom: 6 }}>{notice}</Text>
          ) : null}

          {isMember ? (
            <View style={styles.inputBar}>
              <View style={styles.inputPill}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Post to the group..."
                  placeholderTextColor={Colors.textMuted}
                  style={{ fontSize: 15, color: Colors.textPrimary }}
                />
              </View>
              <Pressable onPress={send} style={styles.sendBtn}>
                <Ionicons name="send" size={20} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.joinBar}>
              <Text style={{ flex: 1, fontSize: 14, color: Colors.textSecondary }}>Join this group to post</Text>
              <Pressable onPress={join} style={styles.joinBtn}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.actionText }}>Join</Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="flash-outline" size={56} color={Colors.primaryLight} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 14 }}>Live group chat</Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
            {isMember
              ? 'Real-time messages with everyone in this group.'
              : 'Join the group to take part in the live chat.'}
          </Text>
          {isMember ? (
            <AppButton
              label="Open chat"
              onPress={() => router.push({
                pathname: '/community/chat',
                params: { groupId: group.id, groupName: group.name },
              })}
              style={{ width: '100%', marginTop: 20 }}
            />
          ) : (
            <AppButton label="Join group" onPress={join} style={{ width: '100%', marginTop: 20 }} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  postCard: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 14, marginBottom: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  inputPill: { flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.action, alignItems: 'center', justifyContent: 'center' },
  joinBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  joinBtn: { backgroundColor: Colors.action, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
});
