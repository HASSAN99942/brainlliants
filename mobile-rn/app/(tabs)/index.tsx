import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/core/constants/colors';
import { useAuthStore } from '../../src/features/auth/store';
import { initials } from '../../src/shared/types/user';

const EXAM_LABEL: Record<string, string> = { GCE_AL: 'GCE A/L', GCE_OL: 'GCE O/L', BAC_D: 'BAC D', BEPC: 'BEPC', HND: 'HND' };

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 15, color: Colors.textSecondary }}>{greeting},</Text>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary }}>{user?.first_name ?? 'Student'}</Text>
          </View>
          <View style={styles.avatar}><Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{user ? initials(user) : 'B'}</Text></View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View style={styles.chip}><Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '500' }}>{EXAM_LABEL[user?.exam_level ?? ''] ?? 'GCE A/L'} · {user?.specialty ?? 'Science'}</Text></View>
          <View style={[styles.chip, { backgroundColor: Colors.successLight }]}><Text style={{ color: Colors.success, fontSize: 12, fontWeight: '500' }}>● Online</Text></View>
        </View>

        <View style={styles.hero}>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Continue studying</Text>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 6 }}>Mathematics — Chapter 5</Text>
          <View style={styles.track}><View style={styles.fill} /></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>62%</Text>
            <Text style={{ color: Colors.action, fontSize: 13, fontWeight: '600' }}>Resume ›</Text>
          </View>
        </View>

        <Text style={styles.section}>Today's features</Text>
        <View style={styles.featCard}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.textPrimary }}>Chat with AI</Text>
          <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>Ask anything about your exam</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, backgroundColor: Colors.primaryLight },
  hero: { backgroundColor: Colors.primary, borderRadius: 20, padding: 20, marginTop: 20 },
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 14 },
  fill: { width: '62%', height: 6, backgroundColor: Colors.primaryMid, borderRadius: 3 },
  section: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 20, marginBottom: 10 },
  featCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: Colors.inputBorder },
});
