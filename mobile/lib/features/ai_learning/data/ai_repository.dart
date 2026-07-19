import 'dart:typed_data';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/storage/hive_service.dart';

/// AI learning API + offline cache.
///
/// Deliberately free of `dart:io` so it compiles and runs on Flutter web.
/// File uploads are done from in-memory bytes (see [summarise]).
class AIRepository {
  final _client = ApiClient().dio;

  Future<Map<String, dynamic>> chat(List<Map<String, String>> messages) async {
    final response = await _client.post(
      ApiConstants.aiChat,
      data: {
        'messages': messages
            .map((m) => {'role': m['role'], 'content': m['content']})
            .toList(),
      },
    );
    return Map<String, dynamic>.from(response.data);
  }

  /// Upload a document as raw bytes. Cross-platform (web + mobile).
  /// [filename] drives the content type the backend validates against.
  Future<Map<String, dynamic>> summarise(
    Uint8List bytes,
    String filename,
    String language,
  ) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(
        bytes,
        filename: filename,
        contentType: DioMediaType.parse(_mimeForFilename(filename)),
      ),
      'language': language,
    });
    final response = await _client.post(
      ApiConstants.aiSummarise,
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
        receiveTimeout: const Duration(seconds: 60),
        sendTimeout: const Duration(seconds: 60),
      ),
    );
    return Map<String, dynamic>.from(response.data);
  }

  static String _mimeForFilename(String filename) {
    final name = filename.toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.docx')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    if (name.endsWith('.doc')) return 'application/msword';
    return 'application/octet-stream';
  }

  Future<Map<String, dynamic>> saveQuizResult(Map<String, dynamic> data) async {
    final response = await _client.post(ApiConstants.aiQuizResult, data: data);
    return Map<String, dynamic>.from(response.data);
  }

  Future<Map<String, dynamic>> getUsage() async {
    final response = await _client.get(ApiConstants.aiUsage);
    return Map<String, dynamic>.from(response.data);
  }

  Future<List<dynamic>> getSessions() async {
    final response = await _client.get(ApiConstants.aiSessions);
    return List<dynamic>.from(response.data);
  }

  // ── Hive offline cache ────────────────────────────────────────────────
  void saveSummaryLocally(String sessionId, Map<String, dynamic> data) {
    HiveService.aiSummaries.put(sessionId, data);
  }

  List<Map<String, dynamic>> getLocalSessions() {
    return HiveService.aiSummaries.values
        .map((v) => Map<String, dynamic>.from(v))
        .toList()
        .reversed
        .toList();
  }

  Map<String, dynamic>? getLocalSession(String sessionId) {
    final data = HiveService.aiSummaries.get(sessionId);
    if (data == null) return null;
    return Map<String, dynamic>.from(data);
  }
}
