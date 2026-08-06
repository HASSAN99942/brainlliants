import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../src/core/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { initNotifications } from '../../src/core/network/notifications';

export default function TabsLayout() {
  // Register the push token once the user is inside the app (post-login).
  // Silently no-ops in Expo Go / without an EAS project.
  useEffect(() => { initNotifications(); }, []);

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.navActive,
      tabBarInactiveTintColor: Colors.navInactive,
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: Colors.inputBorder, borderTopWidth: 0.5 },
      tabBarLabelStyle: { fontSize: 10 },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="learn" options={{ title: 'Learn', tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="resources" options={{ title: 'Resources', tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="forum" options={{ title: 'Forum', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
