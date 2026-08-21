import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { GroupSocket, ChatMessagePayload, SocketError } from '../../src/core/network/websocket';
import { plannerApi } from '../../src/features/planner/api';
import { useAuthStore } from '../../src/features/auth/store';

export default function GroupChat() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName?: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const listRef = useRef<FlatList<ChatMessagePayload>>(null);
  const socketRef = useRef<GroupSocket | null>(null);

  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<SocketError>(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Last 50 messages first, so the thread isn't empty while the socket opens.
      try {
        const history = await plannerApi.getChatHistory(groupId);
        if (mounted) setMessages(history);
      } catch {
        // 403 = not a member; the socket close code reports it too
      }

      const socket = new GroupSocket(groupId);
      socket.onStatus = (c) => { if (mounted) setConnected(c); };
      socket.onError = (reason) => { if (mounted) setSocketError(reason); };
      socket.onMessage = (msg) => {
        if (!mounted) return;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      };
      socketRef.current = socket;
      await socket.connect();
    })();

    return () => { mounted = false; socketRef.current?.disconnect(); };
  }, [groupId]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    if (socketRef.current?.send(text)) setInput('');
  };

  const errorText =
    socketError === 'not_member' ? t('community.errNotMember')
      : socketError === 'unauthenticated' ? t('community.errSessionExpired')
        : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{groupName ?? t('community.groupChat')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="ellipse" size={10} color={connected ? colors.success : colors.textMuted} />
          <Text style={{ fontSize: 13, fontWeight: '500', marginLeft: 6, color: connected ? colors.success : colors.textMuted }}>
            {connected ? t('community.connected') : socketError ? t('community.offlineStatus') : t('community.connecting')}
          </Text>
        </View>
      </View>

      {errorText ? (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={{ flex: 1, fontSize: 13, color: colors.error, marginLeft: 8 }}>{errorText}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="chatbubbles-outline" size={56} color={colors.primaryLight} />
              <Text style={{ color: colors.textSecondary, marginTop: 12 }}>{t('community.noMessages')}</Text>
            </View>
          }
          renderItem={({ item }) => <Bubble msg={item} mine={item.sender_id === currentUser?.id} />}
        />

        <View style={styles.inputBar}>
          <View style={styles.inputPill}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('community.messageGroup')}
              placeholderTextColor={colors.textMuted}
              style={{ fontSize: 15, color: colors.textPrimary, maxHeight: 100 }}
              multiline
            />
          </View>
          <Pressable
            onPress={send}
            style={[styles.sendBtn, { backgroundColor: connected ? colors.action : colors.actionDisabled }]}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg, mine }: { msg: ChatMessagePayload; mine: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!mine ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginLeft: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.primaryMid }}>{msg.sender_name}</Text>
          {msg.is_teacher ? (
            <View style={{ backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 6 }}>
              <Text style={{ fontSize: 11, color: colors.success, fontWeight: '500' }}>{t('social.teacher')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View
        style={[{
          maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10,
        }, mine
          ? { backgroundColor: colors.primary, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 }
          : { backgroundColor: colors.primaryLight, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 4 }]}
      >
        <Text style={{ fontSize: 15, lineHeight: 21, color: mine ? '#fff' : colors.textPrimary }}>{msg.body}</Text>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: 'bold', color: c.textPrimary },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.errorLight, paddingHorizontal: 16, paddingVertical: 10 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10 },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  inputPill: { flex: 1, backgroundColor: c.bg, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
