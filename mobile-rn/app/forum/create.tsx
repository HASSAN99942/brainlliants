import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';
import { useCreatePost } from '../../src/features/forum/hooks';
import { ForumScope } from '../../src/features/forum/api';
import { useAuthStore } from '../../src/features/auth/store';
import { EXAM_LABEL } from '../../src/features/content/labels';

export default function CreatePost() {
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope: ForumScope =
    params.scope === 'exam' || params.scope === 'specialty' ? params.scope : 'general';

  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const create = useCreatePost();

  const roomName =
    scope === 'general' ? 'the General forum'
      : scope === 'exam' ? `the ${user?.exam_level ? EXAM_LABEL[user.exam_level] ?? user.exam_level : 'Exam'} forum`
        : `the ${user?.specialty?.trim() || 'Specialty'} forum`;

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  const submit = async () => {
    if (!canSubmit) return;
    setError('');
    try {
      await create.mutateAsync({ title: title.trim(), body: body.trim(), scope });
      router.back();
    } catch (e) {
      // The backend refuses a room the profile does not qualify for — surface
      // its message rather than a generic failure.
      const detail = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(detail ?? 'Could not post your question. Check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Ask the community</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={styles.roomBanner}>
            <Ionicons name="people-outline" size={16} color={Colors.primaryMid} />
            <Text style={{ flex: 1, fontSize: 13, color: Colors.primaryMid, marginLeft: 8 }}>
              Posting to {roomName}
            </Text>
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. How do I balance redox equations?"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 20 }]}>Details</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Describe what you've tried and where you're stuck..."
            placeholderTextColor={Colors.textMuted}
            multiline
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <Ionicons name="sparkles" size={16} color={Colors.primaryMid} />
            <Text style={{ fontSize: 14, color: Colors.primaryMid, marginLeft: 8 }}>AI will answer within seconds</Text>
          </View>

          {error ? <Text style={{ color: Colors.error, fontSize: 13, marginTop: 12 }}>{error}</Text> : null}

          <AppButton
            label="Post question"
            loading={create.isPending}
            disabled={!canSubmit}
            onPress={submit}
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  roomBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16, fontSize: 15, color: Colors.textPrimary },
});
