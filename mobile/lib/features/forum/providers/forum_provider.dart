import 'package:flutter_riverpod/flutter_riverpod.dart';
// Riverpod 3: StateNotifier[Provider] live in the legacy export.
import 'package:flutter_riverpod/legacy.dart';
import '../data/forum_repository.dart';

class ForumFeedState {
  final bool isLoading;
  final List<dynamic> posts;
  final String filter;
  final String search;
  final String? error;
  const ForumFeedState({this.isLoading = false, this.posts = const [], this.filter = 'all', this.search = '', this.error});
  ForumFeedState copyWith({bool? isLoading, List<dynamic>? posts, String? filter, String? search, String? error}) =>
      ForumFeedState(isLoading: isLoading ?? this.isLoading, posts: posts ?? this.posts,
          filter: filter ?? this.filter, search: search ?? this.search, error: error);
}

class ForumFeedNotifier extends StateNotifier<ForumFeedState> {
  final ForumRepository _repo;
  ForumFeedNotifier(this._repo) : super(const ForumFeedState()) { load(); }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _repo.getPosts(filter: state.filter, search: state.search);
      state = state.copyWith(isLoading: false, posts: data['results']);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Could not load the forum.');
    }
  }

  void setFilter(String f) { state = state.copyWith(filter: f); load(); }
  void setSearch(String s) { state = state.copyWith(search: s); load(); }
}

final forumFeedProvider = StateNotifierProvider.autoDispose<ForumFeedNotifier, ForumFeedState>(
    (ref) => ForumFeedNotifier(ForumRepository()));

// Post detail
final postDetailProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, id) async {
  return ForumRepository().getPostDetail(id);
});
