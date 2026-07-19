import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class CommunityRepository {
  final _client = ApiClient().dio;

  Future<List<dynamic>> getGroups({String? language, String? examType}) async {
    final response = await _client.get(ApiConstants.groups, queryParameters: {
      if (language != null) 'language': language,
      if (examType != null) 'exam_type': examType,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> toggleJoin(String groupId) async {
    final response = await _client.post('${ApiConstants.groups}$groupId/join/');
    return response.data;
  }

  Future<List<dynamic>> getGroupPosts(String groupId) async {
    final response = await _client.get('${ApiConstants.groups}$groupId/posts/');
    return response.data;
  }

  Future<Map<String, dynamic>> createGroupPost(String groupId, String body) async {
    final response = await _client.post('${ApiConstants.groups}$groupId/posts/', data: {'body': body});
    return response.data;
  }

  /// Last ~50 chat messages for a group (WebSocket handles live messages).
  Future<List<dynamic>> getChatHistory(String groupId) async {
    final response = await _client.get('${ApiConstants.groups}$groupId/chat-history/');
    return response.data;
  }

  Future<List<dynamic>> searchUsers(String query) async {
    final response = await _client.get('/community/users/search/', queryParameters: {'q': query});
    return response.data;
  }

  Future<Map<String, dynamic>> getUserProfile(String userId) async {
    final response = await _client.get('/community/users/$userId/');
    return response.data;
  }
}
