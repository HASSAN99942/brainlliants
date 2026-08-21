import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '../src/core/constants/colors';
import { useAuthStore } from '../src/features/auth/store';

export default function Splash() {
  const { t } = useTranslation();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? '/(tabs)' : '/onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <View style={styles.logo}><Text style={styles.logoText}>B</Text></View>
        <Text style={styles.name}>{t('appName')}</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
        <View style={styles.bar} />
      </Animated.View>
    </View>
  );
}
// Theme-independent screen: fixed brand background in light and dark mode.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 40, fontWeight: 'bold', color: Colors.primary },
  name: { fontSize: 28, fontWeight: '600', color: '#fff', marginTop: 20 },
  tagline: { fontSize: 14, color: '#AFA9EC', marginTop: 8, textAlign: 'center' },
  bar: { width: 120, height: 4, borderRadius: 2, backgroundColor: Colors.action, marginTop: 60 },
});
