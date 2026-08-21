import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { AppButton } from '../../src/shared/components/AppButton';
import { communityApi, Group, GroupPost, isNotMember } from '../../src/features/community/api';

export default function GroupDetail() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
          <Text style={{ color: colors.textSecondary }}>{t('community.groupNotFound')}</Text>
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
      setNotice(isNotMember(e) ? t('community.joinToPost') : t('community.postError'));
      if (isNotMember(e)) setIsMember(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{group.name}</Text>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.cardSurface }]}>
        {(['discussion', 'chat'] as const).map((tabKey) => (
          <Pressable
            key={tabKey}
            onPress={() => setTab(tabKey)}
            style={[styles.tab, tab === tabKey && { borderBottomColor: colors.action, borderBottomWidth: 2 }]}
          >
            <Text style={{ fontWeight: '600', color: tab === tabKey ? colors.primary : colors.textSecondary }}>
              {tabKey === 'discussion' ? t('community.discussion') : t('community.liveChat')}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'discussion' ? (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
          ) : (
            <FlatList
              data={posts}
              keyExtractor={(p) => p.id}
              contentContainerStyle={{ padding: 16 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                  <Ionicons name="chatbubble-outline" size={56} color={colors.primaryLight} />
                  <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{t('community.noPosts')}</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.postCard}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primaryMid }}>{item.author_name}</Text>
                  <Text style={{ fontSize: 14, color: colors.textPrimary, marginTop: 6, lineHeight: 20 }}>{item.body}</Text>
                </View>
              )}
            />
          )}

          {notice ? (
            <Text style={{ fontSize: 12, color: colors.error, paddingHorizontal: 20, paddingBottom: 6 }}>{notice}</Text>
          ) : null}

          {isMember ? (
            <View style={styles.inputBar}>
              <View style={styles.inputPill}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={t('community.postToGroup')}
                  placeholderTextColor={colors.textMuted}
                  style={{ fontSize: 15, color: colors.textPrimary }}
                />
              </View>
              <Pressable onPress={send} style={styles.sendBtn}>
                <Ionicons name="send" size={20} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.joinBar}>
              <Text style={{ flex: 1, fontSize: 14, color: colors.textSecondary }}>{t('community.joinToPostBar')}</Text>
              <Pressable onPress={join} style={styles.joinBtn}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.actionText }}>{t('community.join')}</Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="flash-outline" size={56} color={colors.primaryLight} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 14 }}>{t('community.liveGroupChat')}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
            {isMember ? t('community.realtimeHint') : t('community.joinForChatHint')}
          </Text>
          {isMember ? (
            <AppButton
              label={t('community.openChat')}
              onPress={() => router.push({
                pathname: '/community/chat',
                params: { groupId: group.id, groupName: group.name },
              })}
              style={{ width: '100%', marginTop: 20 }}
            />
          ) : (
            <AppButton label={t('community.joinGroup')} onPress={join} style={{ width: '100%', marginTop: 20 }} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: 'bold', color: c.textPrimary },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  postCard: { backgroundColor: c.cardSurface, borderRadius: 14, borderWidth: 0.5, borderColor: c.inputBorder, padding: 14, marginBottom: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  inputPill: { flex: 1, backgroundColor: c.primaryLight, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.action, alignItems: 'center', justifyContent: 'center' },
  joinBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  joinBtn: { backgroundColor: c.action, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
});
