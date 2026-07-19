import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/hive_service.dart';

/// Singleton Dio wrapper.
///
/// Attaches the stored JWT access token to every request and, on a 401,
/// clears the stored tokens so the app can fall back to the login flow.
/// (The backend does not yet expose a token-refresh endpoint, so no silent
/// refresh is attempted here — that lands in a later sprint.)
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = HiveService.auth.get('access');
          if (token != null && token is String && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            await clearTokens();
          }
          handler.next(error);
        },
      ),
    );
  }

  Future<void> saveTokens(String access, String refresh) async {
    await HiveService.auth.put('access', access);
    await HiveService.auth.put('refresh', refresh);
  }

  Future<void> clearTokens() async {
    await HiveService.auth.delete('access');
    await HiveService.auth.delete('refresh');
  }

  String? get accessToken => HiveService.auth.get('access') as String?;
  String? get refreshToken => HiveService.auth.get('refresh') as String?;
}
