import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../auth/providers/auth_provider.dart';
import '../../ai_learning/screens/ai_hub_screen.dart';
import '../../content/screens/question_bank_screen.dart';
import '../../forum/screens/forum_screen.dart';
import '../../profile/screens/profile_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _tab = 0;

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: IndexedStack(
        index: _tab,
        children: [
          _buildHome(user),
          const AIHubScreen(),
          const QuestionBankScreen(),
          const ForumScreen(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.inputBorder, width: 0.5)),
        ),
        child: SafeArea(
          top: false,
          child: BottomNavigationBar(
            currentIndex: _tab,
            onTap: (i) => setState(() => _tab = i),
            backgroundColor: Colors.transparent,
            elevation: 0,
            selectedItemColor: AppColors.navActive,
            unselectedItemColor: AppColors.navInactive,
            type: BottomNavigationBarType.fixed,
            selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
            unselectedLabelStyle: const TextStyle(fontSize: 10),
            items: const [
              BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
              BottomNavigationBarItem(icon: Icon(Icons.auto_awesome_outlined), label: 'Learn'),
              BottomNavigationBarItem(icon: Icon(Icons.library_books_outlined), label: 'Resources'),
              BottomNavigationBarItem(icon: Icon(Icons.forum_outlined), label: 'Forum'),
              BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHome(user) => SafeArea(
    child: SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('$_greeting,', style: TextStyle(fontSize: 15, color: AppColors.textSecondary)),
            const SizedBox(height: 2),
            Text(user?.firstName ?? 'Student', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          ])),
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
            child: Center(child: Text(user?.initials ?? 'B', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
          ),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _chip('${user?.examLevel ?? 'GCE A/L'} · ${user?.specialty ?? 'Science'}', AppColors.primaryLight, AppColors.primary),
          const SizedBox(width: 8),
          _chip('● Online', AppColors.successLight, AppColors.success),
        ]),
        const SizedBox(height: 20),
        _heroCard(),
        const SizedBox(height: 20),
        Text('Quick access', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 10),
        SingleChildScrollView(scrollDirection: Axis.horizontal, child: Row(children: ['Maths', 'Physics', 'Chemistry', 'Biology', 'Literature'].map((s) => Padding(padding: const EdgeInsets.only(right: 8), child: _chip(s, AppColors.primaryLight, AppColors.primary))).toList())),
        const SizedBox(height: 20),
        Text("Today's features", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 10),
        _featureCard(Icons.auto_awesome_outlined, AppColors.primaryLight, AppColors.primaryMid, 'Chat with AI', 'Ask anything about your exam'),
        const SizedBox(height: 10),
        _featureCard(Icons.description_outlined, AppColors.successLight, AppColors.success, 'GCE A/L Physics 2023', 'Downloaded · Ready offline', trailing: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(8)), child: Text('PDF', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.success)))),
      ]),
    ),
  );

  Widget _chip(String label, Color bg, Color fg) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(50)),
    child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: fg)),
  );

  Widget _heroCard() => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(20)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Continue studying', style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.7))),
      const SizedBox(height: 6),
      const Text('Mathematics — Chapter 5', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
      const SizedBox(height: 14),
      ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: 0.62, backgroundColor: Colors.white.withOpacity(0.2), valueColor: AlwaysStoppedAnimation(AppColors.primaryMid), minHeight: 6)),
      const SizedBox(height: 8),
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text('62%', style: TextStyle(fontSize: 13, color: Colors.white.withOpacity(0.8))),
        Text('Resume >', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.action)),
      ]),
    ]),
  );

  Widget _featureCard(IconData icon, Color iconBg, Color iconColor, String title, String subtitle, {Widget? trailing}) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.inputBorder, width: 0.5)),
    child: Row(children: [
      Container(width: 44, height: 44, decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)), child: Icon(icon, color: iconColor, size: 22)),
      const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
        const SizedBox(height: 2),
        Text(subtitle, style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
      ])),
      trailing ?? Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textMuted),
    ]),
  );
}
