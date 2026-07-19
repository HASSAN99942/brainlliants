import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/community_provider.dart';

class UserSearchScreen extends ConsumerStatefulWidget {
  const UserSearchScreen({super.key});
  @override
  ConsumerState<UserSearchScreen> createState() => _UserSearchScreenState();
}

class _UserSearchScreenState extends ConsumerState<UserSearchScreen> {
  final _controller = TextEditingController();
  Timer? _debounce;

  static const _avatarColors = [Color(0xFF7F77DD), Color(0xFF3C3489), Color(0xFF9F7AEA)];

  @override
  void initState() {
    super.initState();
    // Prime with an empty query so the first cards show without typing.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(userSearchProvider.notifier).search('');
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      ref.read(userSearchProvider.notifier).search(value.trim());
    });
  }

  @override
  Widget build(BuildContext context) {
    final results = ref.watch(userSearchProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text('Find people',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(20),
          child: TextField(
            controller: _controller,
            onChanged: _onChanged,
            style: TextStyle(fontSize: 15, color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Search students and teachers...',
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
        Expanded(
          child: results.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Could not search right now.',
                style: TextStyle(color: AppColors.textSecondary))),
            data: (users) => users.isEmpty
                ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.person_search_outlined, size: 56, color: AppColors.primaryLight),
                    const SizedBox(height: 12),
                    Text('No people found', style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
                  ]))
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    itemCount: users.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _userCard(users[i], i),
                  ),
          ),
        ),
      ]),
    );
  }

  Widget _userCard(Map user, int index) {
    final isTeacher = user['is_teacher'] == true;
    final exam = user['exam_level'];
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.inputBorder, width: 0.5),
      ),
      child: Row(children: [
        Container(
          width: 46, height: 46,
          decoration: BoxDecoration(color: _avatarColors[index % _avatarColors.length], shape: BoxShape.circle),
          child: Center(child: Text(user['initials'] ?? '?',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15))),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(user['display_name'] ?? '', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 6),
          Row(children: [
            _badge(isTeacher ? 'Teacher' : 'Student',
                isTeacher ? AppColors.successLight : AppColors.primaryLight,
                isTeacher ? AppColors.success : AppColors.textSecondary),
            if (exam != null && (exam as String).isNotEmpty) ...[
              const SizedBox(width: 6),
              _badge(exam, AppColors.primaryLight, AppColors.textSecondary),
            ],
          ]),
        ])),
        Icon(Icons.chevron_right, color: AppColors.textMuted, size: 22),
      ]),
    );
  }

  Widget _badge(String label, Color bg, Color fg) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(fontSize: 11, color: fg, fontWeight: FontWeight.w500)),
  );
}
