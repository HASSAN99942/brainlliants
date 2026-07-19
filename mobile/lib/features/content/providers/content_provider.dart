import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// Riverpod 3: StateNotifier[Provider] + AsyncValue live in the legacy export.
import 'package:flutter_riverpod/legacy.dart';
import '../data/content_repository.dart';

enum DownloadStatus { notDownloaded, downloading, downloaded, locked }

bool isLockedError(Object e) {
  if (e is DioException) {
    if (e.response?.statusCode == 403) return true;
    final data = e.response?.data;
    if (data is Map && data['error'] == 'limit_reached') return true;
  }
  return e.toString().contains('limit_reached') || e.toString().contains('403');
}

class ContentState {
  final bool isLoading;
  final List<dynamic> items;
  final String? error;
  final String selectedFilter; // 'All' or exam_type value
  final String search;
  final String ordering;
  final Map<String, DownloadStatus> downloadStatus; // by item id
  final Map<String, double> downloadProgress;

  const ContentState({
    this.isLoading = false, this.items = const [], this.error,
    this.selectedFilter = 'All', this.search = '', this.ordering = '-year',
    this.downloadStatus = const {}, this.downloadProgress = const {},
  });

  ContentState copyWith({
    bool? isLoading, List<dynamic>? items, String? error,
    String? selectedFilter, String? search, String? ordering,
    Map<String, DownloadStatus>? downloadStatus, Map<String, double>? downloadProgress,
  }) => ContentState(
    isLoading: isLoading ?? this.isLoading,
    items: items ?? this.items,
    error: error,
    selectedFilter: selectedFilter ?? this.selectedFilter,
    search: search ?? this.search,
    ordering: ordering ?? this.ordering,
    downloadStatus: downloadStatus ?? this.downloadStatus,
    downloadProgress: downloadProgress ?? this.downloadProgress,
  );
}

class QuestionListNotifier extends StateNotifier<ContentState> {
  final ContentRepository _repo;
  QuestionListNotifier(this._repo) : super(const ContentState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _repo.getQuestions(
        examType: state.selectedFilter,
        search: state.search,
        ordering: state.ordering,
      );
      final items = data['results'] as List;
      final statuses = <String, DownloadStatus>{};
      for (final item in items) {
        final id = item['id'] as String;
        statuses[id] = _repo.isQuestionDownloaded(id)
            ? DownloadStatus.downloaded
            : DownloadStatus.notDownloaded;
      }
      state = state.copyWith(isLoading: false, items: items, downloadStatus: statuses);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Could not load papers.');
    }
  }

  void setFilter(String filter) { state = state.copyWith(selectedFilter: filter); load(); }
  void setSearch(String value)  { state = state.copyWith(search: value); load(); }
  void toggleOrdering() {
    state = state.copyWith(ordering: state.ordering == '-year' ? 'year' : '-year');
    load();
  }

  /// Requests the (freemium-gated) download, then caches metadata in Hive.
  /// Returns the PDF url on success, null on failure (status flips to locked
  /// if the free limit was hit).
  Future<String?> download(String id, Map<String, dynamic> meta) async {
    state = state.copyWith(downloadStatus: {...state.downloadStatus, id: DownloadStatus.downloading});
    try {
      final result = await _repo.requestQuestionDownload(id);
      final url = result['pdf_url'] as String?;
      String? localPath;
      if (url != null) localPath = await _repo.downloadPdf(url, id);
      _repo.markQuestionDownloaded(id, meta, localPath: localPath);
      state = state.copyWith(downloadStatus: {...state.downloadStatus, id: DownloadStatus.downloaded});
      return url;
    } catch (e) {
      final locked = isLockedError(e);
      state = state.copyWith(downloadStatus: {
        ...state.downloadStatus,
        id: locked ? DownloadStatus.locked : DownloadStatus.notDownloaded,
      });
      return null;
    }
  }
}

final questionListProvider =
    StateNotifierProvider.autoDispose<QuestionListNotifier, ContentState>(
        (ref) => QuestionListNotifier(ContentRepository()));

class NoteListNotifier extends StateNotifier<ContentState> {
  final ContentRepository _repo;
  NoteListNotifier(this._repo) : super(const ContentState()) {
    load();
  }

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = await _repo.getNotes(examType: state.selectedFilter, search: state.search);
      final items = data['results'] as List;
      final statuses = <String, DownloadStatus>{};
      for (final item in items) {
        final id = item['id'] as String;
        statuses[id] = _repo.isNoteDownloaded(id)
            ? DownloadStatus.downloaded
            : DownloadStatus.notDownloaded;
      }
      state = state.copyWith(isLoading: false, items: items, downloadStatus: statuses);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Could not load notes.');
    }
  }

  void setFilter(String filter) { state = state.copyWith(selectedFilter: filter); load(); }
  void setSearch(String value)  { state = state.copyWith(search: value); load(); }

  Future<String?> download(String id, Map<String, dynamic> meta) async {
    state = state.copyWith(downloadStatus: {...state.downloadStatus, id: DownloadStatus.downloading});
    try {
      final result = await _repo.requestNoteDownload(id);
      final url = result['pdf_url'] as String?;
      String? localPath;
      if (url != null) localPath = await _repo.downloadPdf(url, id);
      _repo.markNoteDownloaded(id, meta, localPath: localPath);
      state = state.copyWith(downloadStatus: {...state.downloadStatus, id: DownloadStatus.downloaded});
      return url;
    } catch (e) {
      final locked = isLockedError(e);
      state = state.copyWith(downloadStatus: {
        ...state.downloadStatus,
        id: locked ? DownloadStatus.locked : DownloadStatus.notDownloaded,
      });
      return null;
    }
  }
}

final noteListProvider =
    StateNotifierProvider.autoDispose<NoteListNotifier, ContentState>(
        (ref) => NoteListNotifier(ContentRepository()));

// ── Bookmarks ────────────────────────────────────────────────────────
class BookmarkNotifier extends StateNotifier<AsyncValue<List<dynamic>>> {
  final ContentRepository _repo;
  BookmarkNotifier(this._repo) : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final data = await _repo.getBookmarks();
      state = AsyncValue.data(data);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> toggle(String contentType, String id) async {
    await _repo.toggleBookmark(contentType, id);
    load();
  }
}

final bookmarkProvider =
    StateNotifierProvider.autoDispose<BookmarkNotifier, AsyncValue<List<dynamic>>>(
        (ref) => BookmarkNotifier(ContentRepository()));
