import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class PlannerRepository {
  final _client = ApiClient().dio;

  Future<List<dynamic>> getTimetable() async {
    final response = await _client.get(ApiConstants.timetable);
    return response.data['entries'] ?? [];
  }

  Future<void> saveTimetable(List<Map<String, dynamic>> entries) async {
    await _client.put(ApiConstants.timetable, data: {'entries': entries});
  }

  Future<Map<String, dynamic>> getProgress() async {
    final response = await _client.get(ApiConstants.progress);
    return response.data;
  }

  Future<void> logSession(int minutes) async {
    await _client.post(ApiConstants.logSession, data: {'minutes': minutes});
  }

  Future<void> registerFcmToken(String token) async {
    await _client.post(ApiConstants.fcmToken, data: {'token': token});
  }
}
