import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { setAppLanguage } from '../../src/core/i18n';
import { useAuthStore } from '../../src/features/auth/store';
import { initials, fullName } from '../../src/shared/types/user';
import { authApi } from '../../src/features/auth/api';
import { plannerApi } from '../../src/features/planner/api';
import { paymentApi } from '../../src/features/payments/api';
import { isEnabled } from '../../src/core/config/features';

const EXAM_LABEL: Record<string, string> = {
  GCE_OL: 'GCE O/L', GCE_AL: 'GCE A/L',
  BAC_A: 'BAC A', BAC_C: 'BAC C', BAC_D: 'BAC D', BAC_E: 'BAC E', BAC_TECH: 'BAC Technique',
  BEPC: 'BEPC', PROBATOIRE: 'Probatoire', HND: 'HND', CEP: 'CEP',
};

interface Stats { streak: number; quizzes: number; hours: number }

export default function Profile() {
  const { t } = useTranslation();
  const { mode, colors, setPref } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [lang, setLang] = useState<'en' | 'fr'>(user?.interface_language ?? 'en');
  const [langBusy, setLangBusy] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isPro, setIsPro] = useState(user?.is_pro ?? false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Re-check on focus so returning from a successful payment flips the card.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      plannerApi.getProgress()
        .then((p) => {
          if (cancelled) return;
          setStats({ streak: p.streak, quizzes: p.quizzes_this_month, hours: p.total_hours });
        })
        .catch(() => { /* stats are non-critical */ });

      // Pointless round trip while payments are hidden — the card is not rendered.
      if (isEnabled('payments')) {
        paymentApi.getCurrentSubscription()
          .then((s) => { if (!cancelled) setIsPro(s.is_pro); })
          .catch(() => { if (!cancelled) setIsPro(user?.is_pro ?? false); });
      }

      return () => { cancelled = true; };
    }, [user?.is_pro]),
  );

  const chooseLang = async (next: 'en' | 'fr') => {
    if (next === lang || langBusy) return;
    const previous = lang;
    setLang(next);
    setAppLanguage(next); // optimistic: flip UI strings immediately
    setLangBusy(true);
    try {
      await authApi.changeLanguage(next);
      if (user) setUser({ ...user, interface_language: next });
    } catch {
      setLang(previous); // keep the UI honest if the server refused
      setAppLanguage(previous);
    } finally {
      setLangBusy(false);
    }
  };

  const toggleDark = (value: boolean) => setPref(value ? 'dark' : 'light');

  const doLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const examChip = [EXAM_LABEL[user?.exam_level ?? ''] ?? user?.exam_level, user?.specialty]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>
              {user ? initials(user) : 'B'}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginTop: 14 }}>
            {user ? fullName(user) : t('student')}
          </Text>
          {examChip ? (
            <View style={styles.examChip}>
              <Text style={{ fontSize: 13, color: colors.textPrimary }}>{examChip}</Text>
            </View>
          ) : null}
        </View>

        {isEnabled('payments') ? (
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={styles.subCard}>
            <View style={[styles.subIcon, { backgroundColor: isPro ? colors.successLight : colors.primaryLight }]}>
              <Ionicons
                name={isPro ? 'checkmark' : 'star-outline'}
                size={22}
                color={isPro ? colors.success : colors.textSecondary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: isPro ? colors.success : colors.textSecondary }}>
                {isPro ? t('plan.pro') : t('plan.free')}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                {isPro ? t('plan.proSubtitle') : t('plan.freeSubtitle')}
              </Text>
            </View>
            {!isPro && (
              <Pressable onPress={() => router.push('/paywall')} hitSlop={8}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.action }}>{t('plan.upgrade')}</Text>
              </Pressable>
            )}
          </View>
        </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 16 }}>
          <StatCard value={`${stats?.streak ?? 0}`} emoji="🔥" label={t('stats.streak')} />
          <StatCard value={`${stats?.quizzes ?? 0}`} label={t('stats.quizzes')} />
          <StatCard value={`${stats?.hours ?? 0}h`} label={t('stats.hours')} />
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={styles.settingsCard}>
            {isEnabled('schoolModule') ? (
              <>
                <SettingsRow icon="school-outline" label={t('settings.mySchools')} onPress={() => router.push('/profile/schools')} />
                <Divider />
              </>
            ) : null}
            <SettingsRow icon="bookmark-outline" label={t('settings.bookmarks')} onPress={() => router.push('/content/bookmarks')} />
            <Divider />
            <SettingsRow icon="calendar-outline" label={t('settings.timetable')} onPress={() => router.push('/planner/timetable')} />
            <Divider />
            <SettingsRow icon="bar-chart-outline" label={t('settings.progress')} onPress={() => router.push('/planner/progress')} />
            <Divider />

            <View style={styles.row}>
              <Ionicons name="chatbubble-outline" size={22} color={colors.primaryMid} />
              <Text style={styles.rowLabel}>{t('settings.language')}</Text>
              {langBusy ? <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} /> : null}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['en', 'fr'] as const).map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => chooseLang(l)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                      backgroundColor: lang === l ? colors.primary : 'transparent',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: lang === l ? '#fff' : colors.textMuted }}>
                      {l.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Divider />

            <View style={styles.row}>
              <Ionicons name="moon-outline" size={22} color={colors.primaryMid} />
              <Text style={styles.rowLabel}>{t('settings.darkMode')}</Text>
              <Switch
                value={mode === 'dark'}
                onValueChange={toggleDark}
                trackColor={{ true: colors.primary, false: colors.inputBorder }}
                thumbColor="#fff"
              />
            </View>
            <Divider />

            <SettingsRow icon="log-out-outline" label={t('settings.logout')} destructive onPress={doLogout} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ value, emoji, label }: { value: string; emoji?: string; label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.statCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.textPrimary }}>{value}</Text>
        {emoji ? <Text style={{ fontSize: 18, marginLeft: 4 }}>{emoji}</Text> : null}
      </View>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function SettingsRow({ icon, label, onPress, destructive }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Ionicons name={icon} size={22} color={destructive ? colors.error : colors.primaryMid} />
      <Text style={[styles.rowLabel, destructive && { color: colors.error }]}>{label}</Text>
      {!destructive && <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />}
    </Pressable>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 0.5, backgroundColor: colors.inputBorder, marginLeft: 54 }} />;
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: c.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  examChip: {
    backgroundColor: c.primaryLight, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 50, marginTop: 8,
  },
  subCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, borderRadius: 16,
    borderWidth: 0.5, borderColor: c.inputBorder, padding: 16,
  },
  subIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statCard: {
    flex: 1, backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5,
    borderColor: c.inputBorder, paddingVertical: 16, alignItems: 'center',
  },
  settingsCard: {
    backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  rowLabel: { flex: 1, fontSize: 16, color: c.textPrimary, marginLeft: 16 },
});
