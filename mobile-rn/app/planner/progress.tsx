import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Colors } from '../../src/core/constants/colors';
import { AppButton } from '../../src/shared/components/AppButton';
import { plannerApi, Progress } from '../../src/features/planner/api';

export default function ProgressScreen() {
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
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>My progress</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : !data ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>Progress could not be loaded.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.flameCircle}><Ionicons name="flame" size={32} color={Colors.action} /></View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: Colors.textPrimary }}>
                {data.streak} day{data.streak === 1 ? '' : 's'} streak
              </Text>
              <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>
                Keep it up — best streak: {data.best_streak} days
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <StatCard value={`${data.total_hours}h`} label="Total hours" />
            <StatCard value={`${data.quizzes_this_month}`} label="Quizzes this month" />
            <StatCard value={`${data.ai_used}/${data.ai_limit ?? '∞'}`} label="AI queries used" />
          </View>

          <View style={styles.chartCard}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary }}>This week</Text>
            <View style={styles.chart}>
              {week.map((d, i) => {
                const height = Math.max(4, (d.minutes / maxMinutes) * 100);
                const fill = d.is_today ? Colors.action : d.minutes > 0 ? Colors.primaryMid : Colors.primaryLight;
                return (
                  <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                      <View style={{ width: 24, height, borderRadius: 6, backgroundColor: fill }} />
                    </View>
                    <Text style={{
                      fontSize: 12, marginTop: 8,
                      fontWeight: d.is_today ? 'bold' : 'normal',
                      color: d.is_today ? Colors.action : Colors.textSecondary,
                    }}>
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <AppButton label="Log study session" onPress={() => setSheet(true)} style={{ marginTop: 20 }} />
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
  return (
    <View style={styles.statCard}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary }}>{value}</Text>
      <Text style={{ fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function LogSheet({ onClose, onLog }: { onClose: () => void; onLog: (minutes: number) => void }) {
  const [minutes, setMinutes] = useState(45);
  const [saving, setSaving] = useState(false);

  const submit = () => {
    if (minutes <= 0 || saving) return;
    setSaving(true);
    onLog(Math.round(minutes));
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary }}>Log study session</Text>
        <Text style={{ fontSize: 40, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginTop: 20 }}>
          {Math.round(minutes)} min
        </Text>
        <Slider
          style={{ marginTop: 16 }}
          minimumValue={0}
          maximumValue={180}
          step={5}
          value={minutes}
          minimumTrackTintColor={Colors.action}
          maximumTrackTintColor={Colors.primaryLight}
          thumbTintColor={Colors.action}
          onValueChange={setMinutes}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>0 min</Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary }}>180 min</Text>
        </View>
        <AppButton
          label="Log session"
          loading={saving}
          disabled={minutes <= 0}
          onPress={submit}
          style={{ marginTop: 24 }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  flameCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FAEEDA', alignItems: 'center', justifyContent: 'center' },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center' },
  chartCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 20, marginTop: 20 },
  chart: { flexDirection: 'row', height: 140, marginTop: 20, alignItems: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 32 },
});
