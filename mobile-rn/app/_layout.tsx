import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import '../src/core/i18n';
import { useAuthStore } from '../src/features/auth/store';
import { useTheme } from '../src/core/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function RootLayout() {
  const loadCachedUser = useAuthStore((s) => s.loadCachedUser);
  const { mode, colors } = useTheme();
  useEffect(() => { loadCachedUser(); }, [loadCachedUser]);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
