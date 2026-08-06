import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { GroupSocket, ChatMessagePayload, SocketError } from '../../src/core/network/websocket';
import { plannerApi } from '../../src/features/planner/api';
import { useAuthStore } from '../../src/features/auth/store';

export default function GroupChat() {
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
    socketError === 'not_member' ? 'Join this group to take part in the chat.'
      : socketError === 'unauthenticated' ? 'Your session expired — sign in again.'
        : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{groupName ?? 'Group chat'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="ellipse" size={10} color={connected ? Colors.success : Colors.textMuted} />
          <Text style={{ fontSize: 13, fontWeight: '500', marginLeft: 6, color: connected ? Colors.success : Colors.textMuted }}>
            {connected ? 'Connected' : socketError ? 'Offline' : 'Connecting...'}
          </Text>
        </View>
      </View>

      {errorText ? (
        <View style={styles.banner}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={{ flex: 1, fontSize: 13, color: Colors.error, marginLeft: 8 }}>{errorText}</Text>
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
              <Ionicons name="chatbubbles-outline" size={56} color={Colors.primaryLight} />
              <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>No messages yet — say hello</Text>
            </View>
          }
          renderItem={({ item }) => <Bubble msg={item} mine={item.sender_id === currentUser?.id} />}
        />

        <View style={styles.inputBar}>
          <View style={styles.inputPill}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message the group..."
              placeholderTextColor={Colors.textMuted}
              style={{ fontSize: 15, color: Colors.textPrimary, maxHeight: 100 }}
              multiline
            />
          </View>
          <Pressable
            onPress={send}
            style={[styles.sendBtn, { backgroundColor: connected ? Colors.action : Colors.actionDisabled }]}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg, mine }: { msg: ChatMessagePayload; mine: boolean }) {
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!mine ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginLeft: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.primaryMid }}>{msg.sender_name}</Text>
          {msg.is_teacher ? (
            <View style={styles.teacherBadge}>
              <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '500' }}>Teacher</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.bubble, mine ? styles.mine : styles.other]}>
        <Text style={{ fontSize: 15, lineHeight: 21, color: mine ? '#fff' : Colors.textPrimary }}>{msg.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: 17, fontWeight: 'bold', color: Colors.textPrimary },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.errorLight, paddingHorizontal: 16, paddingVertical: 10 },
  teacherBadge: { backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 6 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10 },
  other: { backgroundColor: Colors.primaryLight, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 4 },
  mine: { backgroundColor: Colors.primary, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  inputPill: { flex: 1, backgroundColor: Colors.bg, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
