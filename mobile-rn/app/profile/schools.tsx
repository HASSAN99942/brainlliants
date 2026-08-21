import React from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/core/theme';
import { AppButton } from '../../src/shared/components/AppButton';
import { useMyEnrolments } from '../../src/features/enrolment/hooks';
import { Enrolment, EnrolmentStatus } from '../../src/features/enrolment/api';
import { useFeatureGuard } from '../../src/core/config/useFeatureGuard';

// Pending keeps its warm amber tint in both themes — it maps to the action family.
const STATUS_TONE: Record<EnrolmentStatus, keyof typeof STATUS_KEYS> = {
  approved: 'approved',
  pending: 'pending',
  rejected: 'rejected',
};
const STATUS_KEYS = {
  approved: { bg: 'successLight', fg: 'success', key: 'school.statusApproved' },
  pending: { bg: 'actionDisabled', fg: 'actionText', key: 'school.statusPending' },
  rejected: { bg: 'errorLight', fg: 'error', key: 'school.statusRejected' },
} as const;

export default function MySchools() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const enabled = useFeatureGuard('schoolModule');
  const { data, isLoading, refetch } = useMyEnrolments();

  // Coming back from the search screen should show a freshly created request.
  useFocusEffect(React.useCallback(() => { refetch(); }, [refetch]));

  if (!enabled) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'left', 'right']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary }}>{t('settings.mySchools')}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="school-outline" size={56} color={colors.primaryLight} />
              <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 12 }}>
                {t('school.emptyTitle')}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' }}>
                {t('school.emptyHint')}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: Enrolment }) => {
            const tone = STATUS_KEYS[STATUS_TONE[item.status] ?? 'pending'];
            return (
              <View style={{
                backgroundColor: colors.cardSurface, borderRadius: 16, borderWidth: 0.5,
                borderColor: colors.inputBorder, padding: 16, marginBottom: 10,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>
                    {item.school.name}
                  </Text>
                  <View style={{ backgroundColor: colors[tone.bg], paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginLeft: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: colors[tone.fg] }}>{t(tone.key)}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6 }}>
                  {[item.school.town, item.school.region].filter(Boolean).join(' · ')}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                  {t('school.matriculeShort')}: {item.matricule}
                </Text>
                {item.status === 'approved' ? (
                  <Text style={{ fontSize: 12, color: colors.success, marginTop: 8 }}>
                    {t('school.approvedHint')}
                  </Text>
                ) : null}
                {item.status === 'rejected' ? (
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
                    {t('school.rejectedHint')}
                  </Text>
                ) : null}
              </View>
            );
          }}
          ListFooterComponent={
            <AppButton
              label={t('school.findSchool')}
              onPress={() => router.push('/profile/school-search')}
              style={{ marginTop: 12 }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
