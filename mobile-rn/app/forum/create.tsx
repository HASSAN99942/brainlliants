import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { AppButton } from '../../src/shared/components/AppButton';
import { useCreatePost } from '../../src/features/forum/hooks';
import { ForumScope } from '../../src/features/forum/api';
import { useAuthStore } from '../../src/features/auth/store';
import { EXAM_LABEL } from '../../src/features/content/labels';

export default function CreatePost() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ scope?: string }>();
  const scope: ForumScope =
    params.scope === 'exam' || params.scope === 'specialty' ? params.scope : 'general';

  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const create = useCreatePost();

  // Room name is built from data; only the surrounding sentence translates.
  const roomName =
    scope === 'general' ? t('forum.roomGeneral')
      : scope === 'exam' ? user?.exam_level ? EXAM_LABEL[user.exam_level] ?? user.exam_level : t('social.examFallback')
        : user?.specialty?.trim() || t('social.specialtyFallback');

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
      setError(detail ?? t('forum.postError'));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('forum.askCommunity')}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <View style={styles.roomBanner}>
            <Ionicons name="people-outline" size={16} color={colors.primaryMid} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.primaryMid, marginLeft: 8 }}>
              {t('forum.postingTo', { room: roomName })}
            </Text>
          </View>

          <Text style={styles.label}>{t('forum.titleLabel')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('forum.titlePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 20 }]}>{t('forum.detailsLabel')}</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t('forum.detailsPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <Ionicons name="sparkles" size={16} color={colors.primaryMid} />
            <Text style={{ fontSize: 14, color: colors.primaryMid, marginLeft: 8 }}>{t('forum.aiHint')}</Text>
          </View>

          {error ? <Text style={{ color: colors.error, fontSize: 13, marginTop: 12 }}>{error}</Text> : null}

          <AppButton
            label={t('forum.postQuestion')}
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  label: { fontSize: 14, color: c.textSecondary, marginBottom: 8 },
  roomBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.primaryLight,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  input: { backgroundColor: c.cardSurface, borderRadius: 12, borderWidth: 0.5, borderColor: c.inputBorder, padding: 16, fontSize: 15, color: c.textPrimary },
});
