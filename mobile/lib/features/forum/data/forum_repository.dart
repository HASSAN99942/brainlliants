import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class ForumRepository {
  final _client = ApiClient().dio;

  Future<Map<String, dynamic>> getPosts({String? filter, String? search, int page = 1}) async {
    final response = await _client.get(ApiConstants.forumPosts, queryParameters: {
      if (filter != null && filter != 'all') 'filter': filter,
      if (search != null && search.isNotEmpty) 'search': search,
      'page': page,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getPostDetail(String id) async {
    final response = await _client.get('${ApiConstants.forumPosts}$id/');
    return response.data;
  }

  Future<Map<String, dynamic>> createPost(String title, String body) async {
    final response = await _client.post(ApiConstants.forumPosts, data: {'title': title, 'body': body});
    return response.data;
  }

  Future<Map<String, dynamic>> createReply(String postId, String body) async {
    final response = await _client.post('${ApiConstants.forumPosts}$postId/replies/', data: {'body': body});
    return response.data;
  }

  Future<Map<String, dynamic>> upvoteReply(String replyId) async {
    final response = await _client.post('/forum/replies/$replyId/upvote/');
    return response.data;
  }

  Future<void> markBestAnswer(String replyId) async {
    await _client.post('/forum/replies/$replyId/best/');
  }
}
