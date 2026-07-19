import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../data/pdf_opener.dart';
import '../data/content_repository.dart';
import '../providers/content_provider.dart';

class BookmarksScreen extends ConsumerStatefulWidget {
  const BookmarksScreen({super.key});
  @override
  ConsumerState<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends ConsumerState<BookmarksScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _repo = ContentRepository();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bookmarksAsync = ref.watch(bookmarkProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text('Bookmarks',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: Container(
              height: 44,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
              child: TabBar(
                controller: _tabs,
                indicator: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: AppColors.textPrimary,
                unselectedLabelColor: AppColors.textSecondary,
                labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                tabs: const [Tab(text: 'Papers'), Tab(text: 'Notes')],
              ),
            ),
          ),
        ),
      ),
      body: bookmarksAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Could not load bookmarks.',
            style: TextStyle(color: AppColors.textSecondary))),
        data: (all) {
          final papers = all.where((b) => b['content_type'] == 'question').toList();
          final notes = all.where((b) => b['content_type'] == 'note').toList();
          return TabBarView(controller: _tabs, children: [
            _list(papers, isQuestion: true),
            _list(notes, isQuestion: false),
          ]);
        },
      ),
    );
  }

  Widget _list(List<dynamic> items, {required bool isQuestion}) {
    if (items.isEmpty) {
      return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.bookmark_border, size: 56, color: AppColors.primaryLight),
          const SizedBox(height: 12),
          Text('No bookmarks yet', style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
        ]),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _bookmarkCard(items[i], isQuestion: isQuestion),
    );
  }

  Widget _bookmarkCard(Map bookmark, {required bool isQuestion}) {
    final content = isQuestion ? bookmark['question'] : bookmark['note'];
    if (content == null) return const SizedBox.shrink();
    final id = content['id'] as String;
    final downloaded = isQuestion ? _repo.isQuestionDownloaded(id) : _repo.isNoteDownloaded(id);

    return GestureDetector(
      onTap: () {
        if (isQuestion) {
          context.push('/home/resources/detail', extra: Map<String, dynamic>.from(content));
        } else {
          openContentPdf(
            context,
            localPath: _repo.isNoteDownloaded(id) ? _repo.localPathForNote(id) : null,
            url: content['pdf_url'] as String?,
            title: content['title'] ?? 'PDF',
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.inputBorder, width: 0.5),
        ),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(content['title'] ?? '',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            _statusChip(downloaded),
          ])),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => ref.read(bookmarkProvider.notifier)
                .toggle(isQuestion ? 'question' : 'note', id),
            child: Icon(Icons.bookmark, color: AppColors.action, size: 24),
          ),
        ]),
      ),
    );
  }

  Widget _statusChip(bool downloaded) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: downloaded ? AppColors.successLight : const Color(0xFFEEEEEE),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          downloaded ? '✓ Downloaded' : 'Online',
          style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w500,
            color: downloaded ? AppColors.success : AppColors.textSecondary,
          ),
        ),
      );
}
