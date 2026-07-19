import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../data/ai_repository.dart';

/// Past AI summaries, read from the offline Hive cache (works on web too).
class SessionsScreen extends ConsumerStatefulWidget {
  const SessionsScreen({super.key});
  @override
  ConsumerState<SessionsScreen> createState() => _SessionsScreenState();
}

class _SessionsScreenState extends ConsumerState<SessionsScreen> {
  late List<Map<String, dynamic>> _sessions;

  @override
  void initState() {
    super.initState();
    _sessions = AIRepository().getLocalSessions();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text('Past sessions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
      ),
      body: _sessions.isEmpty
          ? _emptyState()
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _sessions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) => _sessionCard(_sessions[i]),
            ),
    );
  }

  Widget _emptyState() => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.history_outlined, size: 56, color: AppColors.primaryLight),
          const SizedBox(height: 12),
          Text('No saved summaries yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          Text('Summarise a document to see it here.', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
        ]),
      );

  Widget _sessionCard(Map<String, dynamic> session) {
    final name = session['file_name'] ?? 'Summary';
    final questions = List<dynamic>.from(session['questions'] ?? []);
    final savedAt = _formatDate(session['saved_at']);
    return GestureDetector(
      onTap: () => _openSession(session),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.inputBorder, width: 0.5),
        ),
        child: Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
            child: Icon(Icons.description_outlined, color: AppColors.primaryMid, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name.toString(), maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
            const SizedBox(height: 2),
            Text('$savedAt · ${questions.length} questions', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          ])),
          Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textMuted),
        ]),
      ),
    );
  }

  void _openSession(Map<String, dynamic> session) {
    final questions = List<dynamic>.from(session['questions'] ?? []);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        builder: (_, scrollController) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.inputBorder, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),
            Text(session['file_name']?.toString() ?? 'Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 12),
            Expanded(
              child: SingleChildScrollView(
                controller: scrollController,
                child: Text(session['summary']?.toString() ?? '', style: TextStyle(fontSize: 14, color: AppColors.textPrimary, height: 1.6)),
              ),
            ),
            if (questions.isNotEmpty) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.push('/home/ai/quiz', extra: {
                      'questions': questions,
                      'sessionId': null,
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.action,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: Text('Start Quiz', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.actionText)),
                ),
              ),
            ],
          ]),
        ),
      ),
    );
  }

  String _formatDate(dynamic iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso.toString());
    if (dt == null) return '';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
