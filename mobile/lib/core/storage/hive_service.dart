import 'package:hive_flutter/hive_flutter.dart';

/// Thin wrapper around the Hive boxes the app relies on.
///
/// [init] must be called once from main() before runApp().
class HiveService {
  static const String _userBox = 'user_profile';
  static const String _authBox = 'auth';
  static const String _aiSummariesBox = 'ai_summaries';
  static const String _downloadedQuestionsBox = 'downloaded_questions';
  static const String _downloadedNotesBox = 'downloaded_notes';

  /// Cached current-user JSON (key: 'current_user').
  static late Box userProfile;

  /// JWT tokens (keys: 'access', 'refresh'). Used by [ApiClient].
  static late Box auth;

  /// Offline-saved AI summaries, keyed by session id. Works on web (IndexedDB).
  static late Box aiSummaries;

  /// Downloaded paper/note metadata, keyed by content id.
  static late Box downloadedQuestions;
  static late Box downloadedNotes;

  static Future<void> init() async {
    await Hive.initFlutter();
    userProfile = await Hive.openBox(_userBox);
    auth = await Hive.openBox(_authBox);
    aiSummaries = await Hive.openBox(_aiSummariesBox);
    downloadedQuestions = await Hive.openBox(_downloadedQuestionsBox);
    downloadedNotes = await Hive.openBox(_downloadedNotesBox);
  }
}
