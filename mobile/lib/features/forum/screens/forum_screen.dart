import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/forum_provider.dart';

class ForumScreen extends ConsumerStatefulWidget {
  const ForumScreen({super.key});
  @override
  ConsumerState<ForumScreen> createState() => _ForumScreenState();
}

class _ForumScreenState extends ConsumerState<ForumScreen> {
  final _searchController = TextEditingController();
  static const _filters = ['all', 'resolved', 'unanswered'];
  static const _filterLabels = {'all': 'All', 'resolved': 'Resolved', 'unanswered': 'Unanswered'};

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(forumFeedProvider);
    final notifier = ref.read(forumFeedProvider.notifier);

    return SafeArea(
      child: Stack(children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Row(children: [
              Text('Forum', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const Spacer(),
              IconButton(icon: Icon(Icons.person_outline, color: AppColors.primaryMid),
                  onPressed: () => context.push('/home/forum/users')),
              IconButton(icon: Icon(Icons.school_outlined, color: AppColors.primaryMid),
                  onPressed: () => context.push('/home/forum/groups')),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: TextField(
              controller: _searchController,
              onSubmitted: notifier.setSearch,
              decoration: InputDecoration(
                hintText: 'Search questions...',
                hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 15),
                prefixIcon: Icon(Icons.search, color: AppColors.textMuted, size: 20),
                filled: true, fillColor: Colors.white,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.inputBorder, width: 0.5)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.primary, width: 1.5)),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 38,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: _filters.map((f) {
                final selected = state.filter == f;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => notifier.setFilter(f),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: selected ? AppColors.primary : AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(50),
                      ),
                      child: Text(_filterLabels[f]!, style: TextStyle(
                          fontSize: 13, fontWeight: FontWeight.w500,
                          color: selected ? Colors.white : AppColors.textPrimary)),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.posts.isEmpty
                    ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(Icons.forum_outlined, size: 56, color: AppColors.primaryLight),
                        const SizedBox(height: 12),
                        Text('No questions yet', style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
                      ]))
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 4, 20, 100),
                        itemCount: state.posts.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) => _postCard(context, state.posts[i]),
                      ),
          ),
        ]),
        Positioned(
          bottom: 20, right: 20,
          child: GestureDetector(
            onTap: () async {
              await context.push('/home/forum/create');
              notifier.load();
            },
            child: Container(
              width: 60, height: 60,
              decoration: BoxDecoration(color: AppColors.action, shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: AppColors.action.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))]),
              child: const Icon(Icons.add, color: Colors.white, size: 30),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _postCard(BuildContext context, Map post) {
    final author = post['author'] ?? {};
    final isTeacher = author['is_teacher'] ?? false;
    return GestureDetector(
      onTap: () => context.push('/home/forum/post', extra: post['id']),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.inputBorder, width: 0.5),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: Text(post['title'] ?? '', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1.3))),
            if (post['is_resolved'] == true) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(20)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.check, size: 12, color: AppColors.success),
                  const SizedBox(width: 4),
                  Text('Resolved', style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w500)),
                ]),
              ),
            ],
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Text(author['display_name'] ?? '', style: TextStyle(fontSize: 14, color: AppColors.primaryMid, fontWeight: FontWeight.w500)),
            if (isTeacher) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(12)),
                child: Text('Teacher', style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w500)),
              ),
            ],
            const Spacer(),
            Icon(Icons.chat_bubble_outline, size: 15, color: AppColors.textSecondary),
            const SizedBox(width: 4),
            Text('${post['reply_count'] ?? 0}', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
            const SizedBox(width: 12),
            Icon(Icons.visibility_outlined, size: 15, color: AppColors.textSecondary),
            const SizedBox(width: 4),
            Text('${post['view_count'] ?? 0}', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          ]),
        ]),
      ),
    );
  }
}
