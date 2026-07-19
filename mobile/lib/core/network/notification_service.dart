import 'package:flutter/foundation.dart';
import '../../features/planner/data/planner_repository.dart';

/// Push-notification bootstrap.
///
/// Real FCM needs a configured Firebase project (google-services.json on
/// Android, a service worker + web push certificate on web). None of that is
/// wired on this machine and the app is being tested on Flutter web, so this
/// is a deliberate no-op stub — it never imports `firebase_messaging`, which
/// keeps the web build clean and pub resolution untouched.
///
/// The backend side is complete: `POST /api/planner/fcm-token/` is live and
/// [PlannerRepository.registerFcmToken] calls it. When Firebase is added
/// later, obtain the device token from `FirebaseMessaging.instance.getToken()`
/// and pass it to [registerToken] below — no other change is required.
class NotificationService {
  /// Called once at startup. Safe on every platform; currently does nothing.
  static Future<void> init() async {
    if (kDebugMode) {
      debugPrint('[NotificationService] FCM disabled (no Firebase config). '
          'Backend endpoint /api/planner/fcm-token/ is ready when a token exists.');
    }
  }

  /// Registers a real FCM device token with the backend. Wire this up once
  /// Firebase is configured. Failures are swallowed so startup never breaks.
  static Future<void> registerToken(String token) async {
    try {
      await PlannerRepository().registerFcmToken(token);
    } catch (_) {}
  }
}
