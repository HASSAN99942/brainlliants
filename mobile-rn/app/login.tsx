import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ThemeColors } from '../src/core/constants/colors';
import { useTheme } from '../src/core/theme';
import { setAppLanguage } from '../src/core/i18n';
import { AppButton } from '../src/shared/components/AppButton';
import { authApi, parseApiError } from '../src/features/auth/api';
import { useAuthStore } from '../src/features/auth/store';

export default function Login() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

  const pickLang = (lng: 'en' | 'fr') => setAppLanguage(lng);

  const submit = async () => {
    setError(null); setLoading(true);
    try {
      const user = await authApi.login(email, password);
      setUser(user);
      router.replace('/(tabs)');
    } catch (e) {
      setError(parseApiError(e));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <Pressable onPress={() => pickLang('en')}><Text style={{ color: colors.textSecondary }}>EN</Text></Pressable>
          <Pressable onPress={() => pickLang('fr')} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.primaryLight }}>
            <Text style={{ fontWeight: '600', color: colors.primary }}>FR</Text>
          </Pressable>
        </View>
        <View style={styles.logo}><Text style={styles.logoText}>B</Text></View>
        <Text style={styles.welcome}>{t('auth.welcome')}</Text>

        <Text style={styles.label}>{t('email')}</Text>
        <TextInput style={styles.input} placeholder="kofi@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Text style={styles.label}>{t('password')}</Text>
        <View style={styles.pwRow}>
          <TextInput style={{ flex: 1, fontSize: 15, color: colors.textPrimary }} placeholder="••••••••" placeholderTextColor={colors.textMuted} secureTextEntry={!show} value={password} onChangeText={setPassword} />
          <Pressable onPress={() => setShow(!show)}><Text style={{ color: colors.textMuted }}>{show ? t('auth.hide') : t('auth.show')}</Text></Pressable>
        </View>
        <Pressable style={{ alignSelf: 'flex-end', marginTop: 8 }}><Text style={{ color: colors.primary, fontWeight: '500', fontSize: 14 }}>{t('auth.forgotPassword')}</Text></Pressable>

        {error ? <View style={styles.errBox}><Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text></View> : null}

        <AppButton label={t('login')} loading={loading} onPress={submit} style={{ marginTop: 20 }} />

        <View style={styles.divider}><View style={styles.line} /><Text style={{ color: colors.textSecondary, marginHorizontal: 12 }}>{t('auth.or')}</Text><View style={styles.line} /></View>
        <SocialBtn label={t('auth.continueGoogle')} />
        <View style={{ height: 12 }} />
        <SocialBtn label={t('auth.continueFacebook')} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t('auth.noAccount')} </Text>
          <Pressable onPress={() => router.replace('/register')}><Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>{t('register')}</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function SocialBtn({ label }: { label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Pressable style={styles.social}><Text style={{ color: colors.textPrimary, fontSize: 14 }}>{label}</Text></Pressable>;
}
const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  logo: { width: 68, height: 68, borderRadius: 34, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 28 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  welcome: { fontSize: 28, fontWeight: 'bold', color: c.textPrimary, textAlign: 'center', marginTop: 20, marginBottom: 32 },
  label: { fontSize: 13, color: c.textSecondary, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: c.cardSurface, borderRadius: 12, borderWidth: 0.5, borderColor: c.inputBorder, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: c.textPrimary },
  pwRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, borderRadius: 12, borderWidth: 0.5, borderColor: c.inputBorder, paddingHorizontal: 16, paddingVertical: 14 },
  errBox: { backgroundColor: c.errorLight, borderRadius: 10, padding: 12, marginTop: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  line: { flex: 1, height: 0.5, backgroundColor: c.inputBorder },
  social: { height: 52, borderRadius: 14, borderWidth: 0.5, borderColor: c.inputBorder, backgroundColor: c.cardSurface, alignItems: 'center', justifyContent: 'center' },
});
