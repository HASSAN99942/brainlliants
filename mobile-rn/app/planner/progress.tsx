import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../../src/core/constants/colors';
import { useTheme } from '../../src/core/theme';
import { AppButton } from '../../src/shared/components/AppButton';
import { plannerApi, Progress } from '../../src/features/planner/api';

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [data, setData] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);

  const load = async () => {
    try { setData(await plannerApi.getProgress()); } catch { /* keep last state */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const week = data?.week ?? [];
  const maxMinutes = Math.max(1, ...week.map((w) => w.minutes));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('settings.progress')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : !data ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>{t('planner.loadFailed')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.flameCircle, { backgroundColor: colors.actionDisabled }]}><Ionicons name="flame" size={32} color={colors.action} /></View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.textPrimary }}>
                {t('planner.streak', { count: data.streak })}
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                {t('planner.bestStreak', { count: data.best_streak })}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <StatCard value={`${data.total_hours}h`} label={t('stats.hours')} />
            <StatCard value={`${data.quizzes_this_month}`} label={t('stats.quizzes')} />
            <StatCard value={`${data.ai_used}/${data.ai_limit ?? '∞'}`} label={t('planner.aiUsed')} />
          </View>

          <View style={styles.chartCard}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.textPrimary }}>{t('planner.thisWeek')}</Text>
            <View style={styles.chart}>
              {week.map((d, i) => {
                const height = Math.max(4, (d.minutes / maxMinutes) * 100);
                const fill = d.is_today ? colors.action : d.minutes > 0 ? colors.primaryMid : colors.primaryLight;
                return (
                  <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                      <View style={{ width: 24, height, borderRadius: 6, backgroundColor: fill }} />
                    </View>
                    <Text style={{
                      fontSize: 12, marginTop: 8,
                      fontWeight: d.is_today ? 'bold' : 'normal',
                      color: d.is_today ? colors.action : colors.textSecondary,
                    }}>
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <AppButton label={t('planner.logSession')} onPress={() => setSheet(true)} style={{ marginTop: 20 }} />
        </ScrollView>
      )}

      {sheet ? (
        <LogSheet
          onClose={() => setSheet(false)}
          onLog={async (minutes) => {
            try { await plannerApi.logSession(minutes); } catch { /* ignore */ }
            setSheet(false);
            load();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{
      flex: 1, backgroundColor: colors.cardSurface, borderRadius: 16, borderWidth: 0.5,
      borderColor: colors.inputBorder, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center',
    }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function LogSheet({ onClose, onLog }: { onClose: () => void; onLog: (minutes: number) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [minutes, setMinutes] = useState(45);
  const [saving, setSaving] = useState(false);

  const submit = () => {
    if (minutes <= 0 || saving) return;
    setSaving(true);
    onLog(Math.round(minutes));
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={backdropStyle} onPress={onClose} />
      <View style={[sheetStyle, { backgroundColor: colors.cardSurface }]}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textPrimary }}>{t('planner.logSession')}</Text>
        <Text style={{ fontSize: 40, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginTop: 20 }}>
          {Math.round(minutes)} min
        </Text>
        <Slider
          style={{ marginTop: 16 }}
          minimumValue={0}
          maximumValue={180}
          step={5}
          value={minutes}
          minimumTrackTintColor={colors.action}
          maximumTrackTintColor={colors.primaryLight}
          thumbTintColor={colors.action}
          onValueChange={setMinutes}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>0 min</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>180 min</Text>
        </View>
        <AppButton
          label={t('planner.logIt')}
          loading={saving}
          disabled={minutes <= 0}
          onPress={submit}
          style={{ marginTop: 24 }}
        />
      </View>
    </Modal>
  );
}

const backdropStyle = { flex: 1 as const, backgroundColor: 'rgba(0,0,0,0.3)' };
const sheetStyle = { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 };

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  flameCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  chartCard: { backgroundColor: c.cardSurface, borderRadius: 16, borderWidth: 0.5, borderColor: c.inputBorder, padding: 20, marginTop: 20 },
  chart: { flexDirection: 'row', height: 140, marginTop: 20, alignItems: 'flex-end' },
});
