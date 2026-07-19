import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/community_provider.dart';

class GroupsScreen extends ConsumerWidget {
  const GroupsScreen({super.key});

  static const _examLabels = {
    'GCE_OL': 'GCE O/L', 'GCE_AL': 'GCE A/L', 'BAC_A': 'BAC A', 'BAC_C': 'BAC C',
    'BAC_D': 'BAC D', 'BAC_E': 'BAC E', 'BAC_TECH': 'BAC Tech', 'BEPC': 'BEPC',
    'PROBATOIRE': 'Probatoire', 'HND': 'HND', 'CEP': 'CEP',
  };

  static const _avatarColors = [Color(0xFF7F77DD), Color(0xFF9F7AEA)];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(groupsProvider);
    final notifier = ref.read(groupsProvider.notifier);
    final visible = state.groups.where((g) => g['language'] == state.language).toList();

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white, elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text('Study groups',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: _langToggle(state.language, notifier.setLanguage),
          ),
        ],
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : visible.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.groups_outlined, size: 56, color: AppColors.primaryLight),
                  const SizedBox(height: 12),
                  Text('No groups here yet', style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
                ]))
              : GridView.builder(
                  padding: const EdgeInsets.all(20),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, mainAxisExtent: 210),
                  itemCount: visible.length,
                  itemBuilder: (context, i) => _groupCard(context, ref, visible[i], i),
                ),
    );
  }

  Widget _langToggle(String lang, void Function(String) onChange) => Container(
    padding: const EdgeInsets.all(3),
    decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(10)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      _langChip('EN', 'en', lang, onChange),
      _langChip('FR', 'fr', lang, onChange),
    ]),
  );

  Widget _langChip(String label, String value, String current, void Function(String) onChange) {
    final selected = current == value;
    return GestureDetector(
      onTap: () => onChange(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(label, style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: selected ? Colors.white : AppColors.textSecondary)),
      ),
    );
  }

  Widget _groupCard(BuildContext context, WidgetRef ref, Map group, int index) {
    final isMember = group['is_member'] == true;
    final examLabel = _examLabels[group['exam_type']] ?? group['exam_type'] ?? '';

    return GestureDetector(
      onTap: () => context.push('/home/forum/groups/detail', extra: Map<String, dynamic>.from(group)),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.inputBorder, width: 0.5),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: _avatarColors[index % _avatarColors.length], shape: BoxShape.circle),
            child: Center(child: Text(group['initials'] ?? '?',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
          ),
          const SizedBox(height: 12),
          Text(group['name'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary, height: 1.25)),
          const SizedBox(height: 8),
          if ((examLabel as String).isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(20)),
              child: Text(examLabel, style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500)),
            ),
          const Spacer(),
          Text('${group['member_count'] ?? 0} members', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity, height: 36,
            child: OutlinedButton(
              onPressed: () => ref.read(groupsProvider.notifier).toggleJoin(group['id']),
              style: OutlinedButton.styleFrom(
                backgroundColor: isMember ? AppColors.successLight : Colors.transparent,
                side: BorderSide(color: isMember ? AppColors.successLight : AppColors.primary, width: 1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: EdgeInsets.zero,
              ),
              child: Text(isMember ? '✓ Joined' : 'Join',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600,
                      color: isMember ? AppColors.success : AppColors.primary)),
            ),
          ),
        ]),
      ),
    );
  }
}
