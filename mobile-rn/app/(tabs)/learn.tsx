import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/core/constants/colors';
import { useUsage } from '../../src/features/ai/hooks';
import { isEnabled } from '../../src/core/config/features';

export default function AiHub() {
  const { data: usage } = useUsage();

  // limit === null means unlimited — either the user is Pro, or the backend has
  // lifted the caps because payments are switched off.
  const capped = !!usage && !usage.is_pro && usage.limit != null;
  const progress = capped ? Math.min(usage.used / (usage.limit || 1), 1) : 1;

  const usageLabel = !usage
    ? 'Checking your usage…'
    : usage.is_pro
      ? 'Pro — Unlimited queries'
      : usage.limit == null
        ? 'Unlimited queries'
        : `${usage.used} of ${usage.limit} free queries used`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.h1}>AI learning tools</Text>

        <View style={styles.usageCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.textPrimary }}>
              {usageLabel}
            </Text>
            {capped && isEnabled('payments') ? (
              <Pressable onPress={() => router.push('/paywall')}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.action }}>Upgrade</Text>
              </Pressable>
            ) : null}
          </View>
          {capped ? <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View> : null}
        </View>

        <FeatureCard icon="cloud-upload-outline" title="Chat with AI" sub="Ask anything about your exam" onPress={() => router.push('/ai/chat')} />
        <FeatureCard icon="document-text-outline" title="Summarise notes" sub="Upload PDF or Word" onPress={() => router.push('/ai/summarise')} />
        <FeatureCard icon="time-outline" title="Past sessions" sub="View saved summaries" onPress={() => router.push('/ai/sessions')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, sub, onPress }: { icon: any; title: string; sub: string; onPress: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}><Ionicons name={icon} size={24} color={Colors.primaryMid} /></View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>{sub}</Text>
      </View>
      <Pressable onPress={onPress} style={styles.openBtn}><Text style={{ fontSize: 13, fontWeight: '600', color: Colors.actionText }}>Open</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  h1: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, marginBottom: 20 },
  usageCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16, marginBottom: 14 },
  track: { height: 6, backgroundColor: Colors.inputBorder, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: Colors.action, borderRadius: 3 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 0.5, borderColor: Colors.inputBorder, padding: 16, marginBottom: 10 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  openBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.action },
});
