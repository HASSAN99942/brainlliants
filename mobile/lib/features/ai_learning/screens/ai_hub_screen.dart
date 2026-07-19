import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../data/ai_repository.dart';

class AIHubScreen extends ConsumerStatefulWidget {
  const AIHubScreen({super.key});
  @override
  ConsumerState<AIHubScreen> createState() => _AIHubScreenState();
}

class _AIHubScreenState extends ConsumerState<AIHubScreen> {
  Map<String, dynamic>? _usage;

  @override
  void initState() {
    super.initState();
    _loadUsage();
  }

  Future<void> _loadUsage() async {
    try {
      final repo = AIRepository();
      final data = await repo.getUsage();
      if (mounted) setState(() => _usage = data);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final used = _usage?['used'] ?? 0;
    final limit = _usage?['limit'] ?? 20;
    final isPro = _usage?['is_pro'] ?? false;
    final progress = isPro ? 1.0 : (used / limit).clamp(0.0, 1.0);

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('AI learning tools',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 20),

          // Usage card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.inputBorder, width: 0.5),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Flexible(
                  child: Text(
                    isPro ? 'Pro — Unlimited queries' : '$used of $limit free queries used',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
                  ),
                ),
                if (!isPro)
                  GestureDetector(
                    onTap: () => context.push('/paywall'),
                    child: Text('Upgrade', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.action)),
                  ),
              ]),
              if (!isPro) ...[
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: AppColors.inputBorder,
                    valueColor: AlwaysStoppedAnimation(AppColors.action),
                    minHeight: 6,
                  ),
                ),
              ],
            ]),
          ),
          const SizedBox(height: 14),

          // Feature cards
          _featureCard(
            icon: Icons.chat_bubble_outline,
            title: 'Chat with AI',
            subtitle: 'Ask anything about your exam',
            onTap: () => context.push('/home/ai/chat'),
          ),
          const SizedBox(height: 10),
          _featureCard(
            icon: Icons.description_outlined,
            title: 'Summarise notes',
            subtitle: 'Upload PDF or Word',
            onTap: () => context.push('/home/ai/summarise'),
          ),
          const SizedBox(height: 10),
          _featureCard(
            icon: Icons.history_outlined,
            title: 'Past sessions',
            subtitle: 'View saved summaries',
            onTap: () => context.push('/home/ai/sessions'),
          ),
        ]),
      ),
    );
  }

  Widget _featureCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) =>
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.cardSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.inputBorder, width: 0.5),
        ),
        child: Row(children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: AppColors.primaryMid, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            const SizedBox(height: 2),
            Text(subtitle, style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          ])),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(color: AppColors.action, borderRadius: BorderRadius.circular(20)),
              child: Text('Open', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.actionText)),
            ),
          ),
        ]),
      );
}
