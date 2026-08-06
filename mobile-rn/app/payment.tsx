import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/core/constants/colors';
import { AppButton } from '../src/shared/components/AppButton';
import {
  paymentApi, isValidPhone, normalisePhone, PaymentMethod, PRO_PRICE_XAF,
} from '../src/features/payments/api';
import { authApi, parseApiError } from '../src/features/auth/api';
import { useAuthStore } from '../src/features/auth/store';
import { useFeatureGuard } from '../src/core/config/useFeatureGuard';

type Step = 'form' | 'processing' | 'success' | 'failed';

const POLL_MS = 4000;
/** ~100 s of polling before we give up and let the user retry. */
const MAX_POLLS = 25;

const MTN_YELLOW = '#F7C948';
const ORANGE = '#FF6600';

export default function Payment() {
  const enabled = useFeatureGuard('payments');
  const params = useLocalSearchParams<{ method?: string }>();
  const method: PaymentMethod = params.method === 'orange_money' ? 'orange_money' : 'mtn_momo';
  const isMTN = method === 'mtn_momo';

  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState<Step>('form');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subIdRef = useRef<string | null>(null);
  const attemptsRef = useRef(0);
  const mounted = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; stopPolling(); };
  }, [stopPolling]);

  /** Pull the fresh profile so is_pro propagates to every screen. */
  const refreshProfile = useCallback(async () => {
    try {
      const user = await authApi.getProfile();
      if (mounted.current) setUser(user);
    } catch { /* the payment still succeeded */ }
  }, [setUser]);

  const check = useCallback(async () => {
    if (!subIdRef.current) return;
    attemptsRef.current += 1;

    if (attemptsRef.current > MAX_POLLS) {
      stopPolling();
      if (!mounted.current) return;
      setError('We did not get a confirmation in time. If you approved the payment, check your subscription in Profile.');
      setStep('failed');
      return;
    }

    try {
      const res = await paymentApi.checkStatus(subIdRef.current);
      if (!mounted.current) return;
      if (res.status === 'active') {
        stopPolling();
        await refreshProfile();
        if (mounted.current) setStep('success');
      } else if (res.status === 'failed' || res.status === 'expired') {
        stopPolling();
        setError('Payment failed. Please try again.');
        setStep('failed');
      }
    } catch {
      // Transient network problem — keep polling until MAX_POLLS.
    }
  }, [refreshProfile, stopPolling]);

  const pay = async () => {
    if (!isValidPhone(phone)) {
      setError('Enter a valid mobile money number, e.g. 237670000000.');
      return;
    }
    setError(null);
    setStep('processing');
    attemptsRef.current = 0;

    try {
      const res = await paymentApi.initiate(normalisePhone(phone), method);
      if (!mounted.current) return;
      subIdRef.current = res.subscription_id;
      setSimulated(res.simulated);

      if (res.status === 'active') {
        await refreshProfile();
        if (mounted.current) setStep('success');
        return;
      }
      stopPolling();
      pollRef.current = setInterval(check, POLL_MS);
    } catch (e) {
      if (!mounted.current) return;
      setError(parseApiError(e));
      setStep('failed');
    }
  };

  const goBack = () => {
    stopPolling();
    router.back();
  };

  // After every hook, so the hook order stays stable.
  if (!enabled) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.appbar}>
        <Pressable onPress={goBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Payment</Text>
      </View>

      {step === 'form' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
            <View style={[styles.methodTile, { backgroundColor: isMTN ? MTN_YELLOW : ORANGE }]}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>{isMTN ? 'MTN' : 'OM'}</Text>
            </View>

            <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.primary, marginTop: 20 }}>
              Pay {PRO_PRICE_XAF.toLocaleString('en-US')} XAF
            </Text>
            <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>
              {isMTN ? 'MTN Mobile Money · monthly' : 'Orange Money · monthly'}
            </Text>

            <View style={{ width: '100%', marginTop: 32 }}>
              <Text style={{ fontSize: 14, color: Colors.textSecondary, marginBottom: 8 }}>
                Mobile money number
              </Text>
              <TextInput
                value={phone}
                onChangeText={(v) => { setPhone(v); if (error) setError(null); }}
                keyboardType="phone-pad"
                placeholder="237XXXXXXXXX"
                placeholderTextColor={Colors.textMuted}
                maxLength={17}
                style={styles.input}
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={{ color: Colors.error, fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            <AppButton
              label="Pay Now"
              onPress={pay}
              disabled={!isValidPhone(phone)}
              style={{ marginTop: 24, width: '100%' }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {step === 'processing' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.textPrimary, marginTop: 24 }}>
            Confirm on your phone...
          </Text>
          <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 8 }}>
            Waiting for payment confirmation
          </Text>
          {simulated ? (
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 16, textAlign: 'center', paddingHorizontal: 40 }}>
              Sandbox simulation — no CamPay credentials configured on the server.
            </Text>
          ) : null}
        </View>
      )}

      {step === 'success' && (
        <View style={[styles.centered, { padding: 32 }]}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color={Colors.success} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 28 }}>
            You are now Pro! 🎉
          </Text>
          <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
            Unlimited AI queries and downloads are unlocked on your account.
          </Text>
          <AppButton
            label="Start learning"
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: 40, width: '100%' }}
          />
        </View>
      )}

      {step === 'failed' && (
        <View style={[styles.centered, { padding: 32 }]}>
          <View style={styles.failCircle}>
            <Ionicons name="close" size={40} color={Colors.error} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 24 }}>
            Payment failed
          </Text>
          <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            {error}
          </Text>
          <AppButton
            label="Try again"
            onPress={() => { setError(null); setStep('form'); }}
            style={{ marginTop: 32, width: '100%' }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  appbar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  methodTile: {
    width: 72, height: 72, borderRadius: 16, alignItems: 'center',
    justifyContent: 'center', marginTop: 28,
  },
  input: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: Colors.inputBorder,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary,
  },
  errorBox: {
    width: '100%', backgroundColor: Colors.errorLight, borderRadius: 10,
    padding: 12, marginTop: 12,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  failCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.errorLight,
    alignItems: 'center', justifyContent: 'center',
  },
});
