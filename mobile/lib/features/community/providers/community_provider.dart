import 'package:flutter_riverpod/flutter_riverpod.dart';
// Riverpod 3: StateNotifier[Provider] + AsyncValue live in the legacy export.
import 'package:flutter_riverpod/legacy.dart';
import '../data/community_repository.dart';

class GroupsState {
  final bool isLoading;
  final List<dynamic> groups;
  final String language;
  final String? error;
  const GroupsState({this.isLoading = false, this.groups = const [], this.language = 'en', this.error});
  GroupsState copyWith({bool? isLoading, List<dynamic>? groups, String? language, String? error}) =>
      GroupsState(isLoading: isLoading ?? this.isLoading, groups: groups ?? this.groups,
          language: language ?? this.language, error: error);
}

class GroupsNotifier extends StateNotifier<GroupsState> {
  final CommunityRepository _repo;
  GroupsNotifier(this._repo) : super(const GroupsState()) { load(); }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _repo.getGroups();
      state = state.copyWith(isLoading: false, groups: data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Could not load groups.');
    }
  }

  void setLanguage(String lang) => state = state.copyWith(language: lang);

  Future<void> toggleJoin(String groupId) async {
    try {
      final result = await _repo.toggleJoin(groupId);
      final updated = state.groups.map((g) {
        if (g['id'] == groupId) {
          return {...g, 'is_member': result['is_member'], 'member_count': result['member_count']};
        }
        return g;
      }).toList();
      state = state.copyWith(groups: updated);
    } catch (_) {}
  }
}

final groupsProvider = StateNotifierProvider.autoDispose<GroupsNotifier, GroupsState>(
    (ref) => GroupsNotifier(CommunityRepository()));

// User search
final userSearchProvider = StateNotifierProvider.autoDispose<UserSearchNotifier, AsyncValue<List<dynamic>>>(
    (ref) => UserSearchNotifier(CommunityRepository()));

class UserSearchNotifier extends StateNotifier<AsyncValue<List<dynamic>>> {
  final CommunityRepository _repo;
  UserSearchNotifier(this._repo) : super(const AsyncValue.data([]));

  Future<void> search(String query) async {
    state = const AsyncValue.loading();
    try {
      final results = await _repo.searchUsers(query);
      state = AsyncValue.data(results);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
