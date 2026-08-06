import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../src/core/constants/colors';
import { AppButton } from '../src/shared/components/AppButton';
import { authApi, parseApiError } from '../src/features/auth/api';
import { useOnboardingStore, EXAM_CODE } from '../src/features/auth/onboardingStore';
import { SpecialtyPicker } from '../src/shared/components/SpecialtyPicker';

export default function Register() {
  const [tab, setTab] = useState<'student' | 'teacher'>('student');
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subsystem, examLevel } = useOnboardingStore();
  const examCode = examLevel ? EXAM_CODE[examLevel] : undefined;
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);

  const [f, setF] = useState({ first: '', last: '', email: '', phone: '', dob: '', password: '', confirm: '', specialty: '', institution: '' });
  const set = (k: keyof typeof f) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    setError(null); setLoading(true);
    try {
      const base = {
        first_name: f.first, last_name: f.last, email: f.email,
        phone: `+237${f.phone}`, password: f.password, confirm_password: f.confirm,
        interface_language: lang,
      };
      const res = tab === 'student'
        ? await authApi.registerStudent({
            ...base,
            specialty: f.specialty,
            specialty_ref: specialtyId,
            subsystem: subsystem ?? undefined,
            exam_level: examCode,
          })
        : await authApi.registerTeacher({ ...base, institution: f.institution, subjects_taught: [] });
      router.push({ pathname: '/otp', params: { userId: res.user_id, email: f.email } });
    } catch (e) {
      setError(parseApiError(e));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Create your account</Text>

        <View style={styles.tabBar}>
          {(['student', 'teacher'] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={{ fontWeight: '600', color: tab === t ? Colors.primary : Colors.textSecondary }}>
                {t === 'student' ? 'Student' : 'Teacher'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <Field style={{ flex: 1 }} label="First name" placeholder="Kofi" value={f.first} onChangeText={set('first')} />
          <Field style={{ flex: 1 }} label="Last name" placeholder="Abena" value={f.last} onChangeText={set('last')} />
        </View>
        <Field label="Email" placeholder="kofi@example.com" keyboardType="email-address" autoCapitalize="none" value={f.email} onChangeText={set('email')} />
        <View>
          <Text style={styles.label}>Phone</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+237</Text>
            <TextInput style={styles.phoneInput} placeholder="6 XX XX XX XX" placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" value={f.phone} onChangeText={set('phone')} />
          </View>
        </View>
        <Field label="Password" placeholder="••••••••" secureTextEntry value={f.password} onChangeText={set('password')} />
        <Field label="Confirm password" placeholder="••••••••" secureTextEntry value={f.confirm} onChangeText={set('confirm')} />
        {tab === 'student' ? (
          <SpecialtyPicker
            subsystem={subsystem ?? undefined}
            exam={examCode}
            onChange={({ specialtyId: id, specialtyName }) => {
              setSpecialtyId(id);
              setF((prev) => ({ ...prev, specialty: specialtyName }));
            }}
          />
        ) : (
          <Field label="Institution" placeholder="e.g. Lycée Général Leclerc" value={f.institution} onChangeText={set('institution')} />
        )}

        <View style={styles.langRow}>
          <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>App language</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LangBtn label="EN" active={lang === 'en'} onPress={() => setLang('en')} />
            <LangBtn label="FR" active={lang === 'fr'} onPress={() => setLang('fr')} />
          </View>
        </View>

        {error ? <View style={styles.errBox}><Text style={{ color: Colors.error, fontSize: 13 }}>{error}</Text></View> : null}

        <AppButton label="Create account" loading={loading} onPress={submit} style={{ marginTop: 24 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Already have an account? </Text>
          <Pressable onPress={() => router.replace('/login')}><Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>Log in</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, style, ...props }: any) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginTop: 14 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor={Colors.textMuted}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={[styles.input, { borderColor: focused ? Colors.primary : Colors.inputBorder, borderWidth: focused ? 1.5 : 0.5 }]} />
    </View>
  );
}
function LangBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: active ? Colors.primary : 'transparent' }}>
    <Text style={{ fontSize: 14, fontWeight: '600', color: active ? '#fff' : Colors.textMuted }}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  h1: { fontSize: 26, fontWeight: 'bold', color: Colors.textPrimary },
  tabBar: { flexDirection: 'row', backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 4, marginTop: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#fff' },
  label: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  phoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: Colors.inputBorder, paddingHorizontal: 16 },
  prefix: { color: Colors.primary, fontWeight: 'bold', fontSize: 15, marginRight: 8 },
  phoneInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  errBox: { backgroundColor: Colors.errorLight, borderRadius: 10, padding: 12, marginTop: 12 },
});
