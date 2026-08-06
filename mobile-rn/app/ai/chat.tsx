import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { useSendMessage, useUsage } from '../../src/features/ai/hooks';
import { ChatMessage } from '../../src/features/ai/api';

export default function AiChat() {
  const listRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Hello! I'm your Brailliants AI tutor. What would you like to study today?" },
  ]);
  const { data: usage } = useUsage();
  const send = useSendMessage();

  const onSend = async () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    setInput('');
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const res = await send.mutateAsync(next);
      setMessages((m) => [...m, { role: 'model', content: res.reply }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e: any) {
      const quota = e?.response?.status === 403;
      setMessages((m) => [...m, { role: 'model', content: quota ? 'You have reached your free query limit. Upgrade to Pro for unlimited access.' : 'Something went wrong. Please try again.' }]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={Colors.textPrimary} /></Pressable>
        <Text style={styles.title}>AI tutor</Text>
        <View style={styles.enChip}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>EN</Text></View>
      </View>

      {showBanner && !(usage?.is_pro) && (
        <View style={styles.banner}>
          <Text style={{ flex: 1, fontSize: 13, color: '#7A4B00' }}>
            {usage?.used ?? 0} of {usage?.limit ?? 20} queries used · <Text style={{ color: Colors.action, textDecorationLine: 'underline', fontWeight: '500' }}>Upgrade for unlimited</Text>
          </Text>
          <Pressable onPress={() => setShowBanner(false)}><Ionicons name="close" size={18} color={Colors.textSecondary} /></Pressable>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={send.isPending ? [...messages, { role: 'model', content: '__typing__' } as ChatMessage] : messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => <Bubble msg={item} />}
        />
        <View style={styles.inputBar}>
          <View style={styles.inputPill}>
            <TextInput value={input} onChangeText={setInput} placeholder="Ask your AI tutor..." placeholderTextColor={Colors.textMuted}
              style={{ fontSize: 15, color: Colors.textPrimary }} multiline onSubmitEditing={onSend} />
          </View>
          <Pressable onPress={onSend} style={[styles.sendBtn, { backgroundColor: send.isPending ? Colors.actionDisabled : Colors.action }]}>
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  if (msg.content === '__typing__') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 }}>
        <Avatar />
        <View style={[styles.bubble, styles.aiBubble, { flexDirection: 'row', gap: 4 }]}>
          {[0.4, 0.7, 1].map((o, i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primaryMid, opacity: o }} />)}
        </View>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', marginBottom: 12 }}>
      {!isUser && <Avatar />}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={{ fontSize: 15, lineHeight: 21, color: isUser ? '#fff' : Colors.textPrimary }}>{msg.content}</Text>
      </View>
    </View>
  );
}
function Avatar() {
  return <View style={styles.avatar}><Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>B</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  enChip: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10 },
  aiBubble: { backgroundColor: Colors.primaryLight, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: Colors.primary, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  inputPill: { flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
