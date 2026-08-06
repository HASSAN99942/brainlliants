import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { plannerApi } from '../../features/planner/api';

/**
 * Registers a push token with the backend (POST /planner/fcm-token/).
 *
 * Everything is best-effort: remote push is NOT available in Expo Go on iOS,
 * and `getExpoPushTokenAsync` also needs an EAS projectId. Both throw, so this
 * must never be allowed to break the app in development.
 */
export async function initNotifications(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let granted = status === 'granted';
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === 'granted';
    }
    if (!granted) return false;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (!tokenData?.data) return false;

    await plannerApi.registerFcmToken(tokenData.data);
    return true;
  } catch {
    // Expo Go on iOS, no EAS project, or no network — not fatal.
    return false;
  }
}
