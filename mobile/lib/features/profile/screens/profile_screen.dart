import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  static const _roleLabels = {
    'student': 'Student', 'teacher': 'Teacher',
    'school_admin': 'School admin', 'super_admin': 'Super admin',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final isTeacher = user?.role == 'teacher' && (user?.isTeacherVerified ?? false);

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SizedBox(height: 8),
          Text('Profile', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 20),
          // Header card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.inputBorder, width: 0.5)),
            child: Row(children: [
              Container(
                width: 60, height: 60,
                decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                child: Center(child: Text(user?.initials ?? 'B', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22))),
              ),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(user?.fullName ?? 'Student', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 4),
                Text(user?.email ?? '', style: TextStyle(fontSize: 13, color: AppColors.textSecondary), overflow: TextOverflow.ellipsis),
                const SizedBox(height: 8),
                Row(children: [
                  _badge(_roleLabels[user?.role] ?? 'Student',
                      isTeacher ? AppColors.successLight : AppColors.primaryLight,
                      isTeacher ? AppColors.success : AppColors.textSecondary),
                  if (user?.isPro ?? false) ...[
                    const SizedBox(width: 6),
                    _badge('Pro', AppColors.action.withOpacity(0.15), AppColors.action),
                  ],
                ]),
              ])),
            ]),
          ),
          const SizedBox(height: 24),
          _menuTile(Icons.calendar_month_outlined, 'My timetable', 'Plan your weekly study sessions',
              () => context.push('/home/profile/timetable')),
          const SizedBox(height: 10),
          _menuTile(Icons.insights_outlined, 'My progress', 'Streak, hours and weekly activity',
              () => context.push('/home/profile/progress')),
          const SizedBox(height: 10),
          _menuTile(Icons.bookmark_outline, 'Bookmarks', 'Saved papers and notes',
              () => context.push('/home/resources/bookmarks')),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity, height: 52,
            child: OutlinedButton.icon(
              onPressed: () async {
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) context.go('/login');
              },
              icon: Icon(Icons.logout, color: AppColors.error, size: 20),
              label: Text('Log out', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.error)),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: AppColors.error.withOpacity(0.4), width: 1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _menuTile(IconData icon, String title, String subtitle, VoidCallback onTap) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.inputBorder, width: 0.5)),
      child: Row(children: [
        Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: AppColors.primaryMid, size: 22)),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(subtitle, style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
        ])),
        Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textMuted),
      ]),
    ),
  );

  Widget _badge(String label, Color bg, Color fg) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(fontSize: 11, color: fg, fontWeight: FontWeight.w500)),
  );
}
