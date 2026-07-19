import 'package:flutter/foundation.dart' show kIsWeb;
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/hive_service.dart';
// Real file download on mobile/desktop; no-op on web.
import 'download_helper_io.dart' if (dart.library.html) 'download_helper_web.dart' as dl;

/// Content bank API + offline metadata cache.
///
/// Web-safe: no `dart:io` / `path_provider` / `flutter_pdfview`. The download
/// endpoint enforces the freemium gate and returns the PDF URL; downloaded
/// items are tracked in Hive (metadata only). Viewing opens the URL via
/// [openPdf] (new tab on web). Physical offline-file storage + in-app native
/// PDF rendering are mobile-only follow-ups.
class ContentRepository {
  final _client = ApiClient().dio;

  Future<Map<String, dynamic>> getQuestions({
    String? examType, String? subject, String? year,
    String? language, String? search, String ordering = '-year', int page = 1,
  }) async {
    final response = await _client.get(ApiConstants.questions, queryParameters: {
      if (examType != null && examType != 'All') 'exam_type': examType,
      if (subject != null) 'subject': subject,
      if (year != null) 'year': year,
      if (language != null) 'language': language,
      if (search != null && search.isNotEmpty) 'search': search,
      'ordering': ordering,
      'page': page,
    });
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> getQuestionDetail(String id) async {
    final response = await _client.get('${ApiConstants.questions}$id/');
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> requestQuestionDownload(String id) async {
    final response = await _client.post('${ApiConstants.questions}$id/download/');
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> getNotes({
    String? examType, String? subject, String? language, String? search, int page = 1,
  }) async {
    final response = await _client.get(ApiConstants.notes, queryParameters: {
      if (examType != null && examType != 'All') 'exam_type': examType,
      if (subject != null) 'subject': subject,
      if (language != null) 'language': language,
      if (search != null && search.isNotEmpty) 'search': search,
      'page': page,
    });
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> requestNoteDownload(String id) async {
    final response = await _client.post('${ApiConstants.notes}$id/download/');
    return Map<String, dynamic>.from(response.data);
  }

  Future<List<dynamic>> getBookmarks() async {
    final response = await _client.get(ApiConstants.bookmarks);
    return List<dynamic>.from(response.data);
  }

  Future<bool> toggleBookmark(String contentType, String id) async {
    final response = await _client.post(ApiConstants.bookmarkToggle,
        data: {'content_type': contentType, 'id': id});
    return response.data['bookmarked'] as bool;
  }

  // ── Offline download ──────────────────────────────────────────────────
  /// Saves the PDF to device storage (mobile/desktop) and returns the local
  /// path; returns null on web (no persistent offline files there).
  Future<String?> downloadPdf(String url, String id, {void Function(double)? onProgress}) =>
      dl.downloadPdfToDevice(url, id, onProgress: onProgress);

  // ── Hive offline metadata ────────────────────────────────────────────
  void markQuestionDownloaded(String id, Map<String, dynamic> meta, {String? localPath}) {
    HiveService.downloadedQuestions.put(id, {
      ...meta,
      'local_path': localPath,
      'downloaded_at': DateTime.now().toIso8601String(),
    });
  }

  void markNoteDownloaded(String id, Map<String, dynamic> meta, {String? localPath}) {
    HiveService.downloadedNotes.put(id, {
      ...meta,
      'local_path': localPath,
      'downloaded_at': DateTime.now().toIso8601String(),
    });
  }

  String? localPathForQuestion(String id) => _localPath(HiveService.downloadedQuestions.get(id));
  String? localPathForNote(String id) => _localPath(HiveService.downloadedNotes.get(id));

  String? _localPath(dynamic data) {
    if (data == null) return null;
    final path = (data as Map)['local_path'] as String?;
    return dl.downloadedFileExists(path) ? path : null;
  }

  /// On mobile, "downloaded" means the file is present on disk (usable offline).
  /// On web there is no file, so metadata presence is the signal.
  bool isQuestionDownloaded(String id) =>
      kIsWeb ? HiveService.downloadedQuestions.containsKey(id) : localPathForQuestion(id) != null;
  bool isNoteDownloaded(String id) =>
      kIsWeb ? HiveService.downloadedNotes.containsKey(id) : localPathForNote(id) != null;
}
