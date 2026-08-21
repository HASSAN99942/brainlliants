import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { useUsage } from '../../src/features/ai/hooks';
import { isEnabled } from '../../src/core/config/features';

export default function AiHub() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: usage } = useUsage();

  // limit === null means unlimited — either the user is Pro, or the backend has
  // lifted the caps because payments are switched off.
  const capped = !!usage && !usage.is_pro && usage.limit != null;
  const progress = capped ? Math.min(usage.used / (usage.limit || 1), 1) : 1;

  const usageLabel = !usage
    ? t('learn.checkingUsage')
    : usage.is_pro
      ? t('learn.proUnlimited')
      : usage.limit == null
        ? t('learn.unlimited')
        : t('learn.queriesUsed', { used: usage.used, limit: usage.limit });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.h1}>{t('learn.title')}</Text>

        <View style={styles.usageCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
              {usageLabel}
            </Text>
            {capped && isEnabled('payments') ? (
              <Pressable onPress={() => router.push('/paywall')}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.action }}>{t('plan.upgrade')}</Text>
              </Pressable>
            ) : null}
          </View>
          {capped ? <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View> : null}
        </View>

        <FeatureCard icon="cloud-upload-outline" title={t('learn.chatTitle')} sub={t('learn.chatSub')} onPress={() => router.push('/ai/chat')} />
        <FeatureCard icon="document-text-outline" title={t('learn.summariseTitle')} sub={t('learn.summariseSub')} onPress={() => router.push('/ai/summarise')} />
        <FeatureCard icon="time-outline" title={t('learn.sessionsTitle')} sub={t('learn.sessionsSub')} onPress={() => router.push('/ai/sessions')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, sub, onPress }: { icon: any; title: string; sub: string; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}><Ionicons name={icon} size={24} color={colors.primaryMid} /></View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{sub}</Text>
      </View>
      <Pressable onPress={onPress} style={styles.openBtn}><Text style={{ fontSize: 13, fontWeight: '600', color: colors.actionText }}>{t('learn.open')}</Text></Pressable>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  h1: { fontSize: 28, fontWeight: 'bold', color: c.textPrimary, marginBottom: 20 },
  usageCard: { backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, padding: 16, marginBottom: 14 },
  track: { height: 6, backgroundColor: c.inputBorder, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: c.action, borderRadius: 3 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, padding: 16, marginBottom: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center' },
  openBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: c.action },
});
