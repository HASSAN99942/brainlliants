import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { useSendMessage, useUsage } from '../../src/features/ai/hooks';
import { ChatMessage } from '../../src/features/ai/api';

export default function AiChat() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const listRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: t('ai.chatGreeting') },
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
      setMessages((m) => [...m, { role: 'model', content: quota ? t('ai.quotaReached') : t('error') }]);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color={colors.textPrimary} /></Pressable>
        <Text style={styles.title}>{t('ai.tutorTitle')}</Text>
        <View style={styles.enChip}><Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>EN</Text></View>
      </View>

      {showBanner && !(usage?.is_pro) && (
        <View style={styles.banner}>
          <Text style={{ flex: 1, fontSize: 13, color: '#7A4B00' }}>
            {t('ai.bannerUsed', { used: usage?.used ?? 0, limit: usage?.limit ?? 20 })} ·{' '}
            <Text style={{ color: colors.action, textDecorationLine: 'underline', fontWeight: '500' }}>{t('ai.upgradeUnlimited')}</Text>
          </Text>
          <Pressable onPress={() => setShowBanner(false)}><Ionicons name="close" size={18} color={colors.textSecondary} /></Pressable>
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
            <TextInput value={input} onChangeText={setInput} placeholder={t('ai.inputPlaceholder')} placeholderTextColor={colors.textMuted}
              style={{ fontSize: 15, color: colors.textPrimary }} multiline onSubmitEditing={onSend} />
          </View>
          <Pressable onPress={onSend} style={[styles.sendBtn, { backgroundColor: send.isPending ? colors.actionDisabled : colors.action }]}>
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isUser = msg.role === 'user';
  if (msg.content === '__typing__') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 }}>
        <Avatar />
        <View style={[styles.bubble, styles.aiBubble, { flexDirection: 'row', gap: 4 }]}>
          {[0.4, 0.7, 1].map((o, i) => <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primaryMid, opacity: o }} />)}
        </View>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-end', marginBottom: 12 }}>
      {!isUser && <Avatar />}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={{ fontSize: 15, lineHeight: 21, color: isUser ? '#fff' : colors.textPrimary }}>{msg.content}</Text>
      </View>
    </View>
  );
}
function Avatar() {
  const { colors } = useTheme();
  return (
    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>B</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  enChip: { backgroundColor: c.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10 },
  aiBubble: { backgroundColor: c.primaryLight, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: c.primary, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  inputPill: { flex: 1, backgroundColor: c.primaryLight, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
