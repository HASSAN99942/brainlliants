import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { useAuthStore } from '../../src/features/auth/store';
import { initials } from '../../src/shared/types/user';

const EXAM_LABEL: Record<string, string> = { GCE_AL: 'GCE A/L', GCE_OL: 'GCE O/L', BAC_D: 'BAC D', BEPC: 'BEPC', HND: 'HND' };

export default function Home() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('home.morning') : hour < 17 ? t('home.afternoon') : t('home.evening');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 15, color: colors.textSecondary }}>{greeting},</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.textPrimary }}>{user?.first_name ?? t('student')}</Text>
          </View>
          <View style={styles.avatar}><Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{user ? initials(user) : 'B'}</Text></View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View style={styles.chip}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: '500' }}>{EXAM_LABEL[user?.exam_level ?? ''] ?? 'GCE A/L'} · {user?.specialty ?? 'Science'}</Text></View>
          <View style={[styles.chip, { backgroundColor: colors.successLight }]}><Text style={{ color: colors.success, fontSize: 12, fontWeight: '500' }}>● {t('home.online')}</Text></View>
        </View>

        <View style={styles.hero}>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{t('home.continueStudying')}</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 6 }}>{t('home.heroChapter')}</Text>
          <View style={styles.track}><View style={styles.fill} /></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>62%</Text>
            <Text style={{ color: colors.action, fontSize: 13, fontWeight: '600' }}>{t('home.resume')}</Text>
          </View>
        </View>

        <Text style={styles.section}>{t('home.todaysFeatures')}</Text>
        <View style={styles.featCard}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{t('learn.chatTitle')}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{t('learn.chatSub')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, backgroundColor: c.primaryLight },
  hero: { backgroundColor: c.primary, borderRadius: 20, padding: 20, marginTop: 20 },
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 14 },
  fill: { width: '62%', height: 6, backgroundColor: c.primaryMid, borderRadius: 3 },
  section: { fontSize: 16, fontWeight: '600', color: c.textPrimary, marginTop: 20, marginBottom: 10 },
  featCard: { backgroundColor: c.cardSurface, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: c.inputBorder },
});
