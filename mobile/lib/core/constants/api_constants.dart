import 'package:flutter/foundation.dart' show kIsWeb;

/// Central place for the API base URL and endpoint paths.
///
/// Base URL notes:
///  - Web (Chrome) / desktop reach the host directly on 127.0.0.1.
///  - Android emulator maps the host machine's localhost to 10.0.2.2.
/// The Django backend mounts everything under /api/ (see config/urls.py).
class ApiConstants {
  static final String baseUrl =
      kIsWeb ? 'http://127.0.0.1:8000/api' : 'http://10.0.2.2:8000/api';

  /// WebSocket origin (no /api prefix — Channels routes live at the root).
  /// Web/desktop hit 127.0.0.1; the Android emulator maps host localhost to 10.0.2.2.
  static final String wsBase =
      kIsWeb ? 'ws://127.0.0.1:8000' : 'ws://10.0.2.2:8000';

  // Auth (apps/accounts/urls.py, mounted at /api/auth/)
  static const String register = '/auth/register/student/';
  static const String registerTeacher = '/auth/register/teacher/';
  static const String verifyOtp = '/auth/verify-otp/';
  static const String resendOtp = '/auth/resend-otp/';
  static const String login = '/auth/login/';
  static const String logout = '/auth/logout/';
  static const String profile = '/auth/profile/';
  static const String changeLanguage = '/auth/language/';

  // AI learning (apps/ai_learning/urls.py, mounted at /api/ai/)
  static const String aiChat = '/ai/chat/';
  static const String aiSummarise = '/ai/summarise/';
  static const String aiQuizResult = '/ai/quiz-result/';
  static const String aiUsage = '/ai/usage/';
  static const String aiSessions = '/ai/sessions/';

  // Content bank (apps/content/urls.py, mounted at /api/content/)
  static const String questions = '/content/questions/';
  static const String notes = '/content/notes/';
  static const String bookmarks = '/content/bookmarks/';
  static const String bookmarkToggle = '/content/bookmarks/toggle/';

  // Forum (apps/forum/urls.py, mounted at /api/forum/)
  static const String forumPosts = '/forum/posts/';

  // Community & user search (apps/community/urls.py, mounted at /api/community/)
  static const String groups = '/community/groups/';

  // Planner: timetable, progress, sessions, FCM (mounted at /api/planner/)
  static const String timetable = '/planner/timetable/';
  static const String progress = '/planner/progress/';
  static const String logSession = '/planner/log-session/';
  static const String fcmToken = '/planner/fcm-token/';
}
