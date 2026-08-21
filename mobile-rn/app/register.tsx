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
import { useOnboardingStore, EXAM_CODE } from '../src/features/auth/onboardingStore';
import { SpecialtyPicker } from '../src/shared/components/SpecialtyPicker';

export default function Register() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<'student' | 'teacher'>('student');
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subsystem, examLevel } = useOnboardingStore();
  const examCode = examLevel ? EXAM_CODE[examLevel] : undefined;
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);

  const [f, setF] = useState({ first: '', last: '', email: '', phone: '', dob: '', password: '', confirm: '', specialty: '', institution: '' });
  const set = (k: keyof typeof f) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const pickLang = (lng: 'en' | 'fr') => { setLang(lng); setAppLanguage(lng); };

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
        <Text style={styles.h1}>{t('auth.createAccountTitle')}</Text>

        <View style={styles.tabBar}>
          {(['student', 'teacher'] as const).map((tabKey) => (
            <Pressable key={tabKey} onPress={() => setTab(tabKey)} style={[styles.tab, tab === tabKey && styles.tabActive]}>
              <Text style={{ fontWeight: '600', color: tab === tabKey ? colors.primary : colors.textSecondary }}>
                {tabKey === 'student' ? t('student') : t('auth.teacher')}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <Field style={{ flex: 1 }} label={t('auth.firstName')} placeholder="Kofi" value={f.first} onChangeText={set('first')} />
          <Field style={{ flex: 1 }} label={t('auth.lastName')} placeholder="Abena" value={f.last} onChangeText={set('last')} />
        </View>
        <Field label={t('email')} placeholder="kofi@example.com" keyboardType="email-address" autoCapitalize="none" value={f.email} onChangeText={set('email')} />
        <View>
          <Text style={styles.label}>{t('auth.phone')}</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+237</Text>
            <TextInput style={styles.phoneInput} placeholder="6 XX XX XX XX" placeholderTextColor={colors.textMuted} keyboardType="phone-pad" value={f.phone} onChangeText={set('phone')} />
          </View>
        </View>
        <Field label={t('password')} placeholder="••••••••" secureTextEntry value={f.password} onChangeText={set('password')} />
        <Field label={t('auth.confirmPassword')} placeholder="••••••••" secureTextEntry value={f.confirm} onChangeText={set('confirm')} />
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
          <Field label={t('auth.institution')} placeholder="e.g. Lycée Général Leclerc" value={f.institution} onChangeText={set('institution')} />
        )}

        <View style={styles.langRow}>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{t('auth.appLanguage')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <LangBtn label="EN" active={lang === 'en'} onPress={() => pickLang('en')} />
            <LangBtn label="FR" active={lang === 'fr'} onPress={() => pickLang('fr')} />
          </View>
        </View>

        {error ? <View style={styles.errBox}><Text style={{ color: colors.error, fontSize: 13 }}>{error}</Text></View> : null}

        <AppButton label={t('register')} loading={loading} onPress={submit} style={{ marginTop: 24 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t('auth.haveAccount')} </Text>
          <Pressable onPress={() => router.replace('/login')}><Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>{t('login')}</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, style, ...props }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ marginTop: 14 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.textMuted}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={[styles.input, { borderColor: focused ? colors.inputBorderFocus : colors.inputBorder, borderWidth: focused ? 1.5 : 0.5, backgroundColor: colors.cardSurface, color: colors.textPrimary }]} />
    </View>
  );
}
function LangBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: active ? colors.primary : 'transparent' }}>
    <Text style={{ fontSize: 14, fontWeight: '600', color: active ? '#fff' : colors.textMuted }}>{label}</Text>
  </Pressable>;
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  h1: { fontSize: 26, fontWeight: 'bold', color: c.textPrimary },
  tabBar: { flexDirection: 'row', backgroundColor: c.primaryLight, borderRadius: 12, padding: 4, marginTop: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: c.cardSurface },
  label: { fontSize: 13, color: c.textSecondary, marginBottom: 6 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.cardSurface, borderRadius: 12, borderWidth: 0.5, borderColor: c.inputBorder, paddingHorizontal: 16 },
  prefix: { color: c.primary, fontWeight: 'bold', fontSize: 15, marginRight: 8 },
  phoneInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: c.textPrimary },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  errBox: { backgroundColor: c.errorLight, borderRadius: 10, padding: 12, marginTop: 12 },
});
