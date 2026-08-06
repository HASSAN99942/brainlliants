/**
 * Feature flags for staged rollout.
 *
 * Nothing is deleted when a feature is hidden — routes, screens and API files
 * all stay in place. Flipping a flag reveals the feature everywhere it is gated.
 *
 * Two ways to change a flag, in order of precedence:
 *   1. Set the matching EXPO_PUBLIC_FEATURE_* variable in `.env` ("true"/"false")
 *      — per-build, no code change. Requires restarting Metro (`npx expo start -c`)
 *      because these are inlined at bundle time.
 *   2. Edit the default in this file — the fallback when the env var is unset.
 *
 * IMPORTANT: `payments` must stay in sync with the backend's PAYMENTS_ENABLED
 * setting. While payments are off the backend also lifts the freemium caps, so
 * turning one on without the other either walls users in with no way to
 * upgrade, or offers a paywall that buys nothing.
 */

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export const Features = {
  // Paywall, Upgrade buttons, payment screens
  payments: flag(process.env.EXPO_PUBLIC_FEATURE_PAYMENTS, false),
  // My Schools row, school search, enrolment
  schoolModule: flag(process.env.EXPO_PUBLIC_FEATURE_SCHOOL, false),

  // Always-on for this deploy (listed so every flag is visible in one place):
  aiTools: flag(process.env.EXPO_PUBLIC_FEATURE_AI, true),
  forum: flag(process.env.EXPO_PUBLIC_FEATURE_FORUM, true),
  realtimeChat: flag(process.env.EXPO_PUBLIC_FEATURE_CHAT, true),
};

export type FeatureKey = keyof typeof Features;

export const isEnabled = (key: FeatureKey): boolean => Features[key] === true;
