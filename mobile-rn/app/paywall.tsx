import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/core/constants/colors';
import { useFeatureGuard } from '../src/core/config/useFeatureGuard';

const FEATURES = [
  'Unlimited AI tutor queries',
  'Unlimited paper downloads',
  'Offline access to everything',
  'Priority AI answers in the forum',
  'Ad-free experience',
];

const ORANGE = '#FF6600';

export default function Paywall() {
  const enabled = useFeatureGuard('payments');

  const goPay = (method: 'mtn_momo' | 'orange_money') =>
    router.push({ pathname: '/payment', params: { method } });

  if (!enabled) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <Pressable onPress={() => router.back()} style={styles.close} hitSlop={8}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </Pressable>

        <Text style={styles.h1}>Upgrade to Brailliants Pro</Text>

        <View style={{ marginTop: 24 }}>
          {FEATURES.map((f) => (
            <View key={f} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={16} color={Colors.success} />
              </View>
              <Text style={{ fontSize: 15, color: Colors.textPrimary, marginLeft: 14, flex: 1 }}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 16 }} />

        <View style={styles.priceCard}>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#fff' }}>1,000 XAF</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            per month · cancel anytime
          </Text>
        </View>

        <Pressable
          onPress={() => goPay('mtn_momo')}
          style={[styles.payBtn, { backgroundColor: Colors.action }]}
        >
          <Text style={[styles.payBtnText, { color: Colors.actionText }]}>Pay with MTN Mobile Money</Text>
        </Pressable>

        <Pressable
          onPress={() => goPay('orange_money')}
          style={[styles.payBtn, { backgroundColor: ORANGE }]}
        >
          <Text style={styles.payBtnText}>Pay with Orange Money</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={{ alignItems: 'center', marginTop: 14 }}>
          <Text style={{ fontSize: 14, color: Colors.textMuted }}>Maybe later</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  close: {
    alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  h1: { fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginTop: 12 },
  checkCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  priceCard: {
    backgroundColor: Colors.primary, borderRadius: 20, paddingVertical: 28,
    alignItems: 'center', marginTop: 24,
  },
  payBtn: { height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  payBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
