import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../src/core/constants/colors';
import { AppButton } from '../src/shared/components/AppButton';
import { authApi, parseApiError } from '../src/features/auth/api';
import { useAuthStore } from '../src/features/auth/store';

export default function Login() {
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);

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
          <Pressable onPress={() => setLang('en')}><Text style={{ color: lang === 'en' ? Colors.textSecondary : Colors.textMuted }}>EN</Text></Pressable>
          <Pressable onPress={() => setLang('fr')} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: lang === 'fr' ? Colors.primary : 'transparent' }}>
            <Text style={{ fontWeight: '600', color: lang === 'fr' ? '#fff' : Colors.textMuted }}>FR</Text>
          </Pressable>
        </View>
        <View style={styles.logo}><Text style={styles.logoText}>B</Text></View>
        <Text style={styles.welcome}>{lang === 'fr' ? 'Bon retour' : 'Welcome back'}</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="kofi@example.com" placeholderTextColor={Colors.textMuted} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Text style={styles.label}>Password</Text>
        <View style={styles.pwRow}>
          <TextInput style={{ flex: 1, fontSize: 15, color: Colors.textPrimary }} placeholder="••••••••" placeholderTextColor={Colors.textMuted} secureTextEntry={!show} value={password} onChangeText={setPassword} />
          <Pressable onPress={() => setShow(!show)}><Text style={{ color: Colors.textMuted }}>{show ? 'Hide' : 'Show'}</Text></Pressable>
        </View>
        <Pressable style={{ alignSelf: 'flex-end', marginTop: 8 }}><Text style={{ color: Colors.primary, fontWeight: '500', fontSize: 14 }}>Forgot password?</Text></Pressable>

        {error ? <View style={styles.errBox}><Text style={{ color: Colors.error, fontSize: 13 }}>{error}</Text></View> : null}

        <AppButton label={lang === 'fr' ? 'Se connecter' : 'Log in'} loading={loading} onPress={submit} style={{ marginTop: 20 }} />

        <View style={styles.divider}><View style={styles.line} /><Text style={{ color: Colors.textSecondary, marginHorizontal: 12 }}>or</Text><View style={styles.line} /></View>
        <SocialBtn label="Continue with Google" />
        <View style={{ height: 12 }} />
        <SocialBtn label="Continue with Facebook" />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Don't have an account? </Text>
          <Pressable onPress={() => router.replace('/register')}><Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>Register</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
function SocialBtn({ label }: { label: string }) {
  return <Pressable style={styles.social}><Text style={{ color: Colors.textPrimary, fontSize: 14 }}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  logo: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 28 },
  logoText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  welcome: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'center', marginTop: 20, marginBottom: 32 },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: Colors.inputBorder, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  pwRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: Colors.inputBorder, paddingHorizontal: 16, paddingVertical: 14 },
  errBox: { backgroundColor: Colors.errorLight, borderRadius: 10, padding: 12, marginTop: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  line: { flex: 1, height: 0.5, backgroundColor: Colors.inputBorder },
  social: { height: 52, borderRadius: 14, borderWidth: 0.5, borderColor: Colors.inputBorder, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});
