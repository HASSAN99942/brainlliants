import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../src/core/constants/colors';
import { useTheme } from '../src/core/theme';
import { AppButton } from '../src/shared/components/AppButton';
import { authApi, parseApiError } from '../src/features/auth/api';
import { useAuthStore } from '../src/features/auth/store';

export default function Otp() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { userId, email } = useLocalSearchParams<{ userId: string; email: string }>();
  const setUser = useAuthStore((s) => s.setUser);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const code = digits.join('');

  useEffect(() => {
    const iv = setInterval(() => setSeconds((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { if (code.length === 6) verify(); }, [code]);

  const onChange = (i: number, v: string) => {
    if (v.length > 1) v = v.slice(-1);
    const next = [...digits]; next[i] = v; setDigits(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (!v && i > 0) inputs.current[i - 1]?.focus();
  };

  const verify = async () => {
    if (code.length < 6 || loading) return;
    setLoading(true); setError(null);
    try {
      const user = await authApi.verifyOtp(userId, code);
      setUser(user);
      router.replace('/(tabs)');
    } catch (e) {
      setError(parseApiError(e));
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const resend = async () => {
    await authApi.resendOtp(userId);
    setSeconds(60);
    setDigits(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ padding: 24 }}>
        <Pressable onPress={() => router.back()}><Text style={{ fontSize: 22, color: colors.textPrimary }}>‹</Text></Pressable>
        <Text style={styles.h1}>{t('auth.checkEmail')}</Text>
        <Text style={styles.sub}>{t('auth.codeSentTo', { email })}</Text>
        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <TextInput key={i} ref={(r) => { inputs.current[i] = r; }} value={d}
              onChangeText={(v) => onChange(i, v)} keyboardType="number-pad" maxLength={1}
              style={styles.box} textAlign="center" />
          ))}
        </View>
        {error ? <Text style={{ color: colors.error, fontSize: 13, marginBottom: 12 }}>{error}</Text> : null}
        <AppButton label={t('auth.verify')} loading={loading} disabled={code.length < 6} onPress={verify} />
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          {seconds > 0
            ? <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                {t('auth.resendIn', { seconds: `${seconds}s` })}
              </Text>
            : <Pressable onPress={resend}><Text style={{ color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' }}>{t('auth.resend')}</Text></Pressable>}
        </View>
      </View>
    </SafeAreaView>
  );
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  h1: { fontSize: 26, fontWeight: 'bold', color: c.textPrimary, marginTop: 28 },
  sub: { fontSize: 15, color: c.textSecondary, marginTop: 8 },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 36, marginBottom: 24 },
  box: { width: 46, height: 56, backgroundColor: c.cardSurface, borderRadius: 12, fontSize: 22, fontWeight: 'bold', color: c.textPrimary },
});
