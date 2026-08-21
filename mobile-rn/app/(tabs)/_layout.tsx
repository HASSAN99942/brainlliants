import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/core/theme';
import { initNotifications } from '../../src/core/network/notifications';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Register the push token once the user is inside the app (post-login).
  // Silently no-ops in Expo Go / without an EAS project.
  useEffect(() => { initNotifications(); }, []);

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.navActive,
      tabBarInactiveTintColor: colors.navInactive,
      tabBarStyle: { backgroundColor: colors.cardSurface, borderTopColor: colors.inputBorder, borderTopWidth: 0.5 },
      tabBarLabelStyle: { fontSize: 10 },
    }}>
      <Tabs.Screen name="index" options={{ title: t('home'), tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="learn" options={{ title: t('learn'), tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="resources" options={{ title: t('resources'), tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="forum" options={{ title: t('forum'), tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: t('profile'), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
