import { useEffect } from 'react';
import { router } from 'expo-router';
import { isEnabled, FeatureKey } from './features';
import { useAuthStore } from '../../features/auth/store';

/**
 * Defence in depth for deep links: bounces off a screen whose feature is off.
 *
 * Returns whether the feature is enabled so the caller can render `null` for the
 * frame before the redirect lands, instead of flashing a hidden screen.
 *
 * Nothing guards `/(tabs)` itself, so an unauthenticated deep link is sent to
 * the root splash — which routes by auth state — rather than into the app shell.
 */
export function useFeatureGuard(key: FeatureKey): boolean {
  const enabled = isEnabled(key);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!enabled) router.replace(isAuthenticated ? '/(tabs)' : '/');
  }, [enabled, isAuthenticated]);

  return enabled;
}
