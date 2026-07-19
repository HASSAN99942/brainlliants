import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../data/content_repository.dart';
import '../data/pdf_opener.dart';
import '../providers/content_provider.dart';

const _filters = ['All', 'GCE_AL', 'BAC_D', 'BEPC', 'HND'];
const _filterLabels = {'All': 'All', 'GCE_AL': 'GCE A/L', 'BAC_D': 'BAC D', 'BEPC': 'BEPC', 'HND': 'HND'};
const _examLabels = {
  'GCE_OL': 'GCE O/L', 'GCE_AL': 'GCE A/L', 'BAC_A': 'BAC A', 'BAC_C': 'BAC C',
  'BAC_D': 'BAC D', 'BAC_E': 'BAC E', 'BAC_TECH': 'BAC Tech', 'BEPC': 'BEPC',
  'PROBATOIRE': 'Probatoire', 'HND': 'HND', 'CEP': 'CEP',
};

class QuestionBankScreen extends ConsumerStatefulWidget {
  const QuestionBankScreen({super.key});
  @override
  ConsumerState<QuestionBankScreen> createState() => _QuestionBankScreenState();
}

class _QuestionBankScreenState extends ConsumerState<QuestionBankScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 12, 0),
          child: Row(children: [
            Expanded(
              child: Text('Question bank',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            ),
            IconButton(
              icon: Icon(Icons.bookmark_border, color: AppColors.primaryMid),
              onPressed: () => context.push('/home/resources/bookmarks'),
            ),
          ]),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
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
              tabs: const [Tab(text: 'Past Papers'), Tab(text: 'Notes')],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: TabBarView(controller: _tabs, children: [
            _PapersTab(searchController: _searchController),
            const _NotesTab(),
          ]),
        ),
      ]),
    );
  }
}

class _PapersTab extends ConsumerWidget {
  final TextEditingController searchController;
  const _PapersTab({required this.searchController});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(questionListProvider);
    final notifier = ref.read(questionListProvider.notifier);

    return Column(children: [
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: TextField(
          controller: searchController,
          onSubmitted: notifier.setSearch,
          style: TextStyle(fontSize: 15, color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: 'Search papers, subjects...',
            hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 15),
            prefixIcon: Icon(Icons.search, color: AppColors.textMuted, size: 20),
            filled: true, fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: AppColors.primary, width: 1.5)),
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
          ),
        ),
      ),
      const SizedBox(height: 12),
      _FilterChips(
        selected: state.selectedFilter,
        onSelect: notifier.setFilter,
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
        child: Align(
          alignment: Alignment.centerRight,
          child: GestureDetector(
            onTap: notifier.toggleOrdering,
            child: Text(
              state.ordering == '-year' ? 'By year ↓' : 'By year ↑',
              style: TextStyle(fontSize: 14, color: AppColors.primaryMid, fontWeight: FontWeight.w500),
            ),
          ),
        ),
      ),
      const SizedBox(height: 4),
      Expanded(
        child: state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : state.items.isEmpty
                ? _emptyState('No papers found')
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                    itemCount: state.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final item = state.items[i];
                      final id = item['id'] as String;
                      final status = state.downloadStatus[id] ?? DownloadStatus.notDownloaded;
                      return _PaperCard(
                        item: item,
                        status: status,
                        onTap: () => context.push('/home/resources/detail', extra: item),
                        onDownload: () async {
                          await notifier.download(id, Map<String, dynamic>.from(item));
                          if (!context.mounted) return;
                          if (ref.read(questionListProvider).downloadStatus[id] == DownloadStatus.locked) {
                            context.push('/paywall');
                          }
                        },
                      );
                    },
                  ),
      ),
    ]);
  }
}

class _NotesTab extends ConsumerWidget {
  const _NotesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(noteListProvider);
    final notifier = ref.read(noteListProvider.notifier);

    return Column(children: [
      _FilterChips(selected: state.selectedFilter, onSelect: notifier.setFilter),
      const SizedBox(height: 8),
      Expanded(
        child: state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : state.items.isEmpty
                ? _emptyState('No notes found', icon: Icons.description_outlined)
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                    itemCount: state.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final item = state.items[i];
                      final id = item['id'] as String;
                      final status = state.downloadStatus[id] ?? DownloadStatus.notDownloaded;
                      return _PaperCard(
                        item: {...item, 'format': 'pdf', 'year': null},
                        status: status,
                        onTap: () => openContentPdf(
                          context,
                          localPath: ContentRepository().localPathForNote(id),
                          url: item['pdf_url'] as String?,
                          title: item['title'] ?? 'PDF',
                        ),
                        onDownload: () async {
                          await notifier.download(id, Map<String, dynamic>.from(item));
                          if (!context.mounted) return;
                          if (ref.read(noteListProvider).downloadStatus[id] == DownloadStatus.locked) {
                            context.push('/paywall');
                          }
                        },
                      );
                    },
                  ),
      ),
    ]);
  }
}

class _FilterChips extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onSelect;
  const _FilterChips({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        children: _filters.map((f) {
          final isSel = selected == f;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => onSelect(f),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isSel ? AppColors.primary : AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(50),
                ),
                alignment: Alignment.center,
                child: Text(_filterLabels[f]!, style: TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w500,
                    color: isSel ? Colors.white : AppColors.textPrimary)),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

Widget _emptyState(String msg, {IconData icon = Icons.inbox_outlined}) => Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 56, color: AppColors.primaryLight),
        const SizedBox(height: 12),
        Text(msg, style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
      ]),
    );

class _PaperCard extends StatelessWidget {
  final Map item;
  final DownloadStatus status;
  final VoidCallback onTap;
  final VoidCallback onDownload;
  const _PaperCard({required this.item, required this.status, required this.onTap, required this.onDownload});

  @override
  Widget build(BuildContext context) {
    final isQuiz = item['format'] == 'json' || item['format'] == 'both';
    final sizeMb = ((item['file_size_kb'] ?? 0) / 1024).toStringAsFixed(1);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.inputBorder, width: 0.5),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: Text(item['title'] ?? '',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary))),
            const SizedBox(width: 8),
            _statusIcon(),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(50)),
              child: Text(_examLabels[item['exam_type']] ?? item['exam_type'] ?? '',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
            const SizedBox(width: 8),
            Flexible(child: _chip(item['subject'] ?? '')),
            if (item['year'] != null) ...[const SizedBox(width: 8), _chip('${item['year']}')],
            const Spacer(),
            Icon(isQuiz ? Icons.auto_awesome_outlined : Icons.description_outlined,
                size: 15, color: AppColors.textSecondary),
            const SizedBox(width: 4),
            Text('${isQuiz ? 'Quiz' : 'PDF'} · $sizeMb MB',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          ]),
        ]),
      ),
    );
  }

  Widget _chip(String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(50)),
        child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, color: AppColors.textPrimary)),
      );

  Widget _statusIcon() {
    switch (status) {
      case DownloadStatus.downloaded:
        return Container(
          width: 32, height: 32,
          decoration: BoxDecoration(color: AppColors.successLight, shape: BoxShape.circle),
          child: Icon(Icons.check, size: 18, color: AppColors.success),
        );
      case DownloadStatus.downloading:
        return const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2));
      case DownloadStatus.locked:
        return GestureDetector(onTap: onDownload,
            child: Icon(Icons.lock_outline, size: 24, color: AppColors.primaryMid));
      case DownloadStatus.notDownloaded:
        return GestureDetector(onTap: onDownload,
            child: Icon(Icons.cloud_download_outlined, size: 24, color: AppColors.primaryMid));
    }
  }
}
