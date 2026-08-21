import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../src/core/constants/colors';
import { useTheme } from '../src/core/theme';
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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      setError(t('pay.timeoutError'));
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
        setError(t('pay.failedError'));
        setStep('failed');
      }
    } catch {
      // Transient network problem — keep polling until MAX_POLLS.
    }
  }, [refreshProfile, stopPolling, t]);

  const pay = async () => {
    if (!isValidPhone(phone)) {
      setError(t('pay.invalidPhone'));
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
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>{t('pay.screenTitle')}</Text>
      </View>

      {step === 'form' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
            <View style={[styles.methodTile, { backgroundColor: isMTN ? MTN_YELLOW : ORANGE }]}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>{isMTN ? 'MTN' : 'OM'}</Text>
            </View>

            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginTop: 20 }}>
              Pay {PRO_PRICE_XAF.toLocaleString('en-US')} XAF
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
              {isMTN ? t('pay.mtnMonthly') : t('pay.omMonthly')}
            </Text>

            <View style={{ width: '100%', marginTop: 32 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
                {t('pay.phoneLabel')}
              </Text>
              <TextInput
                value={phone}
                onChangeText={(v) => { setPhone(v); if (error) setError(null); }}
                keyboardType="phone-pad"
                placeholder="237XXXXXXXXX"
                placeholderTextColor={colors.textMuted}
                maxLength={17}
                style={styles.input}
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            <AppButton
              label={t('pay.payNow')}
              onPress={pay}
              disabled={!isValidPhone(phone)}
              style={{ marginTop: 24, width: '100%' }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {step === 'processing' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.textPrimary, marginTop: 24 }}>
            {t('pay.confirmOnPhone')}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8 }}>
            {t('pay.waitingConfirmation')}
          </Text>
          {simulated ? (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 16, textAlign: 'center', paddingHorizontal: 40 }}>
              {t('pay.sandboxNote')}
            </Text>
          ) : null}
        </View>
      )}

      {step === 'success' && (
        <View style={[styles.centered, { padding: 32 }]}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color={colors.success} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginTop: 28 }}>
            {t('pay.successTitle')}
          </Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
            {t('pay.successBody')}
          </Text>
          <AppButton
            label={t('pay.startLearning')}
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: 40, width: '100%' }}
          />
        </View>
      )}

      {step === 'failed' && (
        <View style={[styles.centered, { padding: 32 }]}>
          <View style={styles.failCircle}>
            <Ionicons name="close" size={40} color={colors.error} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginTop: 24 }}>
            {t('pay.failedTitle')}
          </Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
            {error}
          </Text>
          <AppButton
            label={t('pay.tryAgain')}
            onPress={() => { setError(null); setStep('form'); }}
            style={{ marginTop: 32, width: '100%' }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  appbar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface,
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: c.textPrimary },
  methodTile: {
    width: 72, height: 72, borderRadius: 16, alignItems: 'center',
    justifyContent: 'center', marginTop: 28,
  },
  input: {
    backgroundColor: c.cardSurface, borderRadius: 12, borderWidth: 0.5, borderColor: c.inputBorder,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: c.textPrimary,
  },
  errorBox: {
    width: '100%', backgroundColor: c.errorLight, borderRadius: 10,
    padding: 12, marginTop: 12,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: c.successLight,
    alignItems: 'center', justifyContent: 'center',
  },
  failCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: c.errorLight,
    alignItems: 'center', justifyContent: 'center',
  },
});
