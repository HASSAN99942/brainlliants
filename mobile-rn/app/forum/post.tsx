import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { forumApi, ForumPostDetail, ForumReply } from '../../src/features/forum/api';
import { useAuthStore } from '../../src/features/auth/store';

// Light-blue AI answer card — design-spec colours, not part of the token set.
const AI_BG = '#E6F1FB';
const AI_ACCENT = '#2E75B6';
const AI_TEXT = '#2D5580';

const POLL_MS = 3000;
const POLL_MAX = 20; // give up after ~60s so a failed generation doesn't poll forever

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const [post, setPost] = useState<ForumPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPoll = () => {
    if (pollRef.current) return;
    attemptsRef.current = 0;
    pollRef.current = setInterval(async () => {
      attemptsRef.current += 1;
      try {
        const data = await forumApi.getPost(id);
        if (!mountedRef.current) return stopPoll();
        if (data.ai_answer) { setPost(data); stopPoll(); }
      } catch {
        // transient — the next tick retries
      }
      if (attemptsRef.current >= POLL_MAX) stopPoll();
    }, POLL_MS);
  };

  const load = async () => {
    try {
      const data = await forumApi.getPost(id);
      if (!mountedRef.current) return;
      setPost(data);
      if (!data.ai_answer) startPoll();
    } catch {
      // leave whatever is on screen
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; stopPoll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    setReply('');
    try {
      await forumApi.reply(id, text);
      await load();
    } catch {
      setReply(text); // put it back so the user doesn't lose their words
    } finally {
      setSending(false);
    }
  };

  // Patch just the touched reply — no need to refetch the whole thread.
  const upvote = async (rid: string) => {
    try {
      const res = await forumApi.upvote(rid);
      setPost((prev) => prev && {
        ...prev,
        replies: prev.replies.map((r) => (r.id === rid ? { ...r, ...res } : r)),
      });
    } catch { /* ignore */ }
  };

  const markBest = async (rid: string) => {
    try {
      await forumApi.markBest(rid);
      await load();
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.appbar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Question</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>This question could not be loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAuthor = !!currentUser && post.author?.id === currentUser.id;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Question</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={{ flex: 1, fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, lineHeight: 30 }}>
              {post.title}
            </Text>
            {post.is_resolved ? (
              <View style={styles.resolvedChip}>
                <Ionicons name="checkmark" size={12} color={Colors.success} />
                <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '500', marginLeft: 4 }}>Resolved</Text>
              </View>
            ) : null}
          </View>

          <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 10, lineHeight: 22 }}>{post.body}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <View style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{post.author?.initials}</Text>
            </View>
            <Text style={{ fontSize: 14, color: Colors.primaryMid, fontWeight: '500', marginLeft: 10 }}>
              {post.author?.display_name}
            </Text>
            {post.author?.is_teacher ? (
              <View style={styles.teacherBadge}>
                <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '500' }}>Teacher</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.aiCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="hardware-chip-outline" size={20} color={AI_ACCENT} />
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: AI_ACCENT, marginLeft: 8 }}>AI Answer</Text>
            </View>
            {post.ai_answer ? (
              <Text style={{ fontSize: 14, color: AI_TEXT, lineHeight: 21, marginTop: 10 }}>{post.ai_answer}</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <ActivityIndicator size="small" color={AI_ACCENT} />
                <Text style={{ fontSize: 14, color: AI_TEXT, marginLeft: 10 }}>Generating answer...</Text>
              </View>
            )}
          </View>

          <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 24, marginBottom: 12 }}>
            {post.reply_count} {post.reply_count === 1 ? 'Reply' : 'Replies'}
          </Text>

          {post.replies.length === 0 ? (
            <Text style={{ fontSize: 14, color: Colors.textSecondary }}>No replies yet — be the first to help.</Text>
          ) : (
            post.replies.map((r) => (
              <ReplyCard
                key={r.id}
                reply={r}
                isAuthor={isAuthor}
                onUpvote={() => upvote(r.id)}
                onMarkBest={() => markBest(r.id)}
              />
            ))
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputPill}>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Write a reply..."
              placeholderTextColor={Colors.textMuted}
              style={{ fontSize: 15, color: Colors.textPrimary, maxHeight: 100 }}
              multiline
            />
          </View>
          <Pressable onPress={sendReply} style={[styles.sendBtn, sending && { opacity: 0.6 }]}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReplyCard({ reply, isAuthor, onUpvote, onMarkBest }: {
  reply: ForumReply; isAuthor: boolean; onUpvote: () => void; onMarkBest: () => void;
}) {
  return (
    <View style={styles.replyCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.avatar, { backgroundColor: Colors.primaryMid, width: 36, height: 36, borderRadius: 18 }]}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{reply.author.initials}</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginLeft: 10 }}>
          {reply.author.display_name}
        </Text>
        {reply.author.is_teacher ? (
          <View style={styles.teacherBadge}>
            <Text style={{ fontSize: 11, color: Colors.success, fontWeight: '500' }}>Teacher</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        {reply.is_best_answer ? (
          <View style={styles.bestChip}>
            <Ionicons name="checkmark" size={12} color="#fff" />
            <Text style={{ fontSize: 11, color: '#fff', fontWeight: '500', marginLeft: 4 }}>Best Answer</Text>
          </View>
        ) : null}
      </View>

      <Text style={{ fontSize: 14, color: Colors.textSecondary, lineHeight: 21, marginTop: 10 }}>{reply.body}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
        <Pressable
          onPress={onUpvote}
          style={[styles.upvotePill, reply.user_has_upvoted && { backgroundColor: Colors.successLight, borderColor: Colors.success }]}
        >
          <Ionicons name="chevron-up" size={16} color={reply.user_has_upvoted ? Colors.success : Colors.textSecondary} />
          <Text style={{ fontSize: 13, fontWeight: '500', marginLeft: 4, color: reply.user_has_upvoted ? Colors.success : Colors.textSecondary }}>
            {reply.upvote_count}
          </Text>
        </Pressable>
        {isAuthor && !reply.is_best_answer ? (
          <Pressable onPress={onMarkBest} style={{ marginLeft: 10, padding: 4 }}>
            <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '500' }}>Mark as best</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  aiCard: { backgroundColor: AI_BG, borderRadius: 16, padding: 16, marginTop: 20 },
  replyCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16, marginBottom: 10 },
  teacherBadge: { backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, marginLeft: 6 },
  resolvedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 8 },
  bestChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  upvotePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: Colors.inputBorder },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  inputPill: { flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 30, paddingHorizontal: 18, paddingVertical: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.action, alignItems: 'center', justifyContent: 'center' },
});
